
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(join(fileURLToPath(import.meta.url), "..", "app"));
const port = Number(process.argv[2] ?? 8080);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

function safePath(urlPath: string): string | null {
  const cleaned = normalize(urlPath === "/" ? "/index.html" : urlPath).replace(/^\/+/, "");
  const full = resolve(join(root, cleaned));
  if (full !== root && !full.startsWith(root + sep)) return null;
  return full;
}

const server = createServer((request, response) => {
  const path = safePath(new URL(request.url ?? "/", "http://localhost").pathname);
  if (path === null) {
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("Bad path.\n");
    return;
  }
  let size = 0;
  try {
    size = statSync(path).size;
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found.\n");
    return;
  }
  const type = types[extname(path).toLowerCase()] ?? "application/octet-stream";
  response.writeHead(200, {
    "content-type": type,
    "content-length": size,
    "cache-control": "no-store",
  });
  createReadStream(path).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Leonida Trophy Ledger is on http://localhost:${port}`);
});

