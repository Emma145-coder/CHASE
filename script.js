// ==========================================
// 1. DATABASE & UTILITIES
// ==========================================
function getUsers() { return JSON.parse(localStorage.getItem('chase_users') || '[]'); }
function saveUsers(users) { localStorage.setItem('chase_users', JSON.stringify(users)); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }
function logout() { localStorage.removeItem('chase_currentUser'); window.location.reload(); }

document.addEventListener('DOMContentLoaded', () => {
    
    // Create a test user if the database is empty
    let users = getUsers();
    if (users.length === 0) {
        users.push({
            username: "Jonathan Roumie", fullName: "Jonathan Roumie", 
            email: "jonathangeorgeroumie78@gmail.com", password: "password123",
            accountNum: "4606", balance: 10000, status: "active", 
            enableAuth: false, authCodeValue: "", transactions: []
        });
        saveUsers(users);
    }

    // ==========================================
    // 2. ADMIN LOGIC (Runs on admin.html)
    // ==========================================
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value.trim();
            const pass = document.getElementById('admin-password').value;
            
            if (email === "Jonathanroumie12" && pass === "JonathanlovesJesus100%") {
                document.getElementById('login-screen').style.display = 'none'; 
                document.getElementById('admin-dashboard').style.display = 'block'; 
                loadAdminData();
            } else { alert('Invalid Admin Credentials'); }
        });

        document.getElementById('btn-admin-signout').addEventListener('click', () => window.location.reload());

        window.loadAdminData = function() {
            let users = getUsers();
            const list = document.getElementById('user-list-container');
            list.innerHTML = '';

            users.forEach(user => {
                let statusClass = user.status === 'active' ? 'color: green' : 'color: red';
                list.innerHTML += `
                    <div class="user-list-item">
                        <div>
                            <h4 style="color: var(--chase-header-blue);">${user.fullName}</h4>
                            <p>Acct: ...${user.accountNum} | Bal: $${(user.balance).toFixed(2)}</p>
                            <span style="font-size: 12px; font-weight: bold; ${statusClass}">${user.status.toUpperCase()}</span>
                        </div>
                        <button class="btn-manage" onclick="openManageModal('${user.username}')">Manage</button>
                    </div>
                `;
            });

            document.getElementById('stat-active').textContent = users.filter(u => u.status === 'active').length;
            document.getElementById('stat-suspended').textContent = users.filter(u => u.status !== 'active').length;
            document.getElementById('stat-deposits').textContent = '$' + users.reduce((sum, u) => sum + u.balance, 0).toFixed(2);
        };

        window.openManageModal = function(username) {
            let users = getUsers();
            const user = users.find(u => u.username === username);
            if (!user) return;
            
            document.getElementById('modal-username').value = user.username;
            document.getElementById('modal-status').value = user.status;
            document.getElementById('modal-enable-auth').checked = user.enableAuth || false;
            document.getElementById('modal-auth-code').value = user.authCodeValue || '';
            document.getElementById('manage-user-modal').classList.add('active');
        };

        document.getElementById('manage-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('modal-username').value;
            let users = getUsers();
            const idx = users.findIndex(u => u.username === username);

            if (idx !== -1) {
                users[idx].status = document.getElementById('modal-status').value;
                users[idx].enableAuth = document.getElementById('modal-enable-auth').checked;
                users[idx].authCodeValue = document.getElementById('modal-auth-code').value.trim();
                
                saveUsers(users);
                alert('User updated!');
                closeModal('manage-user-modal');
                loadAdminData();
            }
        });
    }

    // ==========================================
    // 3. USER LOGIC (Runs on index.html)
    // ==========================================
    const userLoginForm = document.getElementById('user-login-form');
    if (userLoginForm) {
        userLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('user-email').value.trim();
            const pass = document.getElementById('user-password').value;
            
            let users = getUsers();
            const user = users.find(u => u.email === email && u.password === pass);
            
            if (user) {
                localStorage.setItem('chase_currentUser', JSON.stringify(user));
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app-screen').style.display = 'block';
                updateUserUI(user);
            } else { alert('Invalid user credentials'); }
        });

        function updateUserUI(user) {
            document.getElementById('user-display-name').innerText = user.fullName;
            document.getElementById('user-balance').innerText = `$${(user.balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        }

        // --- TRANSFER LOGIC ---
        let pendingTransfer = { amount: 0, recipient: "" };

        document.getElementById('user-transfer-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('user-amount').value);
            const recipient = document.getElementById('user-recipient').value;
            
            let users = getUsers();
            let currentUser = JSON.parse(localStorage.getItem('chase_currentUser'));
            let userIndex = users.findIndex(u => u.email === currentUser.email);
            let user = users[userIndex];

            if (user.balance < amount) return alert("Insufficient funds");
            pendingTransfer = { amount, recipient };

            // CHECK 1: Is Account Frozen/Suspended?
            if (user.status === 'frozen' || user.status === 'suspended') {
                document.getElementById('restricted-modal').classList.add('active');
                return;
            }

            // CHECK 2: Is IMF Auth Required?
            if (user.enableAuth && user.authCodeValue) {
                document.getElementById('verification-modal').classList.add('active');
                return;
            }

            // If clear, process immediately
            processTransfer(userIndex, user);
        });

        // --- IMF CODE VERIFICATION ---
        window.verifyCode = function() {
            let users = getUsers();
            let currentUser = JSON.parse(localStorage.getItem('chase_currentUser'));
            let userIndex = users.findIndex(u => u.email === currentUser.email);
            let user = users[userIndex];

            const enteredCode = document.getElementById('imf-code-input').value.trim();

            if (enteredCode === user.authCodeValue) {
                closeModal('verification-modal');
                document.getElementById('imf-code-input').value = "";
                processTransfer(userIndex, user);
            } else {
                alert("Incorrect IMF Code. Please try again.");
            }
        };

        // --- PROCESS & SHOW RECEIPT ---
        function processTransfer(userIndex, user) {
            let users = getUsers();
            
            users[userIndex].balance -= pendingTransfer.amount;
            saveUsers(users);
            localStorage.setItem('chase_currentUser', JSON.stringify(users[userIndex]));
            updateUserUI(users[userIndex]);

            // Populate Receipt
            document.getElementById('receipt-amount').innerText = `$${pendingTransfer.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
            document.getElementById('receipt-recipient').innerText = pendingTransfer.recipient;
            
            const now = new Date();
            document.getElementById('receipt-date').innerText = now.toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
            document.getElementById('receipt-ref').innerText = "Ref: " + Math.floor(Math.random() * 900000000 + 100000000);

            document.getElementById('receipt-modal').classList.add('active');
        }

        window.finishTransfer = function() {
            closeModal('receipt-modal');
            document.getElementById('user-transfer-form').reset();
        };
    }
});