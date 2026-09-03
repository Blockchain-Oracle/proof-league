import { pino } from "pino";

// Abu's standing rule (2026-09-03): a structured logger, never bare console. The daemon
// logs JSON lines to stdout — leveled, timestamped, machine-shippable on any host — and
// the eslint no-console rule over src/ keeps the sweep permanent.
export const logger = pino({ base: null });

/// Evidence scripts (verify:*) log through pino too, pretty-rendered: their stdout IS the
/// archived artifact (CONVENTIONS §8), so it must stay human-readable while still carrying
/// levels and timestamps. Messages keep their own `verify:x:` prefixes — the existing
/// evidence convention the docs archive greps for.
export const scriptLogger = (): ReturnType<typeof pino> =>
  pino({
    base: null,
    transport: {
      target: "pino-pretty",
      options: { colorize: false, translateTime: "UTC:yyyy-mm-dd HH:MM:ss'Z'" },
    },
  });
