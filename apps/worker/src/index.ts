import { readEndpoints } from "@proof-league/chain";
import { startLoop } from "./loop.js";
import { startHealthServer } from "./health.js";

// Boot validates config before anything runs (CONVENTIONS §9): a misconfigured worker must
// refuse to start, not settle against the wrong endpoints.
const endpoints = readEndpoints(process.env);
const HEALTH_PORT = Number(process.env.PORT ?? 8080);

startHealthServer(HEALTH_PORT);
startLoop(async () => {
  // Pipeline phases land in Story 2.8 (watch -> attest-wait -> prove -> submit -> project).
  // Until then the loop only proves liveness; it performs no chain writes.
});

console.log(`[worker] up. cc3=${endpoints.CC3_RPC_URL} health=:${HEALTH_PORT}`);
