# KriptoStream DLT Data Feed - interactive calculator
#
# The default base image is the one migrated into Artifactory in Lab 2, which
# proves the lift-and-shift produced a genuinely usable artifact rather than a
# pile of layers that merely uploaded cleanly.
#
# Before Lab 2 is complete, build against the public image instead:
#   docker build --build-arg BASE_IMAGE=alpine:3.19 -t krypto-calc .
ARG BASE_IMAGE=kripto1abs.jfrog.io/krypto-data-docker-prod-local/dlt-base:3.19
FROM ${BASE_IMAGE}

LABEL org.opencontainers.image.title="KriptoStream DLT Calculator" \
      org.opencontainers.image.vendor="KriptoStream Innovations" \
      org.opencontainers.image.source="https://github.com/voko/krypto-data-feed"

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Dependencies first so the layer cache survives source edits.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Never run the feed as root.
RUN addgroup -S krypto && adduser -S -G krypto krypto \
    && chown -R krypto:krypto /app
USER krypto

# The app is an interactive REPL: run it with `docker run -it`.
ENTRYPOINT ["node", "src/cli.js"]
