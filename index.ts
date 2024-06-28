import { serve } from "https://deno.land/std@0.188.0/http/server.ts";

const contents = Array.from(Deno.readDirSync("build")).map(dir => "/" + dir.name);

serve(
  async(req: Request) => {
    const path = new URL(req.url).pathname;
    const file_path = "build" + (contents.includes(path) || path.startsWith("/assets") ? path : "/index.html");
    const file = await Deno.open(file_path, { read: true });
    return new Response(file.readable);
  }
);
