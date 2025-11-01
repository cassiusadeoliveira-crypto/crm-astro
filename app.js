// ============================================
// CRM ASTRO - APP FINAL (FUNCIONANDO)
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let currentUser = null;

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📱 Dashboard carregando...');
  await initializeApp();
});

async function initializeApp() {
  try {
    // Verificar sessão do Supabase
    console.log('🔍 Verificando sessão...');
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.log('❌ Sem sessão válida, redirecionando para login...');
      window.location.href = 'login.html';
      return;
    }

    console.log('✅ Sessão válida! Email:', session.user.email);

    // Buscar dados do usuário no banco
    console.log('🔍 Buscando usuário no banco...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      console.error('❌ Usuário não encontrado:', userError);
      alert('Usuário não autorizado. Entre em contato com o administrador.');
      await supabase.auth.signOut();
      window.location.href = 'login.html';
      return;
    }

    console.log('✅ Usuário encontrado:', userData.full_name, userData.role);
    
    currentUser = userData;

    // Atualizar UI
    updateUserUI();

    console.log('🎉 App inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    alert('Erro ao inicializar o sistema.');
    window.location.href = 'login.html';
  }
}

// ============================================
// ATUALIZAR UI DO USUÁRIO
// ============================================
function updateUserUI() {
  const userNameEl = document.getElementById('userName');
  const userRoleEl = document.getElementById('userRole');
  const userAvatarEl = document.getElementById('userAvatar');

  if (userNameEl) {
    userNameEl.textContent = currentUser.full_name || 'Usuário';
  }

  if (userRoleEl) {
    userRoleEl.textContent = currentUser.role || 'USER';
  }

  if (userAvatarEl && currentUser.avatar_url) {
    userAvatarEl.src = currentUser.avatar_url;
  }
  
  console.log('✅ UI atualizada com nome:', currentUser.full_name);
}

// ============================================
// LOGOUT
// ============================================
async function logout() {
  if (!confirm('Deseja realmente sair?')) return;

  try {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}
