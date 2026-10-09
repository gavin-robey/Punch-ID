FROM node:22-bookworm-slim

WORKDIR /app

# build tools for native modules (bcrypt) in case no prebuilt binary matches the platform
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# install from the lockfile first so dependency layers stay cached between source changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# tsx runs the TypeScript directly and resolves the src/* path aliases from tsconfig.json
CMD ["npx", "tsx", "src/index.ts"]
