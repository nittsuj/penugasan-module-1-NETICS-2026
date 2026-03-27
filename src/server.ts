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
