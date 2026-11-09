const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// THIS IS THE LINE YOU CHANGED
const DATA_FILE = path.join('/data', 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MASTER_USERNAME = 'Jonathan12';
const MASTER_PASSWORD = 'JonathanroumieJesus100%';
const ADMIN_USERNAME = 'Jonathanroumie12';
const ADMIN_PASSWORD = 'JonathanlovesJesus100%';

let db = { users: [], admin: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD } };

function loadDB() {
  try {
    // Check if the disk directory exists, if not, make it
    if (!fs.existsSync('/data')) {
      fs.mkdirSync('/data', { recursive: true });
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (raw && Array.isArray(raw.users)) db.users = raw.users;
    }
  } catch (e) { 
    console.error('DB load failed:', e.message); 
  }

  // Re-create master user if wiped
  if (!db.users.some(u => u.username === 'Jonathan Roumie')) {
    db.users.push({
      username: 'Jonathan Roumie', fullName: 'Jonathan Roumie', email: 'jonathan.roumie@example.com',
      accountNum: '785234184606', ccNum: '892145236709', phone: '(555) 123-4567', address: '123 Main St, New York, NY',
      balance: 10000, cardBalance: 0, status: 'active', enableAuth: false, authCodeValue: '', transactions: [], alerts: []
    });
  }
  saveDB();
}

function saveDB() { 
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); 
  } catch (e) {
    console.error('DB save failed:', e.message);
  }
}
loadDB();

// ... REST OF YOUR server.js CODE GOES HERE ...