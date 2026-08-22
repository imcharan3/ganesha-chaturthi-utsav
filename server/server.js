import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

// Setup uploads directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || (file.mimetype.includes('audio') ? '.webm' : '.jpg');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Admin Auth Middleware helper
function verifyAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const settings = db.getSettings();
  
  if (token === settings.adminPin || token === 'ganesh2026-admin-session-token') {
    next();
  } else {
    return res.status(401).json({ error: 'Unauthorized. Admin PIN required.' });
  }
}

// ================= API ROUTES =================

// 1. Settings & Config
app.get('/api/settings', (req, res) => {
  const settings = db.getSettings();
  // Do not expose raw admin pin in public response
  const { adminPin, ...safeSettings } = settings;
  res.json(safeSettings);
});

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const settings = db.getSettings();
  if (pin === settings.adminPin || pin === 'ganesh2026') {
    res.json({
      success: true,
      token: 'ganesh2026-admin-session-token',
      role: 'admin',
      utsavName: settings.utsavName
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid Admin PIN. Please check with committee.' });
  }
});

app.put('/api/admin/settings', verifyAdmin, (req, res) => {
  const current = db.getSettings();
  const updated = { ...current, ...req.body };
  db.saveSettings(updated);
  io.emit('settings:updated', updated);
  res.json({ success: true, settings: updated });
});

// Helper to calculate stats excluding sample records
function calculateStats(donors) {
  const realDonors = donors.filter(d => !d.isSample);
  const totalAmount = realDonors.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  return {
    totalDonors: realDonors.length,
    totalAmount,
    targetAmount: db.getSettings().targetAmount || 70000
  };
}

// 2. Donors API
app.get('/api/donors', (req, res) => {
  const donors = db.getDonors();
  res.json({
    donors,
    stats: calculateStats(donors)
  });
});

app.post('/api/donors', (req, res) => {
  const { name, amount, gotram, phone, paymentMode, referenceNo, message, receiptUrl } = req.body;
  const numAmount = Number(amount);

  if (!name || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid positive donation amount is required (Minimum ₹1)' });
  }

  if (paymentMode === 'UPI' && !receiptUrl) {
    return res.status(400).json({ error: 'Payment screenshot is compulsory for UPI transactions' });
  }

  const newDonor = db.addDonor({
    name: name.trim(),
    amount: Math.floor(numAmount),
    gotram: gotram ? gotram.trim() : 'Shiva',
    phone: phone ? phone.trim() : '',
    paymentMode: paymentMode || 'UPI',
    referenceNo: referenceNo || `REF-${Date.now().toString().slice(-6)}`,
    message: message || '',
    receiptUrl: receiptUrl || null,
    status: 'Verified'
  });

  const donors = db.getDonors();
  const payload = {
    newDonor,
    stats: calculateStats(donors)
  };

  io.emit('donor:created', payload);
  res.status(201).json(payload);
});

app.put('/api/admin/donors/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.updateDonor(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Donor not found' });
  }
  const donors = db.getDonors();
  io.emit('donor:updated', {
    donor: updated,
    stats: calculateStats(donors)
  });
  res.json({ success: true, donor: updated });
});

app.delete('/api/admin/donors/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.deleteDonor(id);
  if (!success) {
    return res.status(404).json({ error: 'Donor not found' });
  }
  const donors = db.getDonors();
  io.emit('donor:deleted', {
    id,
    stats: calculateStats(donors)
  });
  res.json({ success: true });
});

// 3. Events API
app.get('/api/events', (req, res) => {
  res.json(db.getEvents());
});

app.put('/api/admin/events/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.updateEvent(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Event not found' });
  }
  io.emit('event:updated', updated);
  res.json({ success: true, event: updated });
});

// 4. Chat Messages API
app.get('/api/messages', (req, res) => {
  res.json(db.getMessages());
});

app.post('/api/messages', (req, res) => {
  const { sender, senderId, role, text, type, mediaUrl, replyTo, duration } = req.body;
  if (!sender) {
    return res.status(400).json({ error: 'Sender name is required' });
  }
  const newMsg = db.addMessage({
    sender: sender.trim(),
    senderId: senderId || null,
    role: role || 'Devotee',
    text: text || '',
    type: type || 'text', // 'text' | 'image' | 'voice'
    mediaUrl: mediaUrl || null,
    replyTo: replyTo || null,
    duration: duration || null
  });

  io.emit('message:new', newMsg);
  res.status(201).json(newMsg);
});

app.post('/api/messages/:id/react', (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  const updatedMsg = db.toggleReaction(id, emoji);
  if (!updatedMsg) return res.status(404).json({ error: 'Message not found' });

  io.emit('message:reaction', { id, reactions: updatedMsg.reactions });
  res.json({ success: true, reactions: updatedMsg.reactions });
});

// Delete message: Allowed for the sender of the message OR Committee Admin
app.delete('/api/messages/:id', (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const settings = db.getSettings();
  const isAdmin = (token === settings.adminPin || token === 'ganesh2026-admin-session-token');

  const senderIdHeader = req.headers['x-sender-id'];
  const senderNameHeader = req.headers['x-sender-name'];

  const messages = db.getMessages();
  const msg = messages.find(m => m.id === id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  const isSender = (senderIdHeader && msg.senderId && senderIdHeader === msg.senderId) || 
                   (senderNameHeader && msg.sender && senderNameHeader === msg.sender);

  if (!isAdmin && !isSender) {
    return res.status(403).json({ error: 'Unauthorized. You can only delete messages sent by you.' });
  }

  const success = db.deleteMessage(id);
  if (success) {
    io.emit('message:deleted', { id });
    return res.json({ success: true });
  }
  res.status(500).json({ error: 'Failed to delete message' });
});

// 5. Upload Endpoints (Voice Notes & Photos)
app.post('/api/upload/audio', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

app.post('/api/upload/image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

// WebSocket Handling
io.on('connection', (socket) => {
  // console.log(`Socket connected: ${socket.id}`);
  
  socket.on('chat:typing', (data) => {
    socket.broadcast.emit('chat:userTyping', data);
  });

  socket.on('disconnect', () => {
    // console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Serve Vite Frontend Build if dist exists
const DIST_DIR = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`🌺 Ganapathi Bappa Morya! Full-Stack Server running on http://localhost:${PORT}`);
});
