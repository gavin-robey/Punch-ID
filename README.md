# Punch-ID
Repository for all source code used in making the Punch ID app.

- `client/`: Expo / React Native app (iOS, Android and web)
- `server/`: Express + MongoDB API

## Running with Docker

The only requirement is [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose v2.24+). Every dependency is installed inside the containers from the lockfiles.

1. Add the server secrets:
   ```bash
   cp server/.env.example server/.env
   ```
   Fill in `JWT_SECRET`, `MAILTRAP_TOKEN` (sign-up and password reset emails) and the `CLOUD_*` keys (photo, video and file uploads). `PORT` and `URI` are set by Docker and can stay as they are.

2. Start everything:
   ```bash
   docker compose up --build
   ```

| Service | URL | Notes |
|---|---|---|
| Web app | http://localhost:8081 | Expo dev server (Metro) |
| API | http://localhost:3000 | Express server |
| MongoDB | `mongodb://localhost:27018` | Data is kept in the `mongo-data` volume |

Code changes reload automatically: the server restarts on save, and the app hot-reloads.

Expo's QR code and URLs show in the `docker compose up` output, or later with `docker compose logs client`. To use Expo's key menu (`r` reload, `m` dev menu, `w` web), run `docker attach punch-id-client-1`. Detach with `Ctrl+P` then `Ctrl+Q`; `Ctrl+C` stops the container.

### Using Expo Go on a phone

The phone has to reach your computer over the network, so `localhost` won't work. Create a `.env` next to `docker-compose.yml` (see `.env.example`) using your computer's LAN IP:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.20
```

Run `docker compose up` again, then scan the QR code (it now points at `exp://192.168.1.20:8081`) with Expo Go or the iOS Camera app. The phone and computer must be on the same Wi-Fi.

### Common tasks

```bash
# seed 3 job sites with 10 punch items each for an existing user
docker compose exec server npm run seed -- you@example.com

# after changing package.json in client/ or server/: rebuild, and renew the client's node_modules volume
docker compose up --build -V

# stop everything (add -v to also delete the database)
docker compose down
```

Ports 3000, 8081 and 27018 must be free. Stop any local `npm run dev` or `npx expo start` first.

## Running without Docker

Requires Node 22 and a local MongoDB.

```bash
cd server && npm install && cp .env.example .env && npm run dev
cd client && npm install && npx expo start
```


