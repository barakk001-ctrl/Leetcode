const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

http
  .createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let filePath = path.join(ROOT, urlPath === "/" ? "index.html" : urlPath);

    if (!filePath.startsWith(ROOT)) {
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
