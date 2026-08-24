import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';

// Ensure MongoDB SRV DNS lookup resolves reliably across all ISPs and cloud providers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DONORS_FILE = path.join(DATA_DIR, 'donors.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const AUCTION_FILE = path.join(DATA_DIR, 'auction.json');
const CONFIG_FILE = path.join(DATA_DIR, 'db_config.json');

// Default Seed Data
const DEFAULT_AUCTION = {
  status: "upcoming",
  itemTitle: "శ్రీ వినాయక మహా లడ్డూ ప్రసాదం",
  itemTitleEnglish: "Lord Varasiddhi Vinayaka Sacred Maha Laddu Prasadam",
  ladduWeight: "21 KG",
  description: "Most sacred Maha Laddu blessed during the auspicious 4-day Ganesha Navaratri poojas. Brought to the grand live auction on Day 3.",
  startingBid: 5001,
  minIncrement: 0,
  currentHighestBid: 5001,
  highestBidderName: "",
  highestBidderGotram: "",
  highestBidderPhone: "",
  bidsCount: 0,
  registeredBidders: [
    {
      id: "bidder-sample-1",
      name: "విజయ కాలనీ కమిటీ సభ్యులు",
      gotram: "శివ గోత్రం",
      phone: ""
    }
  ],
  bidsHistory: [],
  winner: null,
  updatedAt: new Date().toISOString()
};

const DEFAULT_SETTINGS = {
  utsavName: "విజయ కాలనీ గణేష్ డైరీస్",
  subtitle: "Vijaya Colony Ganesha Diaries • Vinayaka Chavithi 2026",
  location: "Vijaya Colony Mandapam",
  targetAmount: 70000,
  upiId: "charanadishti123@okaxis",
  upiName: "Charan Teja Adishti",
  adminPin: "ganesh2026",
  contactPhone: "+91 98765 43210",
  startDate: "2026-09-14T08:00:00.000Z",
  instagramHandle: "@vijayacolony_ganesha_diaries",
  instagramUrl: "https://instagram.com/vijayacolony_ganesha_diaries"
};

const DEFAULT_EVENTS = [
  {
    id: "evt-day-1",
    dayNumber: 1,
    title: "Vigraha Pratisthapana & Ganapathi Homam",
    titleTelugu: "విగ్రహ ప్రతిష్టాపన & మహా గణపతి హోమం",
    time: "Morning 08:00 AM",
    description: "Auspicious installation of Lord Varasiddhi Vinayaka idol followed by Kalasha Sthapana, Ganapathi Homam & First Maha Mangala Harathi with full devotion.",
    highlights: ["08:00 AM - Vigraha Sthapana", "09:30 AM - Ganapathi Homam", "11:00 AM - First Maha Harathi & Modak Teertha Prasadam"],
    status: "Upcoming",
    icon: "Flame"
  },
  {
    id: "evt-day-2",
    dayNumber: 2,
    title: "Maha Annadanam (మహా అన్నదానం)",
    titleTelugu: "మహా అన్నదాన సమారాధన",
    time: "Afternoon 12:00 PM",
    description: "Grand community feast (Maha Annadanam) for all devotees and villagers with variety rice, curries, payasam, and pulihora blessings.",
    highlights: ["10:30 AM - Special Sahasranama Archana", "12:00 PM - Maha Annadanam Commences", "07:30 PM - Evening Bhajans & Keerthanas"],
    status: "Upcoming",
    icon: "Utensils"
  },
  {
    id: "evt-day-3",
    dayNumber: 3,
    title: "Vutti Sambaram & Grand Laddu Auction",
    titleTelugu: "ఉట్టి సంబరాలు & మహా లడ్డూ వేలం పాట",
    time: "3:00 PM & 7:00 PM",
    description: "Traditional energetic Vutti breaking competition for youth in the afternoon, followed by the highly prestigious sacred Laddu Prasadam Auction in the evening.",
    highlights: ["03:00 PM - Youth Vutti Breaking Games & Dappu Beats", "06:00 PM - Devotional Cultural Dance by Kids", "07:00 PM - Grand Laddu Auction (మహా లడ్డూ వేలం పాట)"],
    status: "Upcoming",
    icon: "Trophy"
  },
  {
    id: "evt-day-4",
    dayNumber: 4,
    title: "Grand Ratha Yatra & Shobha Yatra Nimajjanam",
    titleTelugu: "ఘన రథయాత్ర & శోభాయాత్ర నిమజ్జనం",
    time: "Evening 04:00 PM Onwards",
    description: "Magnificent farewell procession with DJ sound, traditional Teenmaar beats, colorful fireworks, gulal celebrations, and holy water immersion.",
    highlights: ["03:00 PM - Special Farewell Harathi", "04:00 PM - Shobha Yatra Procession begins across main streets", "09:00 PM - Holy Jal Nimajjanam with fireworks"],
    status: "Upcoming",
    icon: "Sparkles"
  }
];

const DEFAULT_DONORS = [
  {
    id: "dn-sample-1",
    name: "విజయ కాలనీ భక్తులు (Sample Record)",
    gotram: "Shiva",
    amount: 101,
    paymentMode: "UPI",
    referenceNo: "SAMPLE-001",
    status: "Verified",
    message: "శ్రీ వరసిద్ధి వినాయక స్వామి కృపాకటాక్షాలు అందరిపై ఉండాలి! 🙏🌺",
    phone: "",
    isSample: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_MESSAGES = [];

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Mongoose Schemas for MongoDB Persistence
const DonorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  gotram: { type: String, default: 'Shiva' },
  amount: { type: Number, required: true },
  paymentMode: { type: String, default: 'UPI' },
  referenceNo: { type: String },
  status: { type: String, default: 'Verified' },
  message: { type: String, default: '' },
  phone: { type: String, default: '' },
  receiptUrl: { type: String, default: null },
  isSample: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String }
}, { collection: 'donors', strict: false });

const EventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  dayNumber: { type: Number, required: true },
  title: { type: String, required: true },
  titleTelugu: { type: String },
  time: { type: String },
  description: { type: String },
  highlights: [{ type: String }],
  status: { type: String, default: 'Upcoming' },
  icon: { type: String, default: 'Sparkles' }
}, { collection: 'events', strict: false });

const MessageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  sender: { type: String, required: true },
  senderId: { type: String },
  role: { type: String, default: 'Devotee' },
  text: { type: String },
  audioUrl: { type: String },
  imageUrl: { type: String },
  replyTo: { type: Object },
  reactions: { type: Object, default: {} },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { collection: 'messages', strict: false });

const SettingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global_settings' },
  utsavName: { type: String, default: DEFAULT_SETTINGS.utsavName },
  subtitle: { type: String, default: DEFAULT_SETTINGS.subtitle },
  location: { type: String, default: DEFAULT_SETTINGS.location },
  targetAmount: { type: Number, default: DEFAULT_SETTINGS.targetAmount },
  upiId: { type: String, default: DEFAULT_SETTINGS.upiId },
  upiName: { type: String, default: DEFAULT_SETTINGS.upiName },
  adminPin: { type: String, default: DEFAULT_SETTINGS.adminPin },
  contactPhone: { type: String, default: DEFAULT_SETTINGS.contactPhone },
  startDate: { type: String, default: DEFAULT_SETTINGS.startDate },
  instagramHandle: { type: String, default: DEFAULT_SETTINGS.instagramHandle },
  instagramUrl: { type: String, default: DEFAULT_SETTINGS.instagramUrl }
}, { collection: 'settings', strict: false });

const AuctionSchema = new mongoose.Schema({
  _id: { type: String, default: 'live_laddu_auction' },
  status: { type: String, default: 'upcoming' },
  itemTitle: { type: String },
  itemTitleEnglish: { type: String },
  ladduWeight: { type: String, default: '21 KG' },
  description: { type: String },
  startingBid: { type: Number, default: 5001 },
  minIncrement: { type: Number, default: 0 },
  currentHighestBid: { type: Number, default: 5001 },
  highestBidderName: { type: String, default: '' },
  highestBidderGotram: { type: String, default: '' },
  highestBidderPhone: { type: String, default: '' },
  bidsCount: { type: Number, default: 0 },
  registeredBidders: [{ type: Object }],
  bidsHistory: [{ type: Object }],
  winner: { type: Object, default: null },
  updatedAt: { type: String }
}, { collection: 'auction', strict: false });

let DonorModel = null;
let EventModel = null;
let MessageModel = null;
let SettingsModel = null;
let AuctionModel = null;

try {
  DonorModel = mongoose.model('Donor', DonorSchema);
  EventModel = mongoose.model('Event', EventSchema);
  MessageModel = mongoose.model('Message', MessageSchema);
  SettingsModel = mongoose.model('Settings', SettingsSchema);
  AuctionModel = mongoose.model('Auction', AuctionSchema);
} catch (e) {
  DonorModel = mongoose.models.Donor;
  EventModel = mongoose.models.Event;
  MessageModel = mongoose.models.Message;
  SettingsModel = mongoose.models.Settings;
  AuctionModel = mongoose.models.Auction;
}

// In-Memory Database Store for Instant 0ms Read Response
let memDonors = readJsonFile(DONORS_FILE, DEFAULT_DONORS);
let memEvents = readJsonFile(EVENTS_FILE, DEFAULT_EVENTS);
let memMessages = readJsonFile(MESSAGES_FILE, DEFAULT_MESSAGES);
let memSettings = readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS);
let memAuction = readJsonFile(AUCTION_FILE, DEFAULT_AUCTION);

let dbStatus = {
  connected: false,
  mode: 'local',
  uriMasked: '',
  lastSyncTime: null,
  error: null
};

// Async persistence helpers to cloud MongoDB
async function persistMongoDonor(donor) {
  if (!dbStatus.connected || !DonorModel) return;
  try {
    await DonorModel.findOneAndUpdate({ id: donor.id }, donor, { upsert: true, new: true });
  } catch (err) {
    console.error('MongoDB Donor Save Error:', err.message);
  }
}

async function deleteMongoDonor(id) {
  if (!dbStatus.connected || !DonorModel) return;
  try {
    await DonorModel.deleteOne({ id });
  } catch (err) {
    console.error('MongoDB Donor Delete Error:', err.message);
  }
}

async function persistMongoSettings(settings) {
  if (!dbStatus.connected || !SettingsModel) return;
  try {
    await SettingsModel.findByIdAndUpdate('global_settings', settings, { upsert: true, new: true });
  } catch (err) {
    console.error('MongoDB Settings Save Error:', err.message);
  }
}

async function persistMongoAuction(auction) {
  if (!dbStatus.connected || !AuctionModel) return;
  try {
    await AuctionModel.findByIdAndUpdate('live_laddu_auction', auction, { upsert: true, new: true });
  } catch (err) {
    console.error('MongoDB Auction Save Error:', err.message);
  }
}

async function persistMongoMessage(msg) {
  if (!dbStatus.connected || !MessageModel) return;
  try {
    await MessageModel.findOneAndUpdate({ id: msg.id }, msg, { upsert: true, new: true });
  } catch (err) {
    console.error('MongoDB Message Save Error:', err.message);
  }
}

async function deleteMongoMessage(id) {
  if (!dbStatus.connected || !MessageModel) return;
  try {
    await MessageModel.deleteOne({ id });
  } catch (err) {
    console.error('MongoDB Message Delete Error:', err.message);
  }
}

async function persistMongoEvent(event) {
  if (!dbStatus.connected || !EventModel) return;
  try {
    await EventModel.findOneAndUpdate({ id: event.id }, event, { upsert: true, new: true });
  } catch (err) {
    console.error('MongoDB Event Save Error:', err.message);
  }
}

// Connect to MongoDB & Auto-Sync
async function connectDatabase(mongoUri) {
  if (!mongoUri) return false;
  try {
    console.log('🔄 Connecting to Cloud Database (MongoDB Atlas)...');
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000
    });

    dbStatus.connected = true;
    dbStatus.mode = 'mongodb';
    dbStatus.error = null;
    
    // Mask URI for display (e.g. mongodb+srv://user:***@cluster.mongodb.net/...)
    try {
      dbStatus.uriMasked = mongoUri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1******$3');
    } catch {
      dbStatus.uriMasked = 'mongodb://******';
    }

    console.log(`✅ Connected to MongoDB Cloud Database: ${dbStatus.uriMasked}`);

    // Initial Data Sync: Load existing data from MongoDB into Memory
    const [dbDonors, dbEvents, dbMessages, dbSettings, dbAuction] = await Promise.all([
      DonorModel.find({}).sort({ createdAt: -1 }).lean(),
      EventModel.find({}).sort({ dayNumber: 1 }).lean(),
      MessageModel.find({}).sort({ createdAt: 1 }).lean(),
      SettingsModel.findById('global_settings').lean(),
      AuctionModel.findById('live_laddu_auction').lean()
    ]);

    // 1. Settings
    if (dbSettings) {
      memSettings = { ...DEFAULT_SETTINGS, ...dbSettings };
    } else {
      await SettingsModel.findByIdAndUpdate('global_settings', memSettings, { upsert: true });
    }

    // 2. Donors
    if (dbDonors && dbDonors.length > 0) {
      memDonors = dbDonors;
    } else if (memDonors && memDonors.length > 0) {
      // First time initial upload from local JSON
      await DonorModel.insertMany(memDonors);
    }

    // 3. Events
    if (dbEvents && dbEvents.length > 0) {
      memEvents = dbEvents;
    } else if (memEvents && memEvents.length > 0) {
      await EventModel.insertMany(memEvents);
    }

    // 4. Messages
    if (dbMessages && dbMessages.length > 0) {
      memMessages = dbMessages;
    } else if (memMessages && memMessages.length > 0) {
      await MessageModel.insertMany(memMessages);
    }

    // 5. Auction
    if (dbAuction) {
      memAuction = { ...DEFAULT_AUCTION, ...dbAuction };
    } else {
      await AuctionModel.findByIdAndUpdate('live_laddu_auction', memAuction, { upsert: true });
    }

    // Backup current synchronized data to local JSON
    writeJsonFile(DONORS_FILE, memDonors);
    writeJsonFile(EVENTS_FILE, memEvents);
    writeJsonFile(MESSAGES_FILE, memMessages);
    writeJsonFile(SETTINGS_FILE, memSettings);
    writeJsonFile(AUCTION_FILE, memAuction);

    dbStatus.lastSyncTime = new Date().toISOString();
    return true;
  } catch (err) {
    dbStatus.connected = false;
    dbStatus.mode = 'local';
    dbStatus.error = err.message;
    console.error('❌ MongoDB Connection Error. Falling back to local JSON:', err.message);
    return false;
  }
}

// Initial Database Initialization
export async function initDb() {
  // Check environment variables first
  const envUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URL;
  
  // Or check saved database config
  let savedConfig = readJsonFile(CONFIG_FILE, {});
  const uriToUse = envUri || savedConfig.mongodbUri;

  if (uriToUse) {
    await connectDatabase(uriToUse);
  } else {
    console.log('ℹ️ Running in Local Storage Mode. Add MONGODB_URI to Render Environment Variables for cloud persistence.');
  }
}

// Database helper object
export const db = {
  init: initDb,
  
  // Connection Status & Management
  getStatus: () => ({
    ...dbStatus,
    stats: {
      totalDonors: memDonors.length,
      totalMessages: memMessages.length,
      totalBids: memAuction?.bidsHistory?.length || 0,
      totalEvents: memEvents.length
    }
  }),

  connect: async (uri) => {
    if (!uri) throw new Error('MongoDB Connection URI is required');
    const success = await connectDatabase(uri.trim());
    if (success) {
      writeJsonFile(CONFIG_FILE, { mongodbUri: uri.trim(), connectedAt: new Date().toISOString() });
      return { success: true, status: db.getStatus() };
    } else {
      throw new Error(dbStatus.error || 'Failed to connect to MongoDB');
    }
  },

  // Export Full JSON Backup
  exportBackup: () => ({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: memSettings,
    donors: memDonors,
    events: memEvents,
    messages: memMessages,
    auction: memAuction
  }),

  // Import Full JSON Backup
  importBackup: async (backupData) => {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data format');
    }

    if (backupData.settings) {
      memSettings = { ...DEFAULT_SETTINGS, ...backupData.settings };
      writeJsonFile(SETTINGS_FILE, memSettings);
      persistMongoSettings(memSettings);
    }

    if (Array.isArray(backupData.donors)) {
      memDonors = backupData.donors;
      writeJsonFile(DONORS_FILE, memDonors);
      if (dbStatus.connected && DonorModel) {
        await DonorModel.deleteMany({});
        if (memDonors.length > 0) await DonorModel.insertMany(memDonors);
      }
    }

    if (Array.isArray(backupData.events)) {
      memEvents = backupData.events;
      writeJsonFile(EVENTS_FILE, memEvents);
      if (dbStatus.connected && EventModel) {
        await EventModel.deleteMany({});
        if (memEvents.length > 0) await EventModel.insertMany(memEvents);
      }
    }

    if (Array.isArray(backupData.messages)) {
      memMessages = backupData.messages;
      writeJsonFile(MESSAGES_FILE, memMessages);
      if (dbStatus.connected && MessageModel) {
        await MessageModel.deleteMany({});
        if (memMessages.length > 0) await MessageModel.insertMany(memMessages);
      }
    }

    if (backupData.auction) {
      memAuction = { ...DEFAULT_AUCTION, ...backupData.auction };
      writeJsonFile(AUCTION_FILE, memAuction);
      persistMongoAuction(memAuction);
    }

    return {
      success: true,
      donorsCount: memDonors.length,
      messagesCount: memMessages.length,
      bidsCount: memAuction?.bidsHistory?.length || 0
    };
  },

  // Donors
  getDonors: () => memDonors,
  saveDonors: (donors) => {
    memDonors = donors;
    writeJsonFile(DONORS_FILE, donors);
  },
  addDonor: (donor) => {
    const newDonor = {
      id: `dn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      status: donor.status || "Pending Verification",
      ...donor
    };
    memDonors.unshift(newDonor);
    writeJsonFile(DONORS_FILE, memDonors);
    persistMongoDonor(newDonor);
    return newDonor;
  },
  updateDonor: (id, updatedFields) => {
    const index = memDonors.findIndex(d => d.id === id);
    if (index !== -1) {
      memDonors[index] = { ...memDonors[index], ...updatedFields, updatedAt: new Date().toISOString() };
      writeJsonFile(DONORS_FILE, memDonors);
      persistMongoDonor(memDonors[index]);
      return memDonors[index];
    }
    return null;
  },
  deleteDonor: (id) => {
    const index = memDonors.findIndex(d => d.id === id);
    if (index !== -1) {
      memDonors.splice(index, 1);
      writeJsonFile(DONORS_FILE, memDonors);
      deleteMongoDonor(id);
      return true;
    }
    return false;
  },

  // Events
  getEvents: () => memEvents,
  saveEvents: (events) => {
    memEvents = events;
    writeJsonFile(EVENTS_FILE, events);
  },
  updateEvent: (id, updatedFields) => {
    const index = memEvents.findIndex(e => e.id === id);
    if (index !== -1) {
      memEvents[index] = { ...memEvents[index], ...updatedFields };
      writeJsonFile(EVENTS_FILE, memEvents);
      persistMongoEvent(memEvents[index]);
      return memEvents[index];
    }
    return null;
  },

  // Messages
  getMessages: () => memMessages,
  saveMessages: (messages) => {
    memMessages = messages;
    writeJsonFile(MESSAGES_FILE, messages);
  },
  addMessage: (msg) => {
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      reactions: {},
      ...msg
    };
    memMessages.push(newMsg);
    if (memMessages.length > 500) memMessages.shift();
    writeJsonFile(MESSAGES_FILE, memMessages);
    persistMongoMessage(newMsg);
    return newMsg;
  },
  deleteMessage: (id) => {
    const index = memMessages.findIndex(m => m.id === id);
    if (index !== -1) {
      memMessages.splice(index, 1);
      writeJsonFile(MESSAGES_FILE, memMessages);
      deleteMongoMessage(id);
      return true;
    }
    return false;
  },
  toggleReaction: (msgId, emoji, userKey) => {
    const msg = memMessages.find(m => m.id === msgId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      writeJsonFile(MESSAGES_FILE, memMessages);
      persistMongoMessage(msg);
      return msg;
    }
    return null;
  },

  // Settings
  getSettings: () => memSettings,
  saveSettings: (settings) => {
    memSettings = settings;
    writeJsonFile(SETTINGS_FILE, settings);
    persistMongoSettings(settings);
    return memSettings;
  },

  // Live Laddu Auction
  getAuction: () => memAuction,
  saveAuction: (auction) => {
    memAuction = auction;
    writeJsonFile(AUCTION_FILE, auction);
    persistMongoAuction(auction);
    return memAuction;
  },
  updateAuction: (fields) => {
    memAuction = { ...memAuction, ...fields, updatedAt: new Date().toISOString() };
    writeJsonFile(AUCTION_FILE, memAuction);
    persistMongoAuction(memAuction);
    return memAuction;
  },
  addRegisteredBidder: ({ name, gotram, phone }) => {
    if (!memAuction.registeredBidders) memAuction.registeredBidders = [];
    const newBidder = {
      id: `bidder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      gotram: gotram ? gotram.trim() : 'శివ గోత్రం',
      phone: phone ? phone.trim() : '',
      createdAt: new Date().toISOString()
    };
    memAuction.registeredBidders.push(newBidder);
    db.saveAuction(memAuction);
    return newBidder;
  },
  updateRegisteredBidder: (id, { name, gotram, phone }) => {
    if (!memAuction.registeredBidders) return null;
    const bidder = memAuction.registeredBidders.find(b => b.id === id);
    if (!bidder) return null;

    const oldName = bidder.name;
    bidder.name = name.trim();
    if (gotram !== undefined) bidder.gotram = gotram.trim();
    if (phone !== undefined) bidder.phone = phone.trim();

    // Propagate corrected name/gotram/phone to existing bidsHistory
    if (memAuction.bidsHistory) {
      memAuction.bidsHistory.forEach(b => {
        if (b.bidderName.trim().toLowerCase() === oldName.trim().toLowerCase()) {
          b.bidderName = bidder.name;
          if (bidder.gotram) b.gotram = bidder.gotram;
          if (bidder.phone) b.phone = bidder.phone;
        }
      });
    }

    // Propagate to current highest bidder if matching
    if (memAuction.highestBidderName && memAuction.highestBidderName.trim().toLowerCase() === oldName.trim().toLowerCase()) {
      memAuction.highestBidderName = bidder.name;
      if (bidder.gotram) memAuction.highestBidderGotram = bidder.gotram;
      if (bidder.phone) memAuction.highestBidderPhone = bidder.phone;
    }

    // Propagate to winner if matching
    if (memAuction.winner && memAuction.winner.name && memAuction.winner.name.trim().toLowerCase() === oldName.trim().toLowerCase()) {
      memAuction.winner.name = bidder.name;
      if (bidder.gotram) memAuction.winner.gotram = bidder.gotram;
      if (bidder.phone) memAuction.winner.phone = bidder.phone;
    }

    memAuction.updatedAt = new Date().toISOString();
    db.saveAuction(memAuction);
    return { bidder, auction: memAuction };
  },
  deleteRegisteredBidder: (id) => {
    if (!memAuction.registeredBidders) return false;
    const initialLen = memAuction.registeredBidders.length;
    memAuction.registeredBidders = memAuction.registeredBidders.filter(b => b.id !== id);
    if (memAuction.registeredBidders.length !== initialLen) {
      db.saveAuction(memAuction);
      return true;
    }
    return false;
  },
  addBid: ({ bidderName, gotram, amount, note, phone }) => {
    const numAmount = Number(amount);
    const newBid = {
      id: `bid-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      bidderName: bidderName.trim(),
      gotram: gotram ? gotram.trim() : 'శివ గోత్రం',
      phone: phone ? phone.trim() : '',
      amount: numAmount,
      note: note ? note.trim() : '',
      timestamp: new Date().toISOString()
    };

    if (!memAuction.bidsHistory) memAuction.bidsHistory = [];
    memAuction.bidsHistory.unshift(newBid);
    memAuction.currentHighestBid = numAmount;
    memAuction.highestBidderName = bidderName.trim();
    memAuction.highestBidderGotram = gotram ? gotram.trim() : 'శివ గోత్రం';
    memAuction.highestBidderPhone = phone ? phone.trim() : '';
    memAuction.bidsCount = memAuction.bidsHistory.length;
    memAuction.updatedAt = new Date().toISOString();

    // Auto-save bidder to registeredBidders if not already present
    if (!memAuction.registeredBidders) memAuction.registeredBidders = [];
    const exists = memAuction.registeredBidders.some(b => b.name.toLowerCase() === bidderName.trim().toLowerCase());
    if (!exists) {
      memAuction.registeredBidders.push({
        id: `bidder-${Date.now()}`,
        name: bidderName.trim(),
        gotram: gotram ? gotram.trim() : 'శివ గోత్రం',
        phone: phone ? phone.trim() : ''
      });
    }

    db.saveAuction(memAuction);
    return { newBid, auction: memAuction };
  },
  undoBid: () => {
    if (!memAuction.bidsHistory || memAuction.bidsHistory.length === 0) return null;
    const removedBid = memAuction.bidsHistory.shift();
    memAuction.bidsCount = memAuction.bidsHistory.length;
    if (memAuction.bidsHistory.length > 0) {
      const topBid = memAuction.bidsHistory[0];
      memAuction.currentHighestBid = topBid.amount;
      memAuction.highestBidderName = topBid.bidderName;
      memAuction.highestBidderGotram = topBid.gotram;
      memAuction.highestBidderPhone = topBid.phone;
    } else {
      memAuction.currentHighestBid = memAuction.startingBid || 5001;
      memAuction.highestBidderName = '';
      memAuction.highestBidderGotram = '';
      memAuction.highestBidderPhone = '';
    }
    memAuction.updatedAt = new Date().toISOString();
    db.saveAuction(memAuction);
    return { removedBid, auction: memAuction };
  },
  declareWinner: ({ winnerName, gotram, winningBid, phone, message }) => {
    memAuction.status = 'completed';
    memAuction.winner = {
      name: winnerName || memAuction.highestBidderName || 'మహా భక్తుడు',
      gotram: gotram || memAuction.highestBidderGotram || 'శివ గోత్రం',
      winningBid: Number(winningBid) || memAuction.currentHighestBid || 5001,
      phone: phone || memAuction.highestBidderPhone || '',
      message: message || 'సర్వేజనాః సుఖినోభవంతు - శ్రీ వినాయక మహా లడ్డూ ప్రసాద విజేత',
      declaredAt: new Date().toISOString()
    };
    memAuction.updatedAt = new Date().toISOString();
    db.saveAuction(memAuction);
    return memAuction;
  },
  resetAuction: (startingBid = 5001) => {
    const defaultData = {
      ...DEFAULT_AUCTION,
      startingBid: Number(startingBid) || 5001,
      currentHighestBid: Number(startingBid) || 5001,
      updatedAt: new Date().toISOString()
    };
    db.saveAuction(defaultData);
    return defaultData;
  }
};
