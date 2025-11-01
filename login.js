// ============================================
// CRM ASTRO - LOGIN v2.0
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// FORÇAR LOGOUT AO ENTRAR NA PÁGINA
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Iniciando página de login...');
  
  // Limpar todas as sessões e storages
  sessionStorage.clear();
  localStorage.clear();
  
  try {
    // Forçar logout no Supabase
    await supabase.auth.signOut();
    console.log('✅ Sessões limpas com sucesso!');
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
  }

  // Configurar botão de login
  setupGoogleLogin();
});

// ============================================
// CONFIGURAR LOGIN COM GOOGLE
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

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/crm-astro/index.html',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
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

    // Marcar que veio do login
    sessionStorage.setItem('cameFromLogin', 'true');

    console.log('✅ Redirecionando para autenticação Google...');
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

// ============================================
// VERIFICAR SE VOLTOU DO OAUTH
// ============================================
window.addEventListener('load', async () => {
  // Verificar se há parâmetros de callback na URL
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');

  if (accessToken) {
    console.log('🔄 Detectado retorno do OAuth...');

    try {
      // Obter sessão
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('❌ Erro ao obter sessão:', sessionError);
        alert('Erro na autenticação. Tente novamente.');
        return;
      }

      console.log('✅ Sessão obtida:', session.user.email);

      // Verificar se usuário existe no banco
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      if (userError || !userData) {
        console.error('❌ Usuário não encontrado no banco:', userError);
        alert('Usuário não autorizado. Entre em contato com o administrador.');
        await supabase.auth.signOut();
        return;
      }

      console.log('✅ Usuário autorizado:', userData.full_name, userData.role);

      // Marcar que veio do login
      sessionStorage.setItem('cameFromLogin', 'true');

      // Redirecionar para dashboard
      console.log('🚀 Redirecionando para dashboard...');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('❌ Erro no callback:', error);
      alert('Erro ao processar autenticação.');
    }
  }
});
