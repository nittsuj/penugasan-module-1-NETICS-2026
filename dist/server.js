import express from 'express';
const app = express();
const PORT = 3000;
const startTime = Date.now();
app.get('/health', (req, res) => {
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
//# sourceMappingURL=server.js.map