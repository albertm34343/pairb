async function submitOnboarding() {
    const data = {
        username: tg.initDataUnsafe?.user?.username,
        gender: document.getElementById('gender').value,
        relationship_date: document.getElementById('relationship_date').value,
        city: document.getElementById('city').value.trim(),
        personal_hobbies: document.getElementById('personal_hobbies').value.trim(),
        shared_hobbies: document.getElementById('shared_hobbies').value.trim()
    };
    
    if (!data.gender || !data.relationship_date || !data.city) {
        showToast('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch('/api/onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            currentUser = data;
            showMain();
        } else {
            showToast('Ошибка сохранения');
        }
    } catch (e) {
        showToast('Ошибка сети');
    }
}