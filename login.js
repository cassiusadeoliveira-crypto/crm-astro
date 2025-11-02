// ========================================
// CRM ASTRO - LOGIN (GOOGLE APPS SCRIPT)
// ========================================

const API_URL = 'https://script.google.com/macros/s/AKfycbwm8ZzpyZVwNqb6U2rir3AyePsXnD31w5YfigwTGqxo8k84Juq_Hb5if-0nYoXoucmW/exec';

// Verificar se já está logado
if (localStorage.getItem('userEmail')) {
    window.location.href = 'index.html';
}

// ========================================
// LOGIN SIMPLIFICADO
// ========================================
async function googleLogin() {
    const email = prompt('Digite seu email autorizado:');
    
    if (!email) return;
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_URL}?action=getUser&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.success && data.user) {
            localStorage.setItem('userEmail', email);
            window.location.href = 'index.html';
        } else {
            showError('❌ Usuário não autorizado. Somente membros da equipe podem acessar.');
        }
    } catch (error) {
        console.error('Erro ao validar usuário:', error);
        showError('Erro ao conectar com o servidor. Verifique sua conexão.');
    } finally {
        showLoading(false);
    }
}

// ========================================
// HELPERS
// ========================================
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}
