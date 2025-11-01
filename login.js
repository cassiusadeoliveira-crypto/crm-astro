// Configuração Supabase
const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1OTYyODYsImV4cCI6MjA1MTE3MjI4Nn0.4koCjqf-hbSZcBK_6_BYEmnZMFqkBvZjOdOgdTMYZkE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Verificar se já está logado
async function checkExistingSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }
}

// Login com Google
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/crm-astro/index.html'
        }
    });
    
    if (error) {
        alert('Erro ao fazer login: ' + error.message);
    }
});

// Verificar sessão ao carregar
checkExistingSession();
