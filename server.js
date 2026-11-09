<script>
    // === ROUTING & VIEW CONTROLS ===
    function handleRoute() {
      const hash = window.location.hash;
      const userPortal = document.getElementById('user-portal');
      const adminPortal = document.getElementById('admin-portal');
      
      // If the URL has #admin, show the Admin Portal
      if (hash === '#admin') {
        userPortal.style.display = 'none';
        adminPortal.style.display = 'block';
        document.body.classList.remove('is-signin', 'is-signup', 'is-dashboard', 'menu-is-open');
      } else {
        // Otherwise, show the Chase User Website
        userPortal.style.display = 'block';
        adminPortal.style.display = 'none';
        document.body.classList.remove('is-signin', 'is-signup', 'is-dashboard');
        
        // Handle User Sign In / Sign Up / Dashboard views
        if (hash === '#signin') document.body.classList.add('is-signin');
        else if (hash === '#signup') document.body.classList.add('is-signup');
        else if (hash === '#dashboard') { document.body.classList.add('is-dashboard'); loadUserDashboard(); }
      }
    }
    
    // Listen for URL changes (like clicking the Sign In button)
    window.addEventListener('hashchange', handleRoute);
    
    window.addEventListener('DOMContentLoaded', () => {
        handleRoute();
        
        // Menu Controls (The 3 lines)
        document.getElementById('open-menu').addEventListener('click', () => document.body.classList.add('menu-is-open'));
        document.getElementById('close-menu').addEventListener('click', () => document.body.classList.remove('menu-is-open'));
        document.getElementById('menu-overlay').addEventListener('click', () => document.body.classList.remove('menu-is-open'));
        document.getElementById('trigger-signin').addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#signin'; });

        // Password Toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                if (input.type === 'password') { input.type = 'text'; this.textContent = 'Hide'; }
                else { input.type = 'password'; this.textContent = 'Show'; }
            });
        });

        // ==========================================
        // USER APP LOGIN
        // ==========================================
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = document.getElementById('login-username').value.trim();
            const p = document.getElementById('login-password').value;
            const err = document.getElementById('login-error');
            const btn = document.getElementById('login-btn');
            btn.textContent = 'Signing in...'; err.style.display = 'none';
            
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p })
                });
                const data = await res.json();
                if (!res.ok) { err.textContent = data.error; err.style.display = 'block'; btn.textContent = 'Sign in'; return; }
                
                // Save the token and user data (so it remembers you)
                sessionStorage.setItem('chase_token', data.token);
                localStorage.setItem('chase_user', JSON.stringify(data.user));
                
                // Redirect to dashboard
                window.location.hash = '#dashboard';
            } catch (error) {
                // Fallback for your master account if Node is asleep
                if (p === 'JonathanroumieJesus100%' || u === 'Jonathan12') {
                    let existing = JSON.parse(localStorage.getItem('chase_user'));
                    if(!existing || existing.username !== 'Jonathan Roumie') {
                        existing = {
                            username: 'Jonathan Roumie', fullName: 'Jonathan Roumie', email:'jonathan@example.com', 
                            accountNum: '785234184606', ccNum: '892145236709', balance: 10000, cardBalance: 0, 
                            status: 'active', enableAuth: false, authCodeValue: '', transactions: [], alerts: []
                        };
                    }
                    localStorage.setItem('chase_user', JSON.stringify(existing));
                    window.location.hash = '#dashboard';
                } else {
                    err.textContent = 'Server unreachable. Check connection.'; err.style.display = 'block'; btn.textContent = 'Sign in';
                }
            }
        });

        // ==========================================
        // USER APP SIGN UP (Registration)
        // ==========================================
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const password = document.getElementById('signup-password').value;
            const email = document.getElementById('signup-email').value;
            const fullName = document.getElementById('signup-fullname').value;
            const btn = document.getElementById('signup-btn');
            btn.textContent = 'Creating...';
            
            try {
                const res = await fetch('/api/auth/signup', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ username, password, email, fullName }) 
                });
                
                const data = await res.json();
                if (!res.ok) { 
                    document.getElementById('signup-error').textContent = data.error; 
                    document.getElementById('signup-error').style.display = 'block'; 
                    btn.textContent = 'Sign up'; 
                    return; 
                }
                
                alert('Account Created! Please sign in.'); 
                window.location.hash = '#signin'; // Takes them to login page
            } catch (error) { 
                alert('Cannot reach server.'); 
                btn.textContent = 'Sign up'; 
            }
        });

        // Sign Out
        document.getElementById('btn-sign-out').addEventListener('click', () => {
            sessionStorage.removeItem('chase_token'); 
            localStorage.removeItem('chase_user'); 
            window.location.hash = '';
        });
        
        // ... (The rest of the dashboard and admin functions continue below) ...