
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const wifi = require('node-wifi');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Initialize wifi module
wifi.init({
  iface: null // network interface, choose a random wifi interface if set to null
});

// Endpoint to scan networks
app.get('/api/scan-wifi', async (req, res) => {
  try {
    const networks = await wifi.scan();
    res.json({ success: true, networks });
  } catch (error) {
    console.error('Error scanning networks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to connect to a network
app.post('/api/connect-wifi', async (req, res) => {
  try {
    const { ssid, password } = req.body;
    
    if (!ssid) {
      return res.status(400).json({ success: false, error: 'SSID is required' });
    }
    
    await wifi.connect({ ssid, password });
    res.json({ success: true, message: `Connected to ${ssid}` });
  } catch (error) {
    console.error('Error connecting to network:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Scan networks when requested
  socket.on('scan_networks', async () => {
    try {
      const networks = await wifi.scan();
      socket.emit('networks_found', { networks });
    } catch (error) {
      console.error('Error scanning networks:', error);
      socket.emit('scan_error', { error: error.message });
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
