# Module-1 CI/CD

Nama: Justin Valentino \
NRP: 5025241234

### Disclaimer

Pemakaian VPS pada deployment ini adalah dengan meminjam VPS dari kandidat lain (Raymond Julius Pardosi). Peminjaman tersebut pun sudah di-green light oleh salah satu admin.

### Endpoint API
```TypeScript
import express from 'express';
import type { Request, Response } from 'express';

const app = express();
const PORT: number = 3000;
const startTime: number = Date.now();

interface HealthResponse {
  nama: string;
  nrp: string;
  status: string;
  timestamp: string;		// current time
  uptime: string;		// server uptime
}

app.get('/health', (req: Request, res: Response<HealthResponse>) => {
  const currentTimestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.json({
    nama: "Justin Valentino",
    nrp: "5025241234",
    status: "UP",
    timestamp: currentTimestamp,
    uptime: `${uptimeSeconds}s`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
```

Pada pembuatan API, digunakan NodeJS sebagai Runtime Environment, Express.js sebagai Framework, dan TypeScript sebagai bahasa pemrogramannya, untuk _type safety_.

### Setting Up the Environment
```Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### CI/CD Pipeline


