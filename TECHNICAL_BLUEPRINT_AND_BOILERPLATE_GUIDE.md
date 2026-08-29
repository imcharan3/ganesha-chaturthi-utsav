# Full-Stack Hybrid Web & Mobile App Architecture Blueprint
### Universal Production Boilerplate & Deployment Playbook

---

## 1. System Architecture Overview

This blueprint describes a production-tested, full-stack hybrid architecture designed for lightning-fast web experiences and seamless native Android/iOS APK deployment using a single codebase.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CLIENT LAYER                                     │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │   React 18 + Vite Web App       │   │  Capacitor 8 Android Native APK │  │
│  │   (Tailwind CSS, Lucide, Canvas)│   │  (WebView, Native Channels, FCM)│  │
│  └────────────────┬────────────────┘   └────────────────┬────────────────┘  │
└───────────────────┼─────────────────────────────────────┼───────────────────┘
                    │ REST / SSE / WebSockets             │
┌───────────────────▼─────────────────────────────────────▼───────────────────┐
│                            BACKEND LAYER (Node.js + Express)                │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │   Express.js REST Endpoints     │   │   Socket.IO Real-Time Engine    │  │
│  │   - Version & APK Stream API    │   │   - Live Bid / Chat Broadcast   │  │
│  │   - CRUD & File Uploads (Multer)│   │   - Instant Sync Events         │  │
│  └────────────────┬────────────────┘   └────────────────┬────────────────┘  │
│  ┌────────────────▼─────────────────────────────────────▼────────────────┐  │
│  │   Firebase Cloud Messaging (FCM Admin SDK Push Dispatcher)            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                            DATA PERSISTENCE LAYER                           │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │ 0ms In-Memory Cache (RAM)     │◄───►│ MongoDB Atlas (Cloud Cluster)   │  │
│  └───────────────┬───────────────┘     └─────────────────────────────────┘  │
│                  │ (Fallback)                                               │
│  ┌───────────────▼───────────────┐                                          │
│  │ Local JSON Files (Disk)       │                                          │
│  └───────────────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Skeleton

```
project-root/
├── android/                        # Native Android Studio Project (Capacitor generated)
│   ├── app/
│   │   ├── build.gradle            # App-level build configuration (versionCode, versionName, signing)
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Permissions (POST_NOTIFICATIONS, INTERNET, STORAGE)
│   │       ├── java/.../MainActivity.java # Native notification channels & WebView DownloadListener
│   │       └── res/xml/file_paths.xml    # FileProvider paths for APK & media sharing
│   ├── build.gradle                # Root Gradle configuration
│   └── gradle.properties
├── capacitor.config.json           # Capacitor configuration (appId, appName, webDir, server)
├── dist/                           # Compiled frontend production bundle (served by Express & Capacitor)
├── server/                         # Backend Node.js / Express Server
│   ├── db.js                       # Hybrid DB Engine (In-memory + MongoDB + Local JSON fallback)
│   ├── server.js                   # API Routes, Socket.IO, FCM Push, Version Update & Static file server
│   ├── data/                       # Local JSON storage fallback (auto-created)
│   └── uploads/                    # Local storage for user uploads / screenshots
├── src/                            # React 18 Frontend
│   ├── assets/                     # Logos, background images, audios
│   ├── components/                 # Reusable UI & Modal components
│   │   ├── AppUpdateModal.jsx      # In-App 1-Tap Auto-Updater Modal
│   │   ├── DevotionalNotificationToast.jsx # Floating in-app toast alerts
│   │   ├── LedgerReportModal.jsx   # Interactive A4 Full Ledger & PDF Print Viewer
│   │   └── ReceiptPreviewModal.jsx # Full-screen canvas receipt renderer & PDF print
│   ├── context/                    # React Context (AuthContext, SocketContext)
│   ├── services/
│   │   └── api.js                  # Frontend API Client with dynamic host resolution
│   ├── utils/
│   │   ├── audio.js                # Chimes, bell sound synthesis, image compression
│   │   ├── fileDownloader.js       # Crash-proof universal PDF & image downloader
│   │   ├── notifications.js        # Universal 3-tier notification dispatcher (FCM, Local, Toast)
│   │   └── offlineStorage.js       # Offline localStorage cache & sync queue
│   ├── App.jsx                     # Root application container & tab router
│   ├── index.css                   # Tailwind imports & custom scrollbar / devotional theme
│   └── main.jsx                    # React entry point
├── package.json                    # Dependencies & npm scripts
├── tailwind.config.js              # Tailwind styling config
└── vite.config.js                  # Vite bundler config with chunk splitting
```

---

## 3. Database Architecture & Hybrid Persistence Engine

### Core Philosophy:
1. **0ms Read Latency**: All data is mirrored in Node.js memory (`memData`), providing instantaneous response to all clients without waiting for database roundtrips.
2. **Dual-Mode Persistence**:
   - **Mode A (Cloud)**: Connected to MongoDB Atlas via Mongoose with automatic background upserts.
   - **Mode B (Local)**: If MongoDB URI is not supplied or connection fails, automatically falls back to synchronous local JSON files in `server/data/`.
3. **Zero Data Loss**: In-memory updates immediately write to local JSON as safety buffer while asynchronously persisting to MongoDB.

### Boilerplate Implementation (`server/db.js`):

```javascript
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'records.json');

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    return false;
  }
}

// 1. Mongoose Schema
const RecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, default: 'Paid' }, // 'Paid' | 'Partially Paid' | 'Unpaid'
  status: { type: String, default: 'Verified' },
  createdAt: { type: String, default: () => new Date().toISOString() }
}, { collection: 'records', strict: false });

let RecordModel;
try {
  RecordModel = mongoose.model('Record', RecordSchema);
} catch (e) {
  RecordModel = mongoose.models.Record;
}

// 2. In-Memory Store
let memRecords = readJsonFile(DB_FILE, []);
let dbStatus = { connected: false, mode: 'local', error: null };

// 3. Connect to MongoDB
export async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    dbStatus.connected = true;
    dbStatus.mode = 'mongodb';
    
    // Sync initial state from Mongo
    const dbRecords = await RecordModel.find({}).lean();
    if (dbRecords && dbRecords.length > 0) {
      memRecords = dbRecords;
      writeJsonFile(DB_FILE, memRecords);
    }
    return true;
  } catch (err) {
    dbStatus.connected = false;
    dbStatus.mode = 'local';
    dbStatus.error = err.message;
    return false;
  }
}

// 4. Data Access Helper
export const db = {
  getRecords: () => memRecords,
  addRecord: (data) => {
    const item = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
      ...data
    };
    memRecords.unshift(item);
    writeJsonFile(DB_FILE, memRecords);
    if (dbStatus.connected && RecordModel) {
      RecordModel.findOneAndUpdate({ id: item.id }, item, { upsert: true }).catch(console.error);
    }
    return item;
  },
  updateRecord: (id, updateData) => {
    const index = memRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      memRecords[index] = { ...memRecords[index], ...updateData, updatedAt: new Date().toISOString() };
      writeJsonFile(DB_FILE, memRecords);
      if (dbStatus.connected && RecordModel) {
        RecordModel.findOneAndUpdate({ id }, memRecords[index], { upsert: true }).catch(console.error);
      }
      return memRecords[index];
    }
    return null;
  },
  deleteRecord: (id) => {
    const index = memRecords.findIndex(r => r.id === id);
    if (index !== -1) {
      memRecords.splice(index, 1);
      writeJsonFile(DB_FILE, memRecords);
      if (dbStatus.connected && RecordModel) {
        RecordModel.deleteOne({ id }).catch(console.error);
      }
      return true;
    }
    return false;
  }
};
```

---

## 4. Real-Time WebSockets & Push Notifications Architecture

### 3-Tier Alert Delivery Strategy:
1. **Tier 1 (FCM Push)**: Background push to devices when the app is minimized or closed.
2. **Tier 2 (Capacitor LocalNotifications)**: Native Android OS status bar banner when app is active.
3. **Tier 3 (In-App Floating Toast)**: Instant visual & audio chime inside the web/app UI with zero dependencies.

### Server-Side Push Dispatcher (`server/server.js`):
```javascript
import admin from 'firebase-admin';

// Initialize Firebase Admin (Using service account env or file)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (e) {
    console.warn('Firebase init error:', e.message);
  }
}

export const sendPushAlert = async ({ title, body, tab = 'home', actionData = null }) => {
  try {
    const tokens = db.getPushTokens(); // Array of registered FCM token strings
    if (tokens.length === 0 || !admin.apps.length) return;

    const payload = {
      tokens,
      notification: { title, body },
      data: { tab, actionData: actionData ? JSON.stringify(actionData) : '' },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'app_high_priority_alerts',
          priority: 'max'
        }
      }
    };
    await admin.messaging().sendEachForMulticast(payload);
  } catch (err) {
    console.warn('Push dispatch failed:', err.message);
  }
};
```

### Client-Side Notification Dispatcher (`src/utils/notifications.js`):
```javascript
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { api } from '../services/api';

export const initPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Create Channels
    await PushNotifications.createChannel({
      id: 'app_high_priority_alerts',
      name: 'General Alerts',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true
    }).catch(() => {});

    // 2. Request Permissions
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') perm = await PushNotifications.requestPermissions();
    if (perm.receive === 'granted') await PushNotifications.register();

    // 3. Save FCM Token to backend
    PushNotifications.addListener('registration', async (token) => {
      localStorage.setItem('fcm_device_token', token.value);
      await api.registerPushToken(token.value).catch(() => {});
    });

    // 4. Foreground Receiver
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      showInAppNotification({
        title: notification.title,
        body: notification.body,
        tab: notification.data?.tab
      });
    });
  } catch (e) {
    console.warn('Push init error:', e);
  }
};

export const showInAppNotification = ({ title, body, tab }) => {
  // Dispatch custom event to React toast listener
  window.dispatchEvent(new CustomEvent('in-app-toast-alert', {
    detail: { id: Date.now(), title, body, tab, timestamp: new Date().toISOString() }
  }));

  // Trigger LocalNotification in Android tray
  if (Capacitor.isNativePlatform()) {
    LocalNotifications.schedule({
      notifications: [{
        id: Math.floor(Math.random() * 1000000),
        title,
        body,
        channelId: 'app_high_priority_alerts',
        schedule: { at: new Date(Date.now() + 100) }
      }]
    }).catch(() => {});
  }
};
```

---

## 5. Crash-Proof Android WebView & File Download System

### Common Android WebView Pitfalls & Solutions:

| Problem in Android WebView | Root Cause | Solution |
| :--- | :--- | :--- |
| **`TransactionTooLargeException`** (App keeps stopping crash) | Passing multi-megabyte base64 strings across Capacitor IPC Bridge | **Never pass large base64 strings over IPC.** Use direct Blob URLs or DOM printing. |
| **PDF/Image Download does nothing** | Android WebView blocks `<a download="file.pdf">` with `blob:` URLs by default | Use **`window.print()` / Android Print Spooler** or open direct HTTP endpoint with `DownloadListener`. |
| **Canvas generation hangs forever** | `new Image()` with `crossOrigin='anonymous'` hangs or stalls on local relative paths | Remove `crossOrigin` on local assets and wrap `new Promise` in a **600ms timeout fallback**. |

### Safe Universal Print-to-PDF Implementation:
```javascript
export const printReportToPdf = (title, tableHtml) => {
  const printWin = window.open('', '_blank');
  if (!printWin) {
    window.print();
    return;
  }

  const printHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; color: #111; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h2>${title}</h2>
        ${tableHtml}
      </body>
    </html>
  `;

  printWin.document.write(printHtml);
  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
    printWin.print();
  }, 400);
};
```

### Android Native `MainActivity.java` Setup:
```java
package com.mycompany.myapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // 1. Create Notification Channel
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (manager != null) {
                    NotificationChannel channel = new NotificationChannel(
                        "app_high_priority_alerts",
                        "App Live Notifications",
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.enableVibration(true);
                    channel.enableLights(true);
                    manager.createNotificationChannel(channel);
                }
            }

            // 2. Attach WebView Download Listener (Ensures download links open in system browser/downloader)
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW);
                        intent.setData(Uri.parse(url));
                        startActivity(intent);
                    } catch (Exception ignored) {}
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
```

---

## 6. In-App Auto-Update System (Direct APK Delivery)

### How It Works:
1. When the client app opens, `AppUpdateModal.jsx` calls `GET /api/app/version`.
2. Backend returns the latest `versionCode` and `latestVersion`.
3. If `remoteVersionCode > CURRENT_VERSION_CODE`, an in-app upgrade modal displays release notes and an **`[ Update Now ]`** button.
4. Clicking update streams the new APK file from `/download/app` directly.

### Backend Endpoint (`server/server.js`):
```javascript
app.get('/api/app/version', (req, res) => {
  res.json({
    latestVersion: '2.0',
    versionCode: 11,
    minSupportedVersion: '1.0',
    apkUrl: '/download/app',
    releaseDate: '2026-08-29',
    releaseNotes: '🎉 Brand new release with performance improvements.',
    title: 'App Update v2.0'
  });
});

app.get(['/download/app', '/download/apk'], (req, res) => {
  const apkPath = path.join(__dirname, 'App_Release.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="App_Release.apk"');
    return res.download(apkPath, 'App_Release.apk');
  }
  res.status(404).send('APK binary not found');
});
```

---

## 7. Android Studio & CLI Build Pipeline

### 1. Build & Sync Frontend to Native Project:
```bash
# Build React bundle and sync assets to android/app/src/main/assets/public
npm run build
npx cap sync android
```

### 2. Compile APKs with Gradle:
```bash
cd android

# Compile Debug APK (for instant testing on USB connected device)
.\gradlew.bat assembleDebug

# Compile Release APK (optimized, linted binary)
.\gradlew.bat assembleRelease
```

### 3. Binary Artifact Outputs:
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 8. Deployment on Render / Cloud Server

### Render Web Service Settings:
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `node server/server.js`
- **Environment Variables**:
  - `PORT`: `5000` (or assigned dynamically by Render)
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/production_db?retryWrites=true&w=majority`
  - `FIREBASE_SERVICE_ACCOUNT`: `{ ...json credentials... }`

### Express Server Static SPA Routing (`server/server.js`):
```javascript
import express from 'express';
import compression from 'compression';
import path from 'path';

const app = express();
app.use(compression());
app.use(express.json({ limit: '25mb' }));

const DIST_DIR = path.join(__dirname, '../dist');
app.use(express.static(DIST_DIR));

// Serve SPA fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/download')) {
    return next();
  }
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});
```

---

## 9. Quickstart Recipe for New Projects

```bash
# 1. Initialize Vite + React
npm create vite@latest my-app -- --template react
cd my-app

# 2. Install Core Dependencies
npm install express socket.io socket.io-client mongoose multer cors dotenv compression lucide-react clsx tailwind-merge canvas-confetti jspdf jspdf-autotable
npm install -D tailwindcss postcss autoprefixer concurrently @vitejs/plugin-react

# 3. Add Capacitor Mobile Support
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications @capacitor/local-notifications @capacitor/filesystem @capacitor/share
npx cap init "My App" "com.mycompany.myapp" --web-dir "dist"
npx cap add android

# 4. Run Development
npm run dev
```

---
*Documentation generated & stored permanently as master technical skeleton.*
