const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "sync-data");
const MAX_BODY = 2 * 1024 * 1024;

fs.mkdirSync(DATA_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(obj));
}

function stateFile(key) {
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return path.join(DATA_DIR, "kg-" + hash + ".json");
}

function handleApi(req, res, url) {
  const key = (url.searchParams.get("key") || "").trim();
  if (url.pathname !== "/api/state") return sendJson(res, 404, { error: "unknown endpoint" });
  if (key.length < 6) return sendJson(res, 400, { error: "key must be at least 6 characters" });

  if (req.method === "GET") {
    fs.readFile(stateFile(key), "utf8", (err, raw) => {
      if (err) return sendJson(res, 404, { error: "no state for this key yet" });
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      res.end(raw);
    });
    return;
  }

  if (req.method === "PUT") {
    let size = 0;
    const chunks = [];
    req.on("data", (d) => {
      size += d.length;
      if (size > MAX_BODY) {
        sendJson(res, 413, { error: "state too large" });
        req.destroy();
      } else chunks.push(d);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return;
      let state;
      try {
        state = JSON.parse(Buffer.concat(chunks).toString("utf8")).state;
        if (!state || typeof state !== "object") throw new Error("bad shape");
      } catch (e) {
        return sendJson(res, 400, { error: "body must be JSON: {state: {...}}" });
      }
      const wrapped = JSON.stringify({ updatedAt: Date.now(), state });
      const file = stateFile(key);
      const tmp = file + ".tmp";
      fs.writeFile(tmp, wrapped, (err) => {
        if (err) return sendJson(res, 500, { error: "write failed" });
        fs.rename(tmp, file, (err2) => {
          if (err2) return sendJson(res, 500, { error: "write failed" });
          sendJson(res, 200, { ok: true });
        });
      });
    });
    return;
  }

  sendJson(res, 405, { error: "use GET or PUT" });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");

    if (url.pathname.startsWith("/api/")) return handleApi(req, res, url);

    const urlPath = decodeURIComponent(url.pathname);
    let filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);

    if (!filePath.startsWith(ROOT) || filePath.startsWith(DATA_DIR)) {
      res.writeHead(403).end("Forbidden");
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        // unknown paths fall back to the app shell
        fs.readFile(path.join(ROOT, "index.html"), (err2, index) => {
          if (err2) return res.writeHead(500).end("Server error");
          res.writeHead(200, { "Content-Type": MIME[".html"] }).end(index);
        });
        return;
      }
      const type = MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" }).end(data);
    });
  })
  .listen(PORT, () => console.log("Kotlin Grind serving on port " + PORT));
