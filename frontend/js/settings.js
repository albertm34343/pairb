async function showSettings() {
    hideAll();
    document.getElementById('settings-screen').style.display = 'block';
    
    const telegram_id = tg.initDataUnsafe?.user?.id;
    
    try {
        const response = await fetch(`/api/check_onboarding/${telegram_id}`);
        const data = await response.json();
        
        currentUser = data;
        const partnerText = data.partner_username ? `Ваш партнёр: @${data.partner_username}` : '';
        document.getElementById('settings-partner').textContent = partnerText;
    } catch (e) {
        showToast('Ошибка загрузки настроек');
    }
}

function showEditProfile() {
    showToast('Редактирование скоро будет доступно');
}

function showPayment() {
    showToast('Оплата скоро появится');
}

async function breakPair() {
    showConfirm('Вы уверены, что хотите разорвать пару?', async (result) => {
        if (!result) return;
        
        const telegram_id = tg.initDataUnsafe?.user?.id;
        
        try {
            const response = await fetch(`/api/break_pair/${telegram_id}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                showToast('Пара разорвана');
                setTimeout(() => tg.close(), 1000);
            } else {
                showToast('Ошибка');
            }
        } catch (e) {
            showToast('Ошибка сети');
        }
    });
}