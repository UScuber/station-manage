import { FastifyReply } from "fastify";

// --- Fastify module augmentation ---
declare module "fastify" {
  interface FastifyRequest {
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    userRole: number | null;
    isAdmin: boolean;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply?: FastifyReply) => Promise<void>;
    authenticateAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// --- DB row types ---

export interface UserRow {
  userId: string;
  userName: string;
  userEmail: string;
  role: number;
  hash: string;
}

export interface SessionRow {
  userId: string;
  sessionId: string;
  updatedDate: string;
}

export interface StationRow {
  stationCode: number;
  stationGroupCode: number;
  railwayCode: number;
  latitude: number;
  longitude: number;
  getDate: string | null;
  passDate: string | null;
}

export interface StationGroupRow {
  stationGroupCode: number;
  stationName: string;
  kana: string;
  latitude: number;
  longitude: number;
  prefCode: number;
}

export interface RailwayRow {
  railwayCode: number;
  railwayName: string;
  formalName: string;
  railwayKana: string;
  railwayColor: string;
  companyCode: number;
}

export interface CompanyRow {
  companyCode: number;
  companyName: string;
  formalName: string;
}

export interface PrefectureRow {
  code: number;
  name: string;
}

export interface NextStationRow {
  stationCode: number;
  nextStationCode: number;
  direction: number;
}

export interface RailPathRow {
  railwayCode: number;
  pathId: number;
  ord: number;
  latitude: number;
  longitude: number;
}

export interface TimetableLinkRow {
  stationCode: number;
  direction: string;
  url: string;
}

export interface TrainPosLinkRow {
  stationCode: number;
  url: string | null;
}

export interface StationHistoryRow {
  stationCode: number;
  date: string;
  state: number;
  userId: string;
}

export interface StationGroupHistoryRow {
  stationGroupCode: number;
  date: string;
  userId: string;
}

export interface LatestStationHistoryRow {
  stationCode: number;
  date: string | null;
  state: number;
  userId: string;
}

export interface LatestStationGroupHistoryRow {
  stationGroupCode: number;
  date: string | null;
  userId: string;
}

// --- User data returned by status ---

export interface UserData {
  userId: string;
  userName: string;
  userEmail: string;
  role: number;
}

// --- History map types ---

export interface HistoryMapEntry {
  hasGet: boolean;
  hasPass: boolean;
}

// --- Export/Import JSON types ---

export interface ExportStationHistory {
  history: { date: string; state: number }[];
  info: Record<string, unknown>;
}

export interface ExportStationGroupHistory {
  history: { date: string }[];
  info: Record<string, unknown>;
}

export interface ExportHistoryJSON {
  station_history: ExportStationHistory[];
  station_group_history: ExportStationGroupHistory[];
}

export interface StationURLData {
  stationCode: number;
  timetable: { direction: string; url: string }[];
  trainPosURL: string | null;
}

export interface ExportStationURLJSON {
  data: StationURLData[];
}

// --- GeoJSON types ---

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "MultiLineString";
    coordinates: number[][][];
  };
  properties: Record<string, unknown>;
}
