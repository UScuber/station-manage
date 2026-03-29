import crypto from "crypto";
import fs from "fs";
import { promises as fsp } from "fs";
import path from "path";
import { config as loadDotenv } from "dotenv";
import {
  GetObjectCommand,
  S3Client,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";

loadDotenv({ path: path.resolve(process.cwd(), ".env") });

type LatestManifest = {
  file: string;
  sha256?: string;
};

const DB_FILE_NAME = "station-initial.db";
const dbPath = path.resolve(process.cwd(), DB_FILE_NAME);
const latestKey = process.env.R2_LATEST_KEY || "initial-db/latest.json";

const isSha256 = (value: string): boolean => /^[a-f0-9]{64}$/i.test(value);

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env: ${key}`);
  }
  return value;
};

const createR2Client = (): { client: S3Client; bucket: string } => {
  const accountId = getRequiredEnv("R2_ACCOUNT_ID");
  const bucket = getRequiredEnv("R2_BUCKET");
  const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return { client, bucket };
};

const toBuffer = async (
  body: GetObjectCommandOutput["Body"],
  key: string,
): Promise<Buffer> => {
  if (!body) {
    throw new Error(`R2 object body is empty: ${key}`);
  }

  if (typeof body.transformToByteArray === "function") {
    const byteArray = await body.transformToByteArray();
    return Buffer.from(byteArray);
  }

  throw new Error(`R2 object body is not byte-transformable: ${key}`);
};

const getObjectAsBuffer = async (
  client: S3Client,
  bucket: string,
  key: string,
): Promise<Buffer> => {
  const res = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  return toBuffer(res.Body, key);
};

const getObjectAsText = async (
  client: S3Client,
  bucket: string,
  key: string,
): Promise<string> => {
  const data = await getObjectAsBuffer(client, bucket, key);
  return data.toString("utf8");
};

const parseLatestManifest = (rawJson: string): LatestManifest => {
  const parsed = JSON.parse(rawJson) as Partial<LatestManifest>;

  if (typeof parsed.file !== "string" || parsed.file.length === 0) {
    throw new Error("latest.json missing required field: file");
  }

  if (parsed.sha256 !== undefined && typeof parsed.sha256 !== "string") {
    throw new Error("latest.json field sha256 must be a string when provided");
  }

  return {
    file: parsed.file,
    sha256: parsed.sha256,
  };
};

const parseShaText = (raw: string): string => {
  const firstToken = raw.trim().split(/\s+/)[0] || "";
  const normalized = firstToken.toLowerCase();
  return isSha256(normalized) ? normalized : "";
};

const calcSha256 = async (filePath: string): Promise<string> => {
  const hash = crypto.createHash("sha256");
  const input = fs.createReadStream(filePath);

  await new Promise<void>((resolve, reject) => {
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve());
    input.on("error", reject);
  });

  return hash.digest("hex");
};

const resolveExpectedSha = async (
  client: S3Client,
  bucket: string,
  latest: LatestManifest,
): Promise<string> => {
  const fromManifest = latest.sha256?.trim().toLowerCase() ?? "";
  if (isSha256(fromManifest)) {
    return fromManifest;
  }

  const sidecarKey = latest.file.endsWith(".db")
    ? latest.file.replace(/\.db$/, ".sha256")
    : `${latest.file}.sha256`;
  const sidecarText = await getObjectAsText(client, bucket, sidecarKey);
  const fromSidecar = parseShaText(sidecarText);

  if (!isSha256(fromSidecar)) {
    throw new Error(
      "Could not determine valid sha256 from latest.json or sidecar file",
    );
  }

  return fromSidecar;
};

const downloadDbFile = async (
  client: S3Client,
  bucket: string,
  key: string,
): Promise<void> => {
  const dbRaw = await getObjectAsBuffer(client, bucket, key);
  await fsp.mkdir(path.dirname(dbPath), { recursive: true });
  await fsp.writeFile(dbPath, dbRaw);
};

const main = async (): Promise<void> => {
  if (fs.existsSync(dbPath)) {
    console.log(`${DB_FILE_NAME} already exists, skip download: ${dbPath}`);
    return;
  }

  const { client, bucket } = createR2Client();
  const latestJson = await getObjectAsText(client, bucket, latestKey);
  const latest = parseLatestManifest(latestJson);
  const expectedSha = await resolveExpectedSha(client, bucket, latest);

  await downloadDbFile(client, bucket, latest.file);

  const actualSha = await calcSha256(dbPath);
  if (actualSha !== expectedSha) {
    await fsp.unlink(dbPath);
    throw new Error(
      `SHA-256 mismatch: expected=${expectedSha} actual=${actualSha} key=${latest.file}`,
    );
  }

  console.log(
    `Downloaded and verified station-initial.db from R2: ${latest.file}`,
  );
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
