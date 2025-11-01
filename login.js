// ============================================
// CRM ASTRO - LOGIN DEBUG V2 (COM FIX DE SESSÃO)
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// FUNÇÃO PARA MOSTRAR MENSAGENS NA TELA
// ============================================
function showDebugMessage(message, type = 'info', duration = 5000) {
  let debugContainer = document.getElementById('debug-container');
  
  if (!debugContainer) {
    debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.95);
      border: 3px solid #00AEEF;
      border-radius: 12px;
      padding: 20px;
      z-index: 999999;
      max-width: 500px;
      box-shadow: 0 10px 50px rgba(0, 174, 239, 0.5);
    `;
    document.body.appendChild(debugContainer);
  }

  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-family: monospace;
    word-wrap: break-word;
    background: ${type === 'error' ? '#F44336' : type === 'success' ? '#4CAF50' : '#00AEEF'};
  `;
  
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  messageDiv.innerHTML = `<strong>[${timestamp}]</strong><br>${message}`;
  
  debugContainer.appendChild(messageDiv);
  debugContainer.scrollTop = debugContainer.scrollHeight;

  console.log(`[${timestamp}] ${message}`);
}

// ============================================
// FORÇAR LOGOUT AO ENTRAR NA PÁGINA
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  showDebugMessage('🔐 PASSO 1: Página de login carregada', 'info');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  showDebugMessage('🧹 PASSO 2: Limpando sessionStorage...', 'info');
  sessionStorage.clear();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  showDebugMessage('🧹 PASSO 3: Limpando localStorage...', 'info');
  localStorage.clear();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    showDebugMessage('🧹 PASSO 4: Fazendo logout no Supabase...', 'info');
    await supabase.auth.signOut();
    showDebugMessage('✅ PASSO 5: Todas as sessões limpas!', 'success');
  } catch (error) {
    showDebugMessage('❌ ERRO no logout: ' + error.message, 'error');
  }

  await new Promise(resolve => setTimeout(resolve, 1000));
  
  showDebugMessage('⚙️ PASSO 6: Configurando botão de login...', 'info');
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
    showDebugMessage('✅ PASSO 7: Botão configurado!', 'success');
  } else {
    showDebugMessage('❌ ERRO: Botão não encontrado!', 'error');
  }
}

// ============================================
// FAZER LOGIN COM GOOGLE
// ============================================
async function signInWithGoogle() {
  try {
    showDebugMessage('🚀 PASSO 8: Iniciando login...', 'info');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

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
      showDebugMessage('❌ ERRO: ' + error.message, 'error', 10000);
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
      }
      return;
    }

    showDebugMessage('🌐 PASSO 9: Redirecionando para Google...', 'success', 10000);
  } catch (error) {
    showDebugMessage('❌ ERRO: ' + error.message, 'error', 10000);
    
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
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');

  if (accessToken) {
    showDebugMessage('🔄 PASSO 10: RETORNO DO GOOGLE!', 'success', 10000);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      showDebugMessage('💾 PASSO 11: Salvando tokens...', 'info');
      
      // SALVAR TOKENS NO SESSIONSTORAGE
      sessionStorage.setItem('supabase_access_token', accessToken);
      if (refreshToken) {
        sessionStorage.setItem('supabase_refresh_token', refreshToken);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      showDebugMessage('📡 PASSO 12: Setando sessão no Supabase...', 'info');
      
      // SETAR A SESSÃO NO SUPABASE
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (sessionError) {
        showDebugMessage('❌ ERRO ao setar sessão: ' + sessionError.message, 'error', 10000);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return;
      }

      showDebugMessage('✅ PASSO 13: Sessão setada! Email: ' + sessionData.session.user.email, 'success');

      await new Promise(resolve => setTimeout(resolve, 2000));

      showDebugMessage('🔍 PASSO 14: Buscando usuário no banco...', 'info');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', sessionData.session.user.email)
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (userError || !userData) {
        showDebugMessage('❌ ERRO: Usuário não encontrado!', 'error', 10000);
        showDebugMessage('Email: ' + sessionData.session.user.email, 'error', 10000);
        await new Promise(resolve => setTimeout(resolve, 5000));
        await supabase.auth.signOut();
        return;
      }

      showDebugMessage('✅ PASSO 15: Usuário: ' + userData.full_name, 'success');
      showDebugMessage('✅ Role: ' + userData.role, 'success');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // SALVAR DADOS DO USUÁRIO
      showDebugMessage('💾 PASSO 16: Salvando dados do usuário...', 'info');
      sessionStorage.setItem('currentUserData', JSON.stringify(userData));
      sessionStorage.setItem('cameFromLogin', 'true');

      await new Promise(resolve => setTimeout(resolve, 2000));

      showDebugMessage('🚀 PASSO 17: Redirecionando...', 'success', 5000);

      await new Promise(resolve => setTimeout(resolve, 3000));

      window.location.href = 'index.html';
    } catch (error) {
      showDebugMessage('❌ ERRO: ' + error.message, 'error', 10000);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
});
