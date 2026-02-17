document.addEventListener('DOMContentLoaded', () => {
    const loginOverlay = document.getElementById('login-overlay');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    if (sessionStorage.getItem('mirame_admin_auth') === 'true') {
        showAdmin();
    } else {
        showLogin();
    }

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === 'mirameindumentaria' && pass === 'Mirame1289') {
            sessionStorage.setItem('mirame_admin_auth', 'true');
            showAdmin();
            loginForm.reset();
            loginError.style.display = 'none';
        } else {
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('mirame_admin_auth');
        showLogin();
    });

    function showAdmin() {
        loginOverlay.style.display = 'none';
        adminApp.style.display = 'block';
        
        window.dispatchEvent(new CustomEvent('adminReady'));
    }

    function showLogin() {
        loginOverlay.style.display = 'flex';
        adminApp.style.display = 'none';
    }
});
