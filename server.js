// Debit Checking
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

// Manage User (Update Status, SSN, etc)
app.put('/api/admin/users/:username', auth('admin'), (req, res) => {
  const user = db.users.find(u => u.username === decodeURIComponent(req.params.username));
  if (!user) return res.status(404).json({ error: 'Not found' });

  ['status', 'ssn', 'dl', 'dob', 'adminNote'].forEach(k => {
    if (req.body[k] !== undefined) user[k] = req.body[k];
  });
  saveDB();
  res.json({ user });
});