// ============================================
// CRM ASTRO - DEBUG CONSOLE (SEM CAIXA PRETA)
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let currentUser = null;

// ============================================
// FUNÇÃO DEBUG (SÓ NO CONSOLE)
// ============================================
function debugLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : '📍';
  console.log(`${emoji} [${timestamp}] ${message}`);
}

// ============================================
// INICIALIZAÇÃO COM DEBUG
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  debugLog('=== DASHBOARD INICIANDO ===', 'info');
  debugLog('URL atual: ' + window.location.href, 'info');
  
  // Aguardar um pouco para garantir que tudo carregou
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    await initializeApp();
  } catch (error) {
    debugLog('ERRO FATAL na inicialização: ' + error.message, 'error');
    debugLog('Stack: ' + error.stack, 'error');
    
    // Aguardar antes de redirecionar para vermos o erro
    await new Promise(resolve => setTimeout(resolve, 5000));
    window.location.href = 'login.html';
  }
});

async function initializeApp() {
  debugLog('🚀 Iniciando verificações...', 'info');
  
  // STEP 1: Verificar se o Supabase está funcionando
  try {
    debugLog('📡 Testando conexão com Supabase...', 'info');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      debugLog('ERRO na conexão Supabase: ' + error.message, 'error');
      throw error;
    }
    
    debugLog('✅ Supabase conectado! Total de usuários: ' + (data?.count || 'desconhecido'), 'success');
  } catch (connError) {
    debugLog('❌ FALHA na conexão com Supabase: ' + connError.message, 'error');
    throw connError;
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // STEP 2: Verificar sessão
  debugLog('🔍 Verificando sessão do Supabase...', 'info');
  
  let session;
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      debugLog('ERRO ao obter sessão: ' + sessionError.message, 'error');
      debugLog('Código do erro: ' + sessionError.code, 'error');
      throw sessionError;
    }
    
    session = sessionData?.session;
    
    if (!session) {
      debugLog('❌ NENHUMA SESSÃO encontrada!', 'error');
      debugLog('Redirecionando para login em 3 segundos...', 'error');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      window.location.href = 'login.html';
      return;
    }
    
    debugLog('✅ Sessão encontrada!', 'success');
    debugLog('User ID: ' + session.user.id, 'info');
    debugLog('Email: ' + session.user.email, 'info');
    debugLog('Sessão expira em: ' + new Date(session.expires_at * 1000).toLocaleString('pt-BR'), 'info');
    
  } catch (sessionError) {
    debugLog('ERRO FATAL na verificação de sessão: ' + sessionError.message, 'error');
    throw sessionError;
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // STEP 3: Buscar usuário no banco
  debugLog('🔍 Buscando usuário na tabela users...', 'info');
  debugLog('Procurando por email: ' + session.user.email, 'info');
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError) {
      debugLog('ERRO ao buscar usuário: ' + userError.message, 'error');
      debugLog('Código do erro: ' + userError.code, 'error');
      
      if (userError.code === 'PGRST116') {
        debugLog('❌ USUÁRIO NÃO ENCONTRADO no banco!', 'error');
        debugLog('Email procurado: ' + session.user.email, 'error');
        
        // Listar todos os emails para debug
        try {
          const { data: allUsers } = await supabase.from('users').select('email, full_name');
          debugLog('Usuários existentes no banco:', 'info');
          allUsers?.forEach(user => {
            debugLog('- ' + user.email + ' (' + user.full_name + ')', 'info');
          });
        } catch (e) {
          debugLog('Erro ao listar usuários: ' + e.message, 'error');
        }
        
        alert('❌ Usuário não autorizado!\n\nSeu email: ' + session.user.email + '\n\nEste email não está cadastrado no sistema.\nEntre em contato com o administrador.');
        
        await supabase.auth.signOut();
        await new Promise(resolve => setTimeout(resolve, 3000));
        window.location.href = 'login.html';
        return;
      }
      
      throw userError;
    }

    if (!userData) {
      debugLog('❌ Dados do usuário vazios!', 'error');
      throw new Error('Usuário não retornou dados');
    }

    debugLog('✅ Usuário encontrado no banco!', 'success');
    debugLog('Nome: ' + userData.full_name, 'info');
    debugLog('Role: ' + userData.role, 'info');
    debugLog('ID: ' + userData.id, 'info');
    debugLog('Retornos positivos: ' + (userData.retornos_positivos || 0), 'info');
    
    currentUser = userData;
    
  } catch (userError) {
    debugLog('ERRO FATAL na busca do usuário: ' + userError.message, 'error');
    throw userError;
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // STEP 4: Atualizar UI
  debugLog('🎨 Atualizando interface do usuário...', 'info');
  
  try {
    updateUserUI();
    debugLog('✅ Interface atualizada!', 'success');
  } catch (uiError) {
    debugLog('ERRO ao atualizar UI: ' + uiError.message, 'error');
    // UI error não é fatal, continua
  }
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // STEP 5: Sucesso completo
  debugLog('🎉 INICIALIZAÇÃO COMPLETA!', 'success');
  debugLog('Sistema funcionando normalmente!', 'success');
  debugLog('=== DEBUG FINALIZADO ===', 'success');
  
  // Aguardar um pouco para garantir estabilidade
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  debugLog('✅ Sistema estável. Dashboard deve estar funcionando!', 'success');
}

// ============================================
// ATUALIZAR UI DO USUÁRIO
// ============================================
function updateUserUI() {
  debugLog('Procurando elementos da UI...', 'info');
  
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  const userAvatarEl = document.getElementById('userAvatar');

  if (userNameEl) {
    const oldName = userNameEl.textContent;
    userNameEl.textContent = currentUser.full_name || 'Usuário';
    debugLog('Nome atualizado: "' + oldName + '" → "' + userNameEl.textContent + '"', 'success');
  } else {
    debugLog('❌ Elemento userName não encontrado!', 'error');
  }

  if (userRoleEl) {
    const oldRole = userRoleEl.textContent;
    userRoleEl.textContent = currentUser.role || 'USER';
    debugLog('Role atualizado: "' + oldRole + '" → "' + userRoleEl.textContent + '"', 'success');
  } else {
    debugLog('❌ Elemento userRole não encontrado!', 'error');
  }

  if (userAvatarEl && currentUser.avatar_url) {
    userAvatarEl.src = currentUser.avatar_url;
    debugLog('Avatar atualizado: ' + currentUser.avatar_url, 'success');
  } else if (!userAvatarEl) {
    debugLog('❌ Elemento userAvatar não encontrado!', 'error');
  }
  
  debugLog('✅ UI atualizada com dados de: ' + currentUser.full_name, 'success');
}

// ============================================
// LOGOUT
// ============================================
async function logout() {
  if (!confirm('Deseja realmente sair?')) return;

  try {
    debugLog('🚪 Fazendo logout...', 'info');
    await supabase.auth.signOut();
    debugLog('✅ Logout realizado!', 'success');
    window.location.href = 'login.html';
  } catch (error) {
    debugLog('ERRO no logout: ' + error.message, 'error');
    // Força o redirecionamento mesmo com erro
    window.location.href = 'login.html';
  }
}

// ============================================
// MONITORAR ERROS GLOBAIS
// ============================================
window.addEventListener('error', function(event) {
  debugLog('ERRO GLOBAL capturado: ' + event.error.message, 'error');
  debugLog('Arquivo: ' + event.filename + ':' + event.lineno, 'error');
});

window.addEventListener('unhandledrejection', function(event) {
  debugLog('PROMISE rejeitada: ' + event.reason, 'error');
});
