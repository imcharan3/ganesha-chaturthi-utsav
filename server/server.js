import dotenv from 'dotenv';
dotenv.config();

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

// Database Management & Diagnostics (Cloud Persistence)
app.get('/api/admin/database/status', verifyAdmin, (req, res) => {
  res.json(db.getStatus());
});

app.post('/api/admin/database/connect', verifyAdmin, async (req, res) => {
  const { uri } = req.body;
  try {
    const result = await db.connect(uri);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Connection failed' });
  }
});

app.get('/api/admin/database/export', verifyAdmin, (req, res) => {
  const backup = db.exportBackup();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=Ganesha_Utsav_Backup_${Date.now()}.json`);
  res.json(backup);
});

app.post('/api/admin/database/import', verifyAdmin, async (req, res) => {
  try {
    const result = await db.importBackup(req.body);
    // Broadcast updates to all connected users
    io.emit('settings:updated', db.getSettings());
    io.emit('auction:updated', db.getAuction());
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'Import failed' });
  }
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
  const { name, amount, gotram, phone, paymentMode, referenceNo, message, receiptUrl, status, isSpecialDonor, specialContribution } = req.body;
  const numAmount = Number(amount);

  if (!name || isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid positive donation amount is required (Minimum ₹1)' });
  }

  if (paymentMode === 'UPI' && !receiptUrl) {
    return res.status(400).json({ error: 'Payment screenshot is compulsory for UPI transactions' });
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const settings = db.getSettings();
  const isAdmin = (token === settings.adminPin || token === 'ganesh2026-admin-session-token');

  const initialStatus = isAdmin ? (status || 'Verified') : 'Pending Verification';

  const newDonor = db.addDonor({
    name: name.trim(),
    amount: Math.floor(numAmount),
    gotram: gotram ? gotram.trim() : '',
    phone: phone ? phone.trim() : '',
    paymentMode: paymentMode || 'UPI',
    referenceNo: referenceNo || `REF-${Date.now().toString().slice(-6)}`,
    message: message || '',
    receiptUrl: receiptUrl || null,
    isSpecialDonor: isAdmin ? Boolean(isSpecialDonor) : false,
    specialContribution: isAdmin ? (specialContribution || '').trim() : '',
    status: initialStatus
  });

  const donors = db.getDonors();
  const payload = {
    newDonor,
    stats: calculateStats(donors)
  };

  io.emit('donor:created', payload);
  res.status(201).json(payload);
});

// Admin 1-Click Verification Endpoint
app.post('/api/admin/donors/:id/verify', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const updated = db.verifyDonor(id);
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

// 4. Live Laddu Auction API
app.get('/api/auction', (req, res) => {
  res.json(db.getAuction());
});

app.put('/api/admin/auction/status', verifyAdmin, (req, res) => {
  const { status, startingBid, minIncrement, itemTitle, ladduWeight } = req.body;
  const fields = {};
  if (status !== undefined) fields.status = status;
  if (startingBid !== undefined && startingBid !== null && startingBid !== '') {
    fields.startingBid = Number(startingBid);
    const curr = db.getAuction();
    if (!curr.bidsHistory || curr.bidsHistory.length === 0) {
      fields.currentHighestBid = Number(startingBid);
    }
  }
  if (minIncrement !== undefined && minIncrement !== null && minIncrement !== '') {
    fields.minIncrement = Number(minIncrement);
  }
  if (itemTitle !== undefined) fields.itemTitle = itemTitle;
  if (ladduWeight !== undefined) fields.ladduWeight = ladduWeight;

  const updated = db.updateAuction(fields);
  io.emit('auction:updated', updated);
  res.json({ success: true, auction: updated });
});

app.post('/api/admin/auction/bidders', verifyAdmin, (req, res) => {
  const { name, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Bidder name is required' });
  }
  const newBidder = db.addRegisteredBidder({ name, phone });
  const updated = db.getAuction();
  io.emit('auction:updated', updated);
  res.json({ success: true, bidder: newBidder, auction: updated });
});

app.put('/api/admin/auction/bidders/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Bidder name is required' });
  }
  const result = db.updateRegisteredBidder(id, { name, phone });
  if (!result) {
    return res.status(404).json({ error: 'Bidder not found' });
  }
  io.emit('auction:updated', result.auction);
  res.json({ success: true, bidder: result.bidder, auction: result.auction });
});

app.delete('/api/admin/auction/bidders/:id', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const success = db.deleteRegisteredBidder(id);
  const updated = db.getAuction();
  io.emit('auction:updated', updated);
  res.json({ success, auction: updated });
});

app.post('/api/admin/auction/bid', verifyAdmin, (req, res) => {
  const { bidderName, amount, note, phone } = req.body;
  const numAmount = Number(amount);

  if (!bidderName || !bidderName.trim()) {
    return res.status(400).json({ error: 'Bidder name is required' });
  }

  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Valid bid amount is required' });
  }

  const result = db.addBid({ bidderName, amount: numAmount, note, phone });
  io.emit('auction:newBid', {
    newBid: result.newBid,
    auction: result.auction,
    notification: {
      title: '🏆 Live Laddu Auction - New Bid!',
      message: `${bidderName.trim()} placed ₹${numAmount.toLocaleString('en-IN')} on Maha Laddu!`,
      amount: numAmount,
      bidderName: bidderName.trim()
    }
  });
  res.json({ success: true, newBid: result.newBid, auction: result.auction });
});

app.post('/api/admin/auction/undo', verifyAdmin, (req, res) => {
  const result = db.undoBid();
  if (!result) {
    return res.status(400).json({ error: 'No bids to undo' });
  }
  io.emit('auction:updated', result.auction);
  res.json({ success: true, removedBid: result.removedBid, auction: result.auction });
});

app.post('/api/admin/auction/winner', verifyAdmin, (req, res) => {
  const { winnerName, winningBid, phone, message } = req.body;
  const updated = db.declareWinner({ winnerName, winningBid, phone, message });
  io.emit('auction:winnerDeclared', updated);
  res.json({ success: true, auction: updated });
});

app.post('/api/admin/auction/reset', verifyAdmin, (req, res) => {
  const { startingBid } = req.body;
  const resetData = db.resetAuction(startingBid);
  io.emit('auction:updated', resetData);
  res.json({ success: true, auction: resetData });
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
  app.use(express.static(DIST_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html') || filePath.endsWith('manifest.json') || filePath.endsWith('sw.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      } else if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

async function startServer() {
  try {
    await db.init();
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🌺 Ganapathi Bappa Morya! Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
