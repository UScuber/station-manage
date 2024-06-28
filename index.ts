import { serve } from "https://deno.land/std@0.188.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";


const contents = Array.from(Deno.readDirSync("build")).map(dir => "/" + dir.name);
const HTML = await Deno.readFile("./build/index.html");

serve(
  async(req: Request) => {
    const path = new URL(req.url).pathname;

    if(contents.includes(path) || path.startsWith("/assets")){
      return serveDir(req, {
        fsRoot: "build",
      });
    }
    return new Response(HTML, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  }
);
