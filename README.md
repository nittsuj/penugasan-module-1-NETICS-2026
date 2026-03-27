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

Pada pembuatan API, digunakan NodeJS sebagai Runtime Environment, Express.js sebagai Framework, dan TypeScript sebagai bahasa pemrogramannya, untuk _type safety_. \ 

Endpoint /health berfungsi sebagai Health Check yang mengembalikan JSON berisi data identitas (Nama, NRP), timestamp, dan kalkulasi uptime server. Penerapan binding alamat 0.0.0.0 pada port 3000 memastikan aplikasi di dalam kontainer Docker dapat menerima trafik dari reverse proxy Nginx.

### Setting Up the Environment
- Dockerfile
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

Menggunakan base image node:20-alpine untuk menginstal seluruh dependensi dan melakukan build TypeScript menjadi JavaScript murni ke dalam folder dist. \
Membuat image baru, lalu hanya copy hasil kompilasi dari hasil build dan menginstal dependensi production (--omit=dev).

### CI/CD Pipeline

- .github/workflows/deploy.yml
```yml
name: CI/CD Pipeline NETICS 2026

on:
  push:
    branches:
      - main

env:
  REGISTRY: ghcr.io
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      - name: Set lower case repository name
        run: |
          echo "IMAGE_NAME=${GITHUB_REPOSITORY,,}" >> ${GITHUB_ENV}

      - name: Log in to the Container registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            echo ${{ secrets.GITHUB_TOKEN }} | docker login ${{ env.REGISTRY }} -u ${{ github.actor }} --password-stdin            
            
            docker pull ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
            
            docker rm -f netics-api-justin || true
            docker run -d --name netics-api-justin -p 8081:3000 --restart always ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
```

Build & Push: Mengkompilasi image Docker berdasarkan Dockerfile dan upload ke GHCR \
Automated Deployment: Connect SSH ke VPS Azure menggunakan secrets

- ansible/playbook.yml

```yml
---
- name: Setup Nginx Reverse Proxy for NETICS API
  hosts: vps
  become: yes
  tasks:
    - name: Ensure Nginx is installed
      apt:
        name: nginx
        state: present
        update_cache: yes

    - name: Create Nginx configuration for the API
      copy:
        dest: /etc/nginx/sites-available/netics-api-justin
        content: |
          server {
              listen 81;
              server_name _;

              location / {
                  proxy_pass http://127.0.0.1:8081;
                  proxy_http_version 1.1;
                  proxy_set_header Upgrade $http_upgrade;
                  proxy_set_header Connection 'upgrade';
                  proxy_set_header Host $host;
                  proxy_cache_bypass $http_upgrade;
              }
          }

    - name: Enable the Nginx site configuration
      file:
        src: /etc/nginx/sites-available/netics-api-justin
        dest: /etc/nginx/sites-enabled/netics-api-justin
        state: link

    - name: Remove default Nginx site configuration (to avoid conflicts)
      file:
        path: /etc/nginx/sites-enabled/default
        state: absent

    - name: Restart and enable Nginx service
      service:
        name: nginx
        state: restarted
        enabled: yes
```

Ansible Playbook digunakan untuk mengotomatisasi konfigurasi Reverse Proxy pada server tanpa harus masuk secara manual. Playbook ini menginstruksikan VPS untuk menginstal Nginx dan membuat konfigurasi server block baru yang mendengarkan pada Port 81 (sebagai pembeda dari layanan default). \

Trafik dari luar yang masuk melalui port 81 kemudian diteruskan (proxy pass) ke alamat internal 127.0.0.1:8081, tempat kontainer Docker berada.

### RESULT
<img title="a title" alt="Alt text" src="/assets/proof-deploy.png"> 

<img title="a title" alt="Alt text" src="/assets/docker.png"> 
