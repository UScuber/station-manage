import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";


const contents = Array.from(Deno.readDirSync("build")).map(dir => "/" + dir.name);
const HTML = await Deno.readFile("./build/index.html");

serve(
  async(req: Request) => {
    const path = new URL(req.url).pathname;

    if(contents.includes(path) || path.startsWith("/assets")){
      const response = await serveDir(req, { fsRoot: "build" });
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800");
      return new Response(response.body, {
        ...response,
        headers,
      });
    }
    return new Response(HTML, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  }
);
