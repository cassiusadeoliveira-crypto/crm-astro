// ============================================
// CRM ASTRO - APP DEBUG VERSION
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
  showDebugMessage('📱 DASHBOARD: Página carregada', 'info');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // FORÇAR LOGOUT SE NÃO VIER DO LOGIN
  const cameFromLogin = sessionStorage.getItem('cameFromLogin');
  
  showDebugMessage('🔍 Verificando flag cameFromLogin...', 'info');
  showDebugMessage('Valor: ' + (cameFromLogin || 'NULL/VAZIO'), cameFromLogin ? 'success' : 'error');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (!cameFromLogin) {
    showDebugMessage('❌ FLAG NÃO ENCONTRADA!', 'error', 5000);
    showDebugMessage('🔄 Redirecionando para login em 3 segundos...', 'error', 3000);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    sessionStorage.clear();
    localStorage.clear();
    await supabase.auth.signOut();
    window.location.href = 'login.html';
    return;
  }
  
  showDebugMessage('✅ Flag encontrada! Continuando inicialização...', 'success');
  
  await new Promise(resolve => setTimeout(resolve, 1000));

  await initializeApp();
});

async function initializeApp() {
  try {
    showDebugMessage('🚀 Iniciando aplicação...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showDebugMessage('📡 Verificando sessão do Supabase...', 'info');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (sessionError || !session) {
      showDebugMessage('❌ Erro na sessão: ' + (sessionError?.message || 'Sessão não encontrada'), 'error', 5000);
      await new Promise(resolve => setTimeout(resolve, 3000));
      window.location.href = 'login.html';
      return;
    }

    showDebugMessage('✅ Sessão válida! Email: ' + session.user.email, 'success');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showDebugMessage('🔍 Buscando dados do usuário no banco...', 'info');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (userError || !userData) {
      showDebugMessage('❌ Erro ao buscar usuário: ' + (userError?.message || 'Não encontrado'), 'error', 5000);
      await new Promise(resolve => setTimeout(resolve, 3000));
      window.location.href = 'login.html';
      return;
    }

    showDebugMessage('✅ Usuário carregado!', 'success');
    showDebugMessage('Nome: ' + userData.full_name, 'success');
    showDebugMessage('Role: ' + userData.role, 'success');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    showDebugMessage('🎉 INICIALIZAÇÃO COMPLETA!', 'success');
    showDebugMessage('Dashboard deve aparecer agora...', 'success');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Remover container de debug após sucesso
    const debugContainer = document.getElementById('debug-container');
    if (debugContainer) {
      debugContainer.style.opacity = '0';
      debugContainer.style.transition = 'opacity 1s';
      setTimeout(() => debugContainer.remove(), 1000);
    }

    console.log('✅ App inicializado com sucesso!');
  } catch (error) {
    showDebugMessage('❌ ERRO FATAL: ' + error.message, 'error', 10000);
    showDebugMessage('Stack: ' + error.stack, 'error', 10000);
  }
}
