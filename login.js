// Configuração da API - URL ATUALIZADA
const API_URL = 'https://script.google.com/macros/s/AKfycbyb_jzBWZaVGJDjOrwD086qDVu6fxjreoYGvZpyRDVYNzlADyRq-TNq7l3wX2DaGXIX/exec';

// Elementos do DOM
const googleLoginBtn = document.getElementById('googleLoginBtn');
const loadingIndicator = document.getElementById('loadingIndicator');

// Função para mostrar loading
function showLoading() {
    googleLoginBtn.style.display = 'none';
    loadingIndicator.style.display = 'block';
}

// Função para esconder loading
function hideLoading() {
    googleLoginBtn.style.display = 'flex';
    loadingIndicator.style.display = 'none';
}

// Função para fazer login com Google
async function loginWithGoogle() {
    const email = prompt('Digite seu email cadastrado:');
    
    if (!email) {
        alert('Email é obrigatório!');
        return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor, digite um email válido!');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}?action=login&email=${encodeURIComponent(email)}`);
        const data = await response.json();

        if (data.success) {
            // Salvar dados do usuário no localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirecionar para a página principal
            window.location.href = 'index.html';
        } else {
            hideLoading();
            alert(data.message || 'Email não autorizado. Entre em contato com o administrador.');
        }
    } catch (error) {
        hideLoading();
        console.error('Erro ao fazer login:', error);
        alert('Erro ao conectar com o servidor. Tente novamente.');
    }
}

// Event listener para o botão de login
googleLoginBtn.addEventListener('click', loginWithGoogle);

// Verificar se já está logado
window.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = 'index.html';
    }
});

// Permitir login com Enter no prompt
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement === googleLoginBtn) {
        loginWithGoogle();
    }
});
