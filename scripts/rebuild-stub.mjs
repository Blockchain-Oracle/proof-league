// AD-8 rebuild gate placeholder. Story 1.3 arms it against the real schema; until then it must
// fail loudly rather than pass silently, so nobody mistakes an unarmed gate for green evidence.
console.error("pnpm rebuild is not armed yet: the projection schema lands in Story 1.3.");
process.exit(1);
