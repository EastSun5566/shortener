# syntax=docker/dockerfile:1

ARG NODE_VERSION=24-trixie-slim

FROM node:${NODE_VERSION} AS base

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --store-dir=/pnpm/store

FROM dependencies AS development

COPY server ./server

ENV NODE_ENV=development

EXPOSE 8080

CMD ["pnpm", "--filter", "server", "dev:docker"]

FROM dependencies AS build

COPY . .

RUN pnpm build

FROM base AS production-dependencies

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
COPY web/package.json ./web/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --prod --frozen-lockfile --filter server... --store-dir=/pnpm/store

FROM redis:8.8-trixie AS redis-runtime

FROM scratch AS s6-overlay-assets

ADD --checksum=sha256:85848f6baab49fb7832a5557644c73c066899ed458dd1601035cf18e7c759f26 \
  https://github.com/just-containers/s6-overlay/releases/download/v3.2.2.0/s6-overlay-noarch.tar.xz \
  /s6-overlay-noarch.tar.xz
ADD --checksum=sha256:5a09e2f1878dc5f7f0211dd7bafed3eee1afe4f813e872fff2ab1957f266c7c0 \
  https://github.com/just-containers/s6-overlay/releases/download/v3.2.2.0/s6-overlay-x86_64.tar.xz \
  /s6-overlay-x86_64.tar.xz
ADD --checksum=sha256:50a5d4919e688fafc95ce9cf0055a46f74847517bcf08174bac811de234ec7d2 \
  https://github.com/just-containers/s6-overlay/releases/download/v3.2.2.0/s6-overlay-aarch64.tar.xz \
  /s6-overlay-aarch64.tar.xz

FROM postgres:18-trixie AS demo

ARG TARGETARCH

LABEL org.opencontainers.image.title="Shortener Demo"
LABEL org.opencontainers.image.description="Ephemeral all-in-one demo of Shortener with PostgreSQL and Redis"
LABEL org.opencontainers.image.source="https://github.com/EastSun5566/shortener"
LABEL org.opencontainers.image.licenses="MIT AND AGPL-3.0-only"

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
ENV BLOOM_FILTER_EXPECTED_ITEMS=100000
ENV NODE_OPTIONS=--max-old-space-size=256
ENV S6_BEHAVIOUR_IF_STAGE2_FAILS=2
ENV S6_KILL_GRACETIME=5000
ENV S6_SERVICES_GRACETIME=5000

WORKDIR /app

COPY --from=s6-overlay-assets / /tmp/s6-overlay/

ADD --checksum=sha256:4a0e416b9537688f30dfe69ddaceb2ca64d96b7df02a0a6760d376890ddc4e40 \
  https://raw.githubusercontent.com/redis/redis/8.8/LICENSE.txt \
  /usr/share/doc/redis/LICENSE.txt

RUN set -eux; \
  apt-get update; \
  apt-get install --yes --no-install-recommends \
    ca-certificates \
    libstdc++6 \
    xz-utils; \
  case "$TARGETARCH" in \
    amd64) s6_arch=x86_64 ;; \
    arm64) s6_arch=aarch64 ;; \
    *) echo "Unsupported architecture: $TARGETARCH" >&2; exit 1 ;; \
  esac; \
  tar -C / -Jxpf /tmp/s6-overlay/s6-overlay-noarch.tar.xz; \
  tar -C / -Jxpf "/tmp/s6-overlay/s6-overlay-${s6_arch}.tar.xz"; \
  rm -rf /tmp/s6-overlay; \
  apt-get purge --yes --auto-remove xz-utils; \
  rm -rf /var/lib/apt/lists/*; \
  useradd --system --user-group --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin redis; \
  useradd --system --user-group --create-home --home-dir /home/node --shell /usr/sbin/nologin node; \
  mkdir -p /etc/shortener-demo; \
  chown node:node /app

COPY --from=base /usr/local/bin/node /usr/local/bin/node
COPY --from=redis-runtime /usr/local/bin/redis-server /usr/local/bin/redis-server
COPY --from=redis-runtime /usr/local/bin/redis-cli /usr/local/bin/redis-cli
COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=production-dependencies /app/server/node_modules ./server/node_modules
COPY --chown=node:node server/package.json ./server/package.json
COPY --chown=node:node --from=build /app/server/dist ./server/dist
COPY --chown=node:node --from=build /app/web/dist ./web/dist
COPY docker/demo/redis.conf /etc/shortener-demo/redis.conf
COPY docker/demo/THIRD_PARTY_NOTICES.md /usr/share/doc/shortener-demo/THIRD_PARTY_NOTICES.md
COPY docker/demo/cont-init.d/ /etc/cont-init.d/
COPY docker/demo/s6-rc.d/ /etc/s6-overlay/s6-rc.d/

RUN chmod 0755 \
  /etc/cont-init.d/* \
  /etc/s6-overlay/s6-rc.d/app/finish \
  /etc/s6-overlay/s6-rc.d/app/run \
  /etc/s6-overlay/s6-rc.d/postgres/run \
  /etc/s6-overlay/s6-rc.d/redis/run

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD ["node", "-e", "const port=process.env.PORT??'8080';fetch(`http://127.0.0.1:${port}/health`).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

STOPSIGNAL SIGTERM
ENTRYPOINT ["/init"]
CMD []

FROM node:${NODE_VERSION} AS production

LABEL org.opencontainers.image.title="Shortener"
LABEL org.opencontainers.image.description="Self-hosted URL shortener with PostgreSQL and Redis"
LABEL org.opencontainers.image.source="https://github.com/EastSun5566/shortener"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

COPY --chown=node:node --from=production-dependencies /app/node_modules ./node_modules
COPY --chown=node:node --from=production-dependencies /app/server/node_modules ./server/node_modules
COPY --chown=node:node server/package.json ./server/package.json
COPY --chown=node:node --from=build /app/server/dist ./server/dist
COPY --chown=node:node --from=build /app/web/dist ./web/dist

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8080/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "server/dist/src/main.js"]
