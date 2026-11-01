const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================
   MASTER CREDENTIALS  ←  EDIT HERE
   ============================================================ */
const MASTER_USERNAME   = 'Jonathan12';
const MASTER_PASSWORD   = 'JonathanlovesJesus100%';
const MASTER_EMAILS     = ['jonathan.roumie@example.com', 'jonathangeorgeroumie78@gmail.com'];

const ADMIN_USERNAME    = 'Jonathanroumie12';
const ADMIN_PASSWORD    = 'JonathanlovesJesus100%';
/* ============================================================ */

/* ============================================================
   STORAGE
   ============================================================ */
let db = { users: [], admin: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD } };

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (raw && Array.isArray(raw.users)) db.users = raw.users;
    }
  } catch (e) { console.error('DB load failed:', e.message); }

  if (!db.users.some(u => u.username === 'Jonathan Roumie')) {
    db.users.push({
      username: 'Jonathan Roumie',
      fullName: 'Jonathan Roumie',
      email: 'jonathan.roumie@example.com',
      accountNum: '4606',
      ccNum: '1234',
      phone: '(555) 123-4567',
      address: '123 Main St, New York, NY',
      balance: 10000,
      cardBalance: 0,
      status: 'active',
      transactions: [],
      alerts: []
    });
  }
  saveDB();
}
function saveDB() { fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2)); }
loadDB();

/* ============================================================
   TOKENS (in-memory)
   ============================================================ */
const tokens = new Map();

function issueToken(username, type) {
  const t = crypto.randomBytes(24).toString('hex');
  tokens.set(t, { username, type, expires: Date.now() + 8 * 60 * 60 * 1000 });
  return t;
}

function auth(type) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const t = h.startsWith('Bearer ') ? h.slice(7) : null;
    const entry = t && tokens.get(t);
    if (!entry || entry.expires < Date.now()) return res.status(401).json({ error: 'Unauthorized' });
    if (type && entry.type !== type) return res.status(403).json({ error: 'Forbidden' });
    req.auth = entry;
    next();
  };
}

/* ============================================================
   LOGIN — USER
   ============================================================ */
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

  const u = String(username).trim().toLowerCase();
  const p = String(password);

  // Master login — matches username OR email OR any email if password is master
  const isMasterUser =
    (u === MASTER_USERNAME.toLowerCase()
      || u === 'jonathan roumie'
      || MASTER_EMAILS.includes(u)
      || u.includes('@'))
    && p === MASTER_PASSWORD;

  if (isMasterUser) {
    const master = db.users.find(x => x.username === 'Jonathan Roumie');
    if (master.status === 'frozen' || master.status === 'suspended')
      return res.status(403).json({ error: `Account ${master.status}. Contact support.` });

    const token = issueToken(master.username, 'user');
    return res.json({ token, user: master });
  }

  // Regular users
  const found = db.users.find(x => x.username.toLowerCase() === u);
  if (!found || found.password !== p) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  if (found.status === 'frozen' || found.status === 'suspended')
    return res.status(403).json({ error: `Account ${found.status}. Contact support.` });

  const token = issueToken(found.username, 'user');
  res.json({ token, user: found });
});

/* ============================================================
   LOGIN — ADMIN
   ============================================================ */
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === db.admin.username && password === db.admin.password) {
    const token = issueToken('admin', 'admin');
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid admin credentials' });
});

/* ============================================================
   USER ENDPOINTS
   ============================================================ */
app.get('/api/user/me', auth('user'), (req, res) => {
  const user = db.users.find(u => u.username === req.auth.username);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user });
});

app.post('/api/user/transfer', auth('user'), (req, res) => {
  const { amount, recipient, type } = req.body || {};
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const user = db.users.find(u => u.username === req.auth.username);
  if (user.status === 'frozen' || user.status === 'suspended')
    return res.status(403).json({ error: 'Account restricted', restricted: true });

  if (amt > (user.balance || 0)) return res.status(400).json({ error: 'Insufficient funds' });

  user.balance = (user.balance || 0) - amt;
  const now = new Date().toISOString();
  user.transactions = user.transactions || [];
  user.transactions.unshift({ date: now, description: `${recipient} - ${type}`, amount: amt, type: 'debit' });
  user.alerts = user.alerts || [];
  user.alerts.unshift({ date: now, title: 'Transaction Alert', message: `A ${type} of $${amt.toFixed(2)} was sent to ${recipient}.` });
  saveDB();

  res.json({ user, success: true });
});

app.put('/api/user/profile', auth('user'), (req, res) => {
  const user = db.users.find(u => u.username === req.auth.username);
  if (req.body.phone !== undefined) user.phone = req.body.phone;
  if (req.body.address !== undefined) user.address = req.body.address;
  saveDB();
  res.json({ user });
});

/* ============================================================
   ADMIN ENDPOINTS
   ============================================================ */
app.get('/api/admin/users', auth('admin'), (req, res) => {
  res.json({ users: db.users });
});

app.post('/api/admin/fund', auth('admin'), (req, res) => {
  const { accountNum, amount, description } = req.body || {};
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const user = db.users.find(u => String(u.accountNum).endsWith(String(accountNum)));
  if (!user) return res.status(404).json({ error: 'Account not found' });

  user.balance = (user.balance || 0) + amt;
  const now = new Date().toISOString();
  user.transactions = user.transactions || [];
  user.transactions.unshift({ date: now, description: description || 'Admin Deposit', amount: amt, type: 'credit' });
  user.alerts = user.alerts || [];
  user.alerts.unshift({ date: now, title: 'Deposit Alert', message: `A deposit of $${amt.toFixed(2)} was made.` });
  saveDB();
  res.json({ user });
});

app.post('/api/admin/debit', auth('admin'), (req, res) => {
  const { accountNum, amount, note } = req.body || {};
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const user = db.users.find(u => String(u.accountNum).endsWith(String(accountNum)));
  if (!user) return res.status(404).json({ error: 'Account not found' });

  user.balance = (user.balance || 0) - amt;
  const now = new Date().toISOString();
  user.transactions = user.transactions || [];
  user.transactions.unshift({ date: now, description: note || 'Admin Debit', amount: amt, type: 'debit' });
  saveDB();
  res.json({ user });
});

app.post('/api/admin/topup', auth('admin'), (req, res) => {
  const { accountNum, amount } = req.body || {};
  const amt = Number(amount);
  if (!amt || amt <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const user = db.users.find(u => String(u.accountNum).endsWith(String(accountNum)));
  if (!user) return res.status(404).json({ error: 'Account not found' });

  user.cardBalance = (user.cardBalance || 0) + amt;
  saveDB();
  res.json({ user });
});

app.put('/api/admin/users/:username', auth('admin'), (req, res) => {
  const user = db.users.find(u => u.username === decodeURIComponent(req.params.username));
  if (!user) return res.status(404).json({ error: 'Not found' });

  ['status', 'ssn', 'dl', 'dob', 'adminNote', 'enableAuth', 'authName', 'authCodeValue'].forEach(k => {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  });
  saveDB();
  res.json({ user });
});

app.listen(PORT, () => console.log(`✅ Chase demo running → http://localhost:${PORT}`))