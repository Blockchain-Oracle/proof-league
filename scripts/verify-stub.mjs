// verify:* namespace placeholder (CONVENTIONS §8). Each real script is owned by the story that
// ships its judged claim: commit→2.2, void→2.6, settlement→2.8, payout→2.10, hosted-round→5.2.
// A stub exits 1 so it can never be cited as passing evidence.
const owner = { commit: "2.2", void: "2.6", settlement: "2.8", payout: "2.10", "hosted-round": "5.2" }[process.argv[2]];
console.error(`verify:${process.argv[2]} is not implemented yet (owned by Story ${owner ?? "?"}).`);
process.exit(1);
