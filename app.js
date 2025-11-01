// ============================================
// CRM ASTRO - APP DEBUG V3 (SEM FLAG, USA TOKENS)
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================
// FUNÇÃO PARA MOSTRAR MENSAGENS NA TELA
// ============================================
function showDebugMessage(message, type = 'info', duration = 3000) {
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
      max-height: 80vh;
      overflow-y: auto;
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
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  showDebugMessage('📱 DASHBOARD: Carregado', 'info');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // VERIFICAR SE TEM CALLBACK DO OAUTH NA URL
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  
  if (accessToken) {
    showDebugMessage('🔄 RETORNO DO GOOGLE OAUTH!', 'success');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // PROCESSAR CALLBACK DO OAUTH
    await processOAuthCallback(accessToken, refreshToken);
    return;
  }
  
  // NÃO É CALLBACK, VERIFICAR SE TEM TOKENS SALVOS
  showDebugMessage('🔍 Verificando tokens salvos...', 'info');
  
  const savedAccessToken = sessionStorage.getItem('supabase_access_token');
  const savedUserData = sessionStorage.getItem('currentUserData');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (!savedAccessToken && !savedUserData) {
    showDebugMessage('❌ SEM TOKENS SALVOS!', 'error', 5000);
    showDebugMessage('Você precisa fazer login primeiro', 'error', 5000);
    showDebugMessage('Redirecionando em 3s...', 'error', 3000);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    window.location.href = 'login.html';
    return;
  }
  
  showDebugMessage('✅ Tokens encontrados!', 'success');
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  await initializeApp();
});

// ============================================
// PROCESSAR CALLBACK DO OAUTH
// ============================================
async function processOAuthCallback(accessToken, refreshToken) {
  try {
    showDebugMessage('💾 Salvando tokens...', 'info');
    
    sessionStorage.setItem('supabase_access_token', accessToken);
    if (refreshToken) {
      sessionStorage.setItem('supabase_refresh_token', refreshToken);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    showDebugMessage('📡 Setando sessão...', 'info');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (sessionError || !sessionData?.session) {
      showDebugMessage('❌ Erro ao setar sessão: ' + (sessionError?.message || 'Sessão inválida'), 'error', 10000);
      await new Promise(resolve => setTimeout(resolve, 5000));
      window.location.href = 'login.html';
      return;
    }

    showDebugMessage('✅ Sessão setada! Email: ' + sessionData.session.user.email, 'success');

    await new Promise(resolve => setTimeout(resolve, 1000));

    showDebugMessage('🔍 Buscando usuário...', 'info');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', sessionData.session.user.email)
      .single();

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (userError || !userData) {
      showDebugMessage('❌ Usuário não encontrado!', 'error', 10000);
      showDebugMessage('Email: ' + sessionData.session.user.email, 'error', 10000);
      await new Promise(resolve => setTimeout(resolve, 5000));
      window.location.href = 'login.html';
      return;
    }

    showDebugMessage('✅ Usuário: ' + userData.full_name, 'success');
    showDebugMessage('✅ Role: ' + userData.role, 'success');

    await new Promise(resolve => setTimeout(resolve, 1000));

    showDebugMessage('💾 Salvando dados...', 'info');
    sessionStorage.setItem('currentUserData', JSON.stringify(userData));

    await new Promise(resolve => setTimeout(resolve, 1000));

    showDebugMessage('🔄 Limpando URL...', 'info');
    
    // LIMPAR HASH DA URL E RECARREGAR
    window.location.hash = '';
    window.location.reload();
    
  } catch (error) {
    showDebugMessage('❌ ERRO: ' + error.message, 'error', 10000);
    await new Promise(resolve => setTimeout(resolve, 5000));
    window.location.href = 'login.html';
  }
}

// ============================================
// INICIALIZAR APP COM TOKENS SALVOS
// ============================================
async function initializeApp() {
  try {
    showDebugMessage('🚀 Iniciando app...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // TENTAR RESTAURAR SESSÃO
    const savedAccessToken = sessionStorage.getItem('supabase_access_token');
    const savedRefreshToken = sessionStorage.getItem('supabase_refresh_token');
    
    if (savedAccessToken) {
      showDebugMessage('🔄 Restaurando sessão...', 'info');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await supabase.auth.setSession({
          access_token: savedAccessToken,
          refresh_token: savedRefreshToken
        });
        
        showDebugMessage('✅ Sessão restaurada!', 'success');
      } catch (e) {
        showDebugMessage('⚠️ Erro ao restaurar: ' + e.message, 'error');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // USAR DADOS SALVOS
    showDebugMessage('📂 Carregando dados salvos...', 'info');
    
    const savedUserData = sessionStorage.getItem('currentUserData');
    
    if (!savedUserData) {
      showDebugMessage('❌ Dados não encontrados!', 'error', 5000);
      await new Promise(resolve => setTimeout(resolve, 3000));
      window.location.href = 'login.html';
      return;
    }
    
    const userData = JSON.parse(savedUserData);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showDebugMessage('✅ Dados carregados!', 'success');
    showDebugMessage('👤 Nome: ' + userData.full_name, 'success');
    showDebugMessage('🎭 Role: ' + userData.role, 'success');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    showDebugMessage('🎉 INICIALIZAÇÃO COMPLETA!', 'success', 5000);
    showDebugMessage('Sistema funcionando!', 'success', 5000);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Remover debug após 3 segundos
    const debugContainer = document.getElementById('debug-container');
    if (debugContainer) {
      debugContainer.style.opacity = '0';
      debugContainer.style.transition = 'opacity 1s';
      setTimeout(() => debugContainer.remove(), 1000);
    }

  } catch (error) {
    showDebugMessage('❌ ERRO FATAL: ' + error.message, 'error', 10000);
    showDebugMessage('Stack: ' + error.stack, 'error', 10000);
  }
}
