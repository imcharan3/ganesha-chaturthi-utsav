import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Default Initial Seed Data
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
  utsavName: "విజయ కాలనీ గణేష్ యూత్",
  subtitle: "Vijaya Colony Ganesha Youth • Vinayaka Chavithi 2026",
  location: "Vijaya Colony Mandapam",
  targetAmount: 70000,
  upiId: "charanadishti123@okaxis",
  upiName: "Charan Teja Adishti",
  adminPin: "ganesh2026",
  contactPhone: "+91 98765 43210",
  startDate: "2026-09-14T08:00:00.000Z"
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

// Database helper object
export const db = {
  // Donors
  getDonors: () => readJsonFile(DONORS_FILE, DEFAULT_DONORS),
  saveDonors: (donors) => writeJsonFile(DONORS_FILE, donors),
  addDonor: (donor) => {
    const donors = db.getDonors();
    const newDonor = {
      id: `dn-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      status: donor.status || "Pending Verification",
      ...donor
    };
    donors.unshift(newDonor);
    db.saveDonors(donors);
    return newDonor;
  },
  updateDonor: (id, updatedFields) => {
    const donors = db.getDonors();
    const index = donors.findIndex(d => d.id === id);
    if (index !== -1) {
      donors[index] = { ...donors[index], ...updatedFields, updatedAt: new Date().toISOString() };
      db.saveDonors(donors);
      return donors[index];
    }
    return null;
  },
  deleteDonor: (id) => {
    const donors = db.getDonors();
    const filtered = donors.filter(d => d.id !== id);
    if (filtered.length !== donors.length) {
      db.saveDonors(filtered);
      return true;
    }
    return false;
  },

  // Events
  getEvents: () => readJsonFile(EVENTS_FILE, DEFAULT_EVENTS),
  saveEvents: (events) => writeJsonFile(EVENTS_FILE, events),
  updateEvent: (id, updatedFields) => {
    const events = db.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = { ...events[index], ...updatedFields };
      db.saveEvents(events);
      return events[index];
    }
    return null;
  },

  // Messages
  getMessages: () => readJsonFile(MESSAGES_FILE, DEFAULT_MESSAGES),
  saveMessages: (messages) => writeJsonFile(MESSAGES_FILE, messages),
  addMessage: (msg) => {
    const messages = db.getMessages();
    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      reactions: {},
      ...msg
    };
    messages.push(newMsg);
    // Keep last 500 messages
    if (messages.length > 500) messages.shift();
    db.saveMessages(messages);
    return newMsg;
  },
  deleteMessage: (id) => {
    const messages = db.getMessages();
    const filtered = messages.filter(m => m.id !== id);
    if (filtered.length !== messages.length) {
      db.saveMessages(filtered);
      return true;
    }
    return false;
  },
  toggleReaction: (msgId, emoji, userKey) => {
    const messages = db.getMessages();
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      if (!msg.reactions) msg.reactions = {};
      msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
      db.saveMessages(messages);
      return msg;
    }
    return null;
  },

// Settings
  getSettings: () => readJsonFile(SETTINGS_FILE, DEFAULT_SETTINGS),
  saveSettings: (settings) => writeJsonFile(SETTINGS_FILE, settings),

  // Live Laddu Auction
  getAuction: () => readJsonFile(AUCTION_FILE, DEFAULT_AUCTION),
  saveAuction: (auction) => writeJsonFile(AUCTION_FILE, auction),
  updateAuction: (fields) => {
    const auction = db.getAuction();
    const updated = { ...auction, ...fields, updatedAt: new Date().toISOString() };
    db.saveAuction(updated);
    return updated;
  },
  addRegisteredBidder: ({ name, gotram, phone }) => {
    const auction = db.getAuction();
    if (!auction.registeredBidders) auction.registeredBidders = [];
    const newBidder = {
      id: `bidder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      gotram: gotram ? gotram.trim() : 'శివ గోత్రం',
      phone: phone ? phone.trim() : '',
      createdAt: new Date().toISOString()
    };
    auction.registeredBidders.push(newBidder);
    db.saveAuction(auction);
    return newBidder;
  },
  deleteRegisteredBidder: (id) => {
    const auction = db.getAuction();
    if (!auction.registeredBidders) return false;
    const initialLen = auction.registeredBidders.length;
    auction.registeredBidders = auction.registeredBidders.filter(b => b.id !== id);
    if (auction.registeredBidders.length !== initialLen) {
      db.saveAuction(auction);
      return true;
    }
    return false;
  },
  addBid: ({ bidderName, gotram, amount, note, phone }) => {
    const auction = db.getAuction();
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

    if (!auction.bidsHistory) auction.bidsHistory = [];
    auction.bidsHistory.unshift(newBid);
    auction.currentHighestBid = numAmount;
    auction.highestBidderName = bidderName.trim();
    auction.highestBidderGotram = gotram ? gotram.trim() : 'శివ గోత్రం';
    auction.highestBidderPhone = phone ? phone.trim() : '';
    auction.bidsCount = auction.bidsHistory.length;
    auction.updatedAt = new Date().toISOString();

    // Auto-save bidder to registeredBidders if not already present
    if (!auction.registeredBidders) auction.registeredBidders = [];
    const exists = auction.registeredBidders.some(b => b.name.toLowerCase() === bidderName.trim().toLowerCase());
    if (!exists) {
      auction.registeredBidders.push({
        id: `bidder-${Date.now()}`,
        name: bidderName.trim(),
        gotram: gotram ? gotram.trim() : 'శివ గోత్రం',
        phone: phone ? phone.trim() : ''
      });
    }

    db.saveAuction(auction);
    return { newBid, auction };
  },
  undoBid: () => {
    const auction = db.getAuction();
    if (!auction.bidsHistory || auction.bidsHistory.length === 0) return null;
    const removedBid = auction.bidsHistory.shift();
    auction.bidsCount = auction.bidsHistory.length;
    if (auction.bidsHistory.length > 0) {
      const topBid = auction.bidsHistory[0];
      auction.currentHighestBid = topBid.amount;
      auction.highestBidderName = topBid.bidderName;
      auction.highestBidderGotram = topBid.gotram;
      auction.highestBidderPhone = topBid.phone;
    } else {
      auction.currentHighestBid = auction.startingBid || 5001;
      auction.highestBidderName = '';
      auction.highestBidderGotram = '';
      auction.highestBidderPhone = '';
    }
    auction.updatedAt = new Date().toISOString();
    db.saveAuction(auction);
    return { removedBid, auction };
  },
  declareWinner: ({ winnerName, gotram, winningBid, phone, message }) => {
    const auction = db.getAuction();
    auction.status = 'completed';
    auction.winner = {
      name: winnerName || auction.highestBidderName || 'మహా భక్తుడు',
      gotram: gotram || auction.highestBidderGotram || 'శివ గోత్రం',
      winningBid: Number(winningBid) || auction.currentHighestBid || 5001,
      phone: phone || auction.highestBidderPhone || '',
      message: message || 'సర్వేజనాః సుఖినోభవంతు - శ్రీ వినాయక మహా లడ్డూ ప్రసాద విజేత',
      declaredAt: new Date().toISOString()
    };
    auction.updatedAt = new Date().toISOString();
    db.saveAuction(auction);
    return auction;
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
