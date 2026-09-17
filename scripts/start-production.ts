import { execSync } from "child_process";
import { createServer } from "http";
import { parse } from "url";
import next from "next";

/** Node 18+ defaults to 300s; Lobato (~225 MB) can exceed that on slow uplinks. */
const REQUEST_TIMEOUT_MS = 60 * 60 * 1000;

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("pnpm db:migrate");
run("pnpm db:seed");

const port = parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer({ requestTimeout: REQUEST_TIMEOUT_MS }, (req, res) => {
    void handle(req, res, parse(req.url ?? "", true)).catch((err: unknown) => {
      console.error("Request failed", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    });
  });

  server.headersTimeout = REQUEST_TIMEOUT_MS + 1000;
  server.keepAliveTimeout = 72_000;

  server.listen(port, hostname, () => {
    console.log(
      `> Ready on http://${hostname}:${port} (requestTimeout=${REQUEST_TIMEOUT_MS}ms)`,
    );
  });
});
