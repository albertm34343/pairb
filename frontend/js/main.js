function showMain() {
    hideAll();
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('welcome-text').textContent = `Привет, ${currentUser.name}!`;
    const partnerText = currentUser.partner_username ? `Ваш партнёр: @${currentUser.partner_username}` : '';
    document.getElementById('main-partner').textContent = partnerText;
}

function showInteractive() {
    showToast('Интерактив скоро появится');
}