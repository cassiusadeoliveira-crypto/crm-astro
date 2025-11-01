// ============================================
// CRM ASTRO - VERSÃO SIMPLES E SEGURA
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let currentUser = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Dashboard carregando...');
  
  try {
    // Verificar sessão
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('Sem sessão, redirecionando...');
      window.location.href = 'login.html';
      return;
    }

    console.log('Sessão OK:', session.user.email);

    // Buscar usuário
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (!userData) {
      console.log('Usuário não encontrado');
      alert('Usuário não autorizado');
      await supabase.auth.signOut();
      window.location.href = 'login.html';
      return;
    }

    console.log('Usuário OK:', userData.full_name);
    currentUser = userData;

    // Atualizar UI
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    
    if (userNameEl) userNameEl.textContent = userData.full_name || 'Usuário';
    if (userRoleEl) userRoleEl.textContent = userData.role || 'USER';

    console.log('Sistema pronto!');

  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao carregar: ' + error.message);
  }
});

// Logout
async function logout() {
  if (!confirm('Deseja sair?')) return;
  
  try {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Erro logout:', error);
    window.location.href = 'login.html';
  }
}
