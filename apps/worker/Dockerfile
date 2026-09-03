# The settlement worker's runtime image (CONVENTIONS §9: Fly hosts the worker; secrets are
# Fly secrets, never baked in). It runs through tsx rather than a compiled bundle on purpose:
# packages/shared and packages/chain ship TypeScript sources that Next and tsx consume
# directly (AD-2's plane rule), so the one runtime that resolves them is the one the dev
# loop already uses. No build artifact means no build/runtime divergence to debug at 3am
# during an unattended judging window.
FROM node:24-slim

# Nothing in the worker needs a compiler; keeping the image thin keeps the deploy fast.
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# Workspace manifests first so the dependency layer caches across code edits.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
# Only the two packages the worker actually depends on; policy/ and design-tokens/ are
# empty placeholders for later stories and have no manifest to copy.
COPY packages/shared/package.json packages/shared/
COPY packages/chain/package.json packages/chain/
COPY apps/worker/package.json apps/worker/

# The worker's own toolchain (tsx) is a devDependency, so this is a full install by design.
RUN pnpm install --frozen-lockfile --filter @proof-league/worker...

COPY packages/ packages/
COPY apps/worker/ apps/worker/

# The health server's port; /health carries the last-loop-tick age the external liveness
# probe reads (AD-7), which is why the container must expose it.
ENV PORT=8080
EXPOSE 8080

WORKDIR /app/apps/worker
CMD ["pnpm", "exec", "tsx", "src/index.ts"]
