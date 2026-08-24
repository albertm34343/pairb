const tg = window.Telegram.WebApp;
tg.expand();

let currentUser = null;
let pairCheckInterval = null;
let confirmCallback = null;

async function loadScreens() {
    const screens = {
        'splash-screen': 'screens/splash.html',
        'no-pair-screen': 'screens/no-pair.html',
        'onboarding-screen': 'screens/onboarding.html',
        'main-screen': 'screens/main.html',
        'interactive-screen': 'screens/interactive.html',
        'settings-screen': 'screens/settings.html',
        'edit-profile-screen': 'screens/edit-profile.html',
        'payment-screen': 'screens/payment.html'
    };
    
    for (const [id, file] of Object.entries(screens)) {
        try {
            const response = await fetch(file);
            const html = await response.text();
            document.getElementById(id).innerHTML = html;
        } catch (e) {
            console.error('Ошибка загрузки ' + file, e);
        }
    }
    
    initSplash();
}

function initSplash() {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.transition = 'opacity 0.6s ease';
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 600);
        }
    }, 2000);
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    toast.style.pointerEvents = 'none';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

function showConfirm(message, callback) {
    document.getElementById('confirm-text').textContent = message;
    document.getElementById('confirm-overlay').style.display = 'flex';
    confirmCallback = callback;
}

function confirmAction(result) {
    document.getElementById('confirm-overlay').style.display = 'none';
    if (confirmCallback) confirmCallback(result);
    confirmCallback = null;
}

function hideAll() {
    document.querySelectorAll('.screen').forEach(c => c.style.display = 'none');
}

function showScreen(id) {
    hideAll();
    document.getElementById(id).style.display = 'block';
}

function showNoPair() {
    showScreen('no-pair-screen');
    if (pairCheckInterval) clearInterval(pairCheckInterval);
}

function startPairCheck() {
    if (pairCheckInterval) clearInterval(pairCheckInterval);
    pairCheckInterval = setInterval(async () => {
        const username = tg.initDataUnsafe?.user?.username;
        if (!username) return;
        try {
            const response = await fetch(`/api/check_onboarding/${username}`);
            const data = await response.json();
            if (!data.exists || !data.pair_id) {
                showNoPair();
            }
        } catch (e) {
            // ignore
        }
    }, 3000);
}

async function checkOnboarding() {
    const username = tg.initDataUnsafe?.user?.username;
    
    if (!username) {
        showToast('Установите username в Telegram');
        return;
    }
    
    try {
        const response = await fetch(`/api/check_onboarding/${username}`);
        const data = await response.json();
        
        if (!data.exists || !data.pair_id) {
            showNoPair();
        } else if (data.onboarding_done) {
            currentUser = data;
            showMain();
            startPairCheck();
        } else {
            showOnboarding(data);
            startPairCheck();
        }
    } catch (e) {
        showToast('Ошибка загрузки');
    }
}

function showOnboarding(data) {
    showScreen('onboarding-screen');
    const partnerText = data.partner_username ? `Ваш партнёр: @${data.partner_username}` : '';
    document.getElementById('onboarding-partner').textContent = partnerText;
}

async function init() {
    await loadScreens();
    setTimeout(() => {
        checkOnboarding();
    }, 2000);
}

init();