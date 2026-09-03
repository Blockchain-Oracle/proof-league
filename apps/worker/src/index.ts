import { DEPLOYED, readEndpoints } from "@proof-league/chain";
import { cc3Clients, readWorkerKey } from "./cc3.js";
import { startLoop } from "./loop.js";
import { startHealthServer } from "./health.js";
import { runVoidRound } from "./void-round.js";

// Boot validates config before anything runs (CONVENTIONS §9): a misconfigured worker must
// refuse to start, not settle against the wrong endpoints.
const endpoints = readEndpoints(process.env);
const HEALTH_PORT = Number(process.env.PORT ?? 8080);

startHealthServer(HEALTH_PORT);

const leagueCore = DEPLOYED.leagueCore;
if (leagueCore === undefined) {
  // No deployment yet (Story 5.4 fills packages/chain/src/contracts.ts): nothing exists
  // to void or settle, so the loop only proves liveness and performs no chain writes.
  startLoop(async () => {});
  console.log(`[worker] up, no deployed core yet. cc3=${endpoints.CC3_RPC_URL} health=:${HEALTH_PORT}`);
} else {
  // The key is required the moment a deployment is configured — validated at boot, §9.
  const clients = cc3Clients(endpoints.CC3_RPC_URL, readWorkerKey(process.env));
  startLoop(async () => {
    // Story 2.6: the AD-19 void duty. Settlement phases (watch -> attest-wait -> prove ->
    // submit -> project) join this round in Story 2.8.
    const report = await runVoidRound(leagueCore, clients);
    if (report.voided.length > 0) {
      console.log(`[worker] voided markets past deadline: ${report.voided.join(", ")}`);
    }
  });
  console.log(`[worker] up. core=${leagueCore} cc3=${endpoints.CC3_RPC_URL} health=:${HEALTH_PORT}`);
}
