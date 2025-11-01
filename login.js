// ============================================
// CRM ASTRO - LOGIN DEBUG VERSION
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// FUNÇÃO PARA MOSTRAR MENSAGENS NA TELA
// ============================================
function showDebugMessage(message, type = 'info', duration = 5000) {
  // Criar ou pegar o container de debug
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
    showDebugMessage('✅ PASSO 5: Todas as sessões limpas com sucesso!', 'success');
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
    showDebugMessage('✅ PASSO 7: Botão de login configurado!', 'success');
  } else {
    showDebugMessage('❌ ERRO: Botão de login não encontrado!', 'error');
  }
}

// ============================================
// FAZER LOGIN COM GOOGLE
// ============================================
async function signInWithGoogle() {
  try {
    showDebugMessage('🚀 PASSO 8: Iniciando login com Google...', 'info');

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    showDebugMessage('🔗 PASSO 9: Configurando OAuth...', 'info');
    
    const redirectUrl = window.location.origin + '/crm-astro/index.html';
    showDebugMessage('🔗 Redirect URL: ' + redirectUrl, 'info');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      showDebugMessage('❌ ERRO no login: ' + error.message, 'error', 10000);
      
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fab fa-google"></i> Entrar com Google';
      }
      return;
    }

    // Marcar que veio do login
    showDebugMessage('✅ PASSO 10: Marcando flag cameFromLogin...', 'success');
    sessionStorage.setItem('cameFromLogin', 'true');
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    showDebugMessage('🌐 PASSO 11: Redirecionando para Google OAuth...', 'success', 10000);
  } catch (error) {
    showDebugMessage('❌ ERRO INESPERADO: ' + error.message, 'error', 10000);
    
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
    showDebugMessage('🔄 PASSO 12: DETECTADO RETORNO DO GOOGLE OAUTH!', 'success', 10000);

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      showDebugMessage('📡 PASSO 13: Obtendo sessão do Supabase...', 'info');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (sessionError || !session) {
        showDebugMessage('❌ ERRO ao obter sessão: ' + (sessionError?.message || 'Sessão não encontrada'), 'error', 10000);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return;
      }

      showDebugMessage('✅ PASSO 14: Sessão obtida! Email: ' + session.user.email, 'success');

      await new Promise(resolve => setTimeout(resolve, 2000));

      showDebugMessage('🔍 PASSO 15: Buscando usuário no banco de dados...', 'info');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (userError || !userData) {
        showDebugMessage('❌ ERRO: Usuário não encontrado no banco de dados!', 'error', 10000);
        showDebugMessage('Email procurado: ' + session.user.email, 'error', 10000);
        showDebugMessage('Erro: ' + (userError?.message || 'Usuário não existe'), 'error', 10000);
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        await supabase.auth.signOut();
        return;
      }

      showDebugMessage('✅ PASSO 16: Usuário encontrado! Nome: ' + userData.full_name, 'success');
      showDebugMessage('✅ Role: ' + userData.role, 'success');

      await new Promise(resolve => setTimeout(resolve, 2000));

      showDebugMessage('🏷️ PASSO 17: Marcando flag cameFromLogin = true', 'info');
      sessionStorage.setItem('cameFromLogin', 'true');

      await new Promise(resolve => setTimeout(resolve, 2000));

      showDebugMessage('🚀 PASSO 18: REDIRECIONANDO PARA DASHBOARD...', 'success', 5000);
      showDebugMessage('⏰ Aguarde 3 segundos...', 'info', 3000);

      await new Promise(resolve => setTimeout(resolve, 3000));

      window.location.href = 'index.html';
    } catch (error) {
      showDebugMessage('❌ ERRO NO CALLBACK: ' + error.message, 'error', 10000);
      showDebugMessage('Stack: ' + error.stack, 'error', 10000);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
});
