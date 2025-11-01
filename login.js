// ============================================
// CRM ASTRO - LOGIN FINAL (FUNCIONANDO)
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// LIMPAR SESSÕES AO CARREGAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Limpando sessões antigas...');
  
  sessionStorage.clear();
  localStorage.clear();
  
  try {
    await supabase.auth.signOut();
    console.log('✅ Sessões limpas!');
  } catch (error) {
    console.error('Erro ao limpar:', error);
  }

  setupGoogleLogin();
});

// ============================================
// CONFIGURAR BOTÃO DE LOGIN
// ============================================
function setupGoogleLogin() {
  const loginBtn = document.getElementById('loginBtn');
  
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      await signInWithGoogle();
    });
  }
}

// ============================================
// FAZER LOGIN COM GOOGLE
// ============================================
async function signInWithGoogle() {
  try {
    console.log('🚀 Iniciando login com Google...');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/crm-astro/',
      }
    });

    if (error) {
      console.error('❌ Erro no login:', error);
      alert('Erro ao fazer login: ' + error.message);
      
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
      }
      return;
    }

    console.log('✅ Redirecionando para Google...');
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    alert('Erro inesperado ao fazer login.');
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
    }
  }
}
