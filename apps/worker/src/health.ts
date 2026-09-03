import { createServer } from "node:http";
import { loopHealth } from "./loop.js";

// The worker's ONLY inbound HTTP (AD-2). /health exposes last-loop-tick age so the external
// liveness probe can detect a wedged worker that cannot alert for itself (AD-7); watchdog
// releases and round duration ride along so the failover drill can observe them.
export const startHealthServer = (port: number): void => {
  createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, ...loopHealth() }));
      return;
    }
    res.writeHead(404);
    res.end();
  }).listen(port);
};
