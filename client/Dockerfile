FROM node:22-bookworm-slim

WORKDIR /app

# .npmrc carries legacy-peer-deps, which the install needs
COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

ENV EXPO_NO_TELEMETRY=1

# Metro: serves the web app and the bundles for Expo Go / dev builds
EXPOSE 8081

CMD ["npx", "expo", "start", "--port", "8081"]
