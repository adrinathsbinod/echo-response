const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let latestData = { node1: null, node2: null };

app.post('/api/node1', (req, res) => {
    latestData.node1 = { ...req.body, timestamp: Date.now() };
    broadcast({ type: 'node1', data: latestData.node1 });
    console.log('Node 1:', JSON.stringify(req.body));
    res.json({ ok: true });
});

app.post('/api/node2', (req, res) => {
    latestData.node2 = { ...req.body, timestamp: Date.now() };
    broadcast({ type: 'node2', data: latestData.node2 });
    console.log('Node 2:', JSON.stringify(req.body));
    res.json({ ok: true });
});

app.get('/api/status', (req, res) => res.json(latestData));

const server = app.listen(3001, () => {
    console.log('Bridge server running on http://0.0.0.0:3001');
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Dashboard connected via WebSocket');
    if (latestData.node1) ws.send(JSON.stringify({ type: 'node1', data: latestData.node1 }));
    if (latestData.node2) ws.send(JSON.stringify({ type: 'node2', data: latestData.node2 }));
    ws.on('close', () => clients.delete(ws));
});

function broadcast(msg) {
    const payload = JSON.stringify(msg);
    clients.forEach(ws => { if (ws.readyState === 1) ws.send(payload); });
}
