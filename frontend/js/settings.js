async function showSettings() {
    hideAll();
    document.getElementById('settings-screen').style.display = 'block';
    
    const username = tg.initDataUnsafe?.user?.username;
    
    try {
        const response = await fetch(`/api/check_onboarding/${username}`);
        const data = await response.json();
        
        currentUser = data;
        const partnerText = data.partner_username ? `Ваш партнёр: @${data.partner_username}` : '';
        document.getElementById('settings-partner').textContent = partnerText;
    } catch (e) {
        showToast('Ошибка загрузки настроек');
    }
}

async function showEditProfile() {
    hideAll();
    document.getElementById('edit-profile-screen').style.display = 'block';
    
    const username = tg.initDataUnsafe?.user?.username;
    
    try {
        const response = await fetch(`/api/get_profile/${username}`);
        const data = await response.json();
        
        document.getElementById('edit-gender').value = data.gender || 'male';
        document.getElementById('edit-relationship_date').value = data.relationship_date || '';
        document.getElementById('edit-city').value = data.city || '';
        document.getElementById('edit-personal_hobbies').value = data.personal_hobbies || '';
        document.getElementById('edit-shared_hobbies').value = data.shared_hobbies || '';
    } catch (e) {
        showToast('Ошибка загрузки профиля');
    }
}

async function saveEditProfile() {
    const data = {
        username: tg.initDataUnsafe?.user?.username,
        gender: document.getElementById('edit-gender').value,
        relationship_date: document.getElementById('edit-relationship_date').value,
        city: document.getElementById('edit-city').value.trim(),
        personal_hobbies: document.getElementById('edit-personal_hobbies').value.trim(),
        shared_hobbies: document.getElementById('edit-shared_hobbies').value.trim()
    };
    
    if (!data.gender || !data.relationship_date || !data.city) {
        showToast('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch('/api/update_profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast('Данные обновлены!');
            showSettings();
        } else {
            showToast('Ошибка сохранения');
        }
    } catch (e) {
        showToast('Ошибка сети');
    }
}

function showPayment() {
    showScreen('payment-screen');
}

async function breakPair() {
    showConfirm('Вы уверены, что хотите разорвать пару?', async (result) => {
        if (!result) return;
        
        const username = tg.initDataUnsafe?.user?.username;
        
        try {
            const response = await fetch(`/api/break_pair/${username}`, {
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