
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

// Endpoint to scan networks - no history storage
app.get('/api/scan-wifi', async (req, res) => {
  try {
    const networks = await wifi.scan();
    // Return only the current scan results without storing history
    res.json({ success: true, networks });
  } catch (error) {
    console.error('Error scanning networks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint to connect to a network from QR code data - no history storage
app.post('/api/connect-wifi-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ success: false, error: 'QR data is required' });
    }
    
    // Parse QR code data for Wi-Fi credentials
    // Standard Wi-Fi QR format: WIFI:S:<SSID>;T:<Authentication>;P:<Password>;;
    const ssidMatch = qrData.match(/S:(.*?);/);
    const passwordMatch = qrData.match(/P:(.*?);/);
    
    if (!ssidMatch) {
      return res.status(400).json({ success: false, error: 'Invalid QR code format. SSID not found.' });
    }
    
    const ssid = ssidMatch[1];
    const password = passwordMatch ? passwordMatch[1] : '';
    
    await wifi.connect({ ssid, password });
    
    // Return success but don't store connection history
    res.json({ 
      success: true, 
      message: `Connected to ${ssid}`,
      credentials: { ssid, password } 
    });
  } catch (error) {
    console.error('Error connecting to network from QR:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Regular endpoint to connect to a network - no history storage
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

// WebSocket for real-time updates - no history storage
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Process QR code data
  socket.on('process_qr_code', async (data) => {
    try {
      // Parse QR code data
      const qrData = data.qrData;
      const ssidMatch = qrData.match(/S:(.*?);/);
      const passwordMatch = qrData.match(/P:(.*?);/);
      
      if (!ssidMatch) {
        socket.emit('qr_process_error', { 
          error: 'Invalid QR code format. SSID not found.' 
        });
        return;
      }
      
      const ssid = ssidMatch[1];
      const password = passwordMatch ? passwordMatch[1] : '';
      
      // Connect to the network
      await wifi.connect({ ssid, password });
      
      // Send success response but don't store connection history
      socket.emit('wifi_connected', { 
        ssid, 
        password,
        message: `Connected to ${ssid}` 
      });
    } catch (error) {
      console.error('Error processing QR code:', error);
      socket.emit('qr_process_error', { error: error.message });
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
