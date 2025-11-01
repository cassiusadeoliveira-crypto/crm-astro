const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Login page loaded');
  
  sessionStorage.clear();
  localStorage.clear();
  
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Erro ao limpar:', error);
  }

  setupGoogleLogin();
});

function setupGoogleLogin() {
  const loginBtn = document.getElementById('loginBtn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', signInWithGoogle);
  }
}

async function signInWithGoogle() {
  try {
    console.log('Iniciando login...');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://cassiusadeoliveira-crypto.github.io/crm-astro/index.html'
      }
    });

    if (error) {
      console.error('Erro:', error);
      alert('Erro ao fazer login: ' + error.message);
      
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
      }
    }
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro inesperado');
  }
}
