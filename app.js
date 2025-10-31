document.addEventListener('DOMContentLoaded', async function() {

// ===================================
// CONFIGURAÇÃO SUPABASE
// ===================================
const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1OTYyODYsImV4cCI6MjA1MTE3MjI4Nn0.4koCjqf-hbSZcBK_6_BYEmnZMFqkBvZjOdOgdTMYZkE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===================================
// VARIÁVEIS GLOBAIS
// ===================================
let currentUser = null;
let allLeads = [];
let currentFilter = 'all';

// ===================================
// AUTENTICAÇÃO
// ===================================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();

    if (error || !userData) {
        console.error('Erro ao buscar usuário:', error);
        await supabase.auth.signOut();
        window.location.href = 'login.html';
        return;
    }

    currentUser = userData;
    updateUIWithUserData();
    showWelcomeToast();
    await loadLeads();
    await loadRanking();
    await updateFaturamento();
}

function updateUIWithUserData() {
    document.getElementById('userNameDisplay').textContent = currentUser.full_name;
    document.getElementById('userEmailDisplay').textContent = currentUser.email;
    
    if (currentUser.role !== 'ADMIN') {
        document.getElementById('adminPanel').style.display = 'none';
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// ===================================
// TOAST DE BOAS-VINDAS
// ===================================
function showWelcomeToast() {
    const toast = document.getElementById('welcomeToast');
    const userName = document.getElementById('toastUserName');
    userName.textContent = currentUser.full_name;
    toast.classList.add('show');
    
    setTimeout(() => {
        closeToast();
    }, 5000);
}

function closeToast() {
    const toast = document.getElementById('welcomeToast');
    toast.classList.remove('show');
}

// ===================================
// NAVEGAÇÃO ENTRE ABAS
// ===================================
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');

    if (tabName === 'ranking') {
        loadRanking();
    } else if (tabName === 'negocios') {
        updateFaturamento();
    }
}

// ===================================
// GERENCIAMENTO DE LEADS
// ===================================
async function loadLeads() {
    let query = supabase.from('leads').select('*');
    
    if (currentUser.role !== 'ADMIN') {
        query = query.eq('user_id', currentUser.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
        console.error('Erro ao carregar leads:', error);
        return;
    }
    
    allLeads = data || [];
    renderLeads();
    updateStats();
}

function renderLeads() {
    const stages = ['novo', 'contato', 'interessado', 'negociacao', 'fechado', 'perdido'];
    
    stages.forEach(stage => {
        const column = document.getElementById(stage + 'Column');
        const filteredLeads = allLeads.filter(lead => {
            const matchStage = lead.stage === stage;
            const matchFilter = currentFilter === 'all' || lead.user_id === currentUser.id;
            return matchStage && matchFilter;
        });
        
        column.innerHTML = filteredLeads.map(lead => createLeadCard(lead)).join('');
    });
    
    renderLeadsTable();
}

function createLeadCard(lead) {
    const assignedUser = lead.user_id === currentUser.id ? 'Você' : 'Outro usuário';
    
    return `
        <div class="lead-card" draggable="true" data-lead-id="${lead.id}">
            <div class="lead-header">
                <strong>${lead.nome}</strong>
                <span class="lead-user">${assignedUser}</span>
            </div>
            <div class="lead-info">
                <div>📱 ${lead.telefone}</div>
                <div>📷 @${lead.instagram}</div>
            </div>
            ${lead.observacoes ? `<div class="lead-obs">${lead.observacoes}</div>` : ''}
            <div class="lead-actions">
                <button onclick="editLead(${lead.id})" class="btn-edit">✏️</button>
                <button onclick="deleteLead(${lead.id})" class="btn-delete">🗑️</button>
            </div>
        </div>
    `;
}

function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    const filteredLeads = currentFilter === 'all' 
        ? allLeads 
        : allLeads.filter(lead => lead.user_id === currentUser.id);
    
    tbody.innerHTML = filteredLeads.map(lead => `
        <tr>
            <td>${lead.nome}</td>
            <td>${lead.telefone}</td>
            <td>@${lead.instagram}</td>
            <td><span class="stage-badge stage-${lead.stage}">${getStageLabel(lead.stage)}</span></td>
            <td>${new Date(lead.created_at).toLocaleDateString('pt-BR')}</td>
            <td>
                <button onclick="editLead(${lead.id})" class="btn-action">✏️</button>
                <button onclick="deleteLead(${lead.id})" class="btn-action">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function getStageLabel(stage) {
    const labels = {
        'novo': 'Novo',
        'contato': 'Em Contato',
        'interessado': 'Interessado',
        'negociacao': 'Negociação',
        'fechado': 'Fechado',
        'perdido': 'Perdido'
    };
    return labels[stage] || stage;
}

function updateStats() {
    const myLeads = allLeads.filter(lead => lead.user_id === currentUser.id);
    
    document.getElementById('totalLeads').textContent = myLeads.length;
    document.getElementById('leadsNovos').textContent = myLeads.filter(l => l.stage === 'novo').length;
    document.getElementById('leadsContato').textContent = myLeads.filter(l => l.stage === 'contato').length;
    document.getElementById('leadsFechados').textContent = myLeads.filter(l => l.stage === 'fechado').length;
}

function filterLeads(filter) {
    currentFilter = filter;
    renderLeads();
}

// ===================================
// DRAG AND DROP
// ===================================
document.addEventListener('dragstart', function(e) {
    if (e.target.classList.contains('lead-card')) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }
});

document.addEventListener('dragend', function(e) {
    if (e.target.classList.contains('lead-card')) {
        e.target.classList.remove('dragging');
    }
});

document.addEventListener('dragover', function(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    if (column) {
        const dragging = document.querySelector('.dragging');
        if (dragging) {
            column.appendChild(dragging);
        }
    }
});

document.addEventListener('drop', async function(e) {
    e.preventDefault();
    const column = e.target.closest('.kanban-column');
    if (column) {
        const leadCard = document.querySelector('.dragging');
        if (leadCard) {
            const leadId = leadCard.dataset.leadId;
            const newStage = column.id.replace('Column', '');
            
            if (newStage === 'fechado') {
                openCloseModal(leadId);
            } else {
                await updateLeadStage(leadId, newStage);
            }
        }
    }
});

async function updateLeadStage(leadId, newStage) {
    const { error } = await supabase
        .from('leads')
        .update({ stage: newStage })
        .eq('id', leadId);
    
    if (error) {
        console.error('Erro ao atualizar stage:', error);
        alert('Erro ao atualizar lead');
        return;
    }
    
    await loadLeads();
}

// ===================================
// MODAL DE NOVO LEAD
// ===================================
function openNewLeadModal() {
    document.getElementById('leadModalTitle').textContent = 'Novo Lead';
    document.getElementById('leadForm').reset();
    document.getElementById('leadId').value = '';
    document.getElementById('leadModal').style.display = 'flex';
}

function closeLeadModal() {
    document.getElementById('leadModal').style.display = 'none';
}

async function saveLead() {
    const leadId = document.getElementById('leadId').value;
    const leadData = {
        nome: document.getElementById('leadNome').value,
        telefone: document.getElementById('leadTelefone').value,
        instagram: document.getElementById('leadInstagram').value,
        observacoes: document.getElementById('leadObservacoes').value,
        user_id: currentUser.id,
        stage: 'novo'
    };
    
    if (!leadData.nome || !leadData.telefone || !leadData.instagram) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    let error;
    if (leadId) {
        ({ error } = await supabase
            .from('leads')
            .update(leadData)
            .eq('id', leadId));
    } else {
        ({ error } = await supabase
            .from('leads')
            .insert([leadData]));
    }
    
    if (error) {
        console.error('Erro ao salvar lead:', error);
        alert('Erro ao salvar lead');
        return;
    }
    
    closeLeadModal();
    await loadLeads();
}

async function editLead(leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;
    
    document.getElementById('leadModalTitle').textContent = 'Editar Lead';
    document.getElementById('leadId').value = lead.id;
    document.getElementById('leadNome').value = lead.nome;
    document.getElementById('leadTelefone').value = lead.telefone;
    document.getElementById('leadInstagram').value = lead.instagram;
    document.getElementById('leadObservacoes').value = lead.observacoes || '';
    document.getElementById('leadModal').style.display = 'flex';
}

async function deleteLead(leadId) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;
    
    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
    
    if (error) {
        console.error('Erro ao deletar lead:', error);
        alert('Erro ao deletar lead');
        return;
    }
    
    await loadLeads();
}

// ===================================
// MODAL DE FECHAMENTO
// ===================================
function openCloseModal(leadId) {
    document.getElementById('closeLeadId').value = leadId;
    document.getElementById('closeModal').style.display = 'flex';
}

function closeCloseModal() {
    document.getElementById('closeModal').style.display = 'none';
    document.getElementById('closeForm').reset();
}

async function confirmClose() {
    const leadId = document.getElementById('closeLeadId').value;
    const contratoData = {
        stage: 'fechado',
        plano_contas: document.getElementById('planoContas').value,
        plano_posts: document.getElementById('planoPosts').value,
        plano_valor_contrato: document.getElementById('planoValor').value,
        plano_forma_pagamento: document.getElementById('planoFormaPagamento').value,
        plano_observacoes: document.getElementById('planoObservacoes').value,
        data_fechamento: new Date().toISOString()
    };
    
    if (!contratoData.plano_contas || !contratoData.plano_posts || !contratoData.plano_valor_contrato) {
        alert('Preencha todos os campos obrigatórios do contrato');
        return;
    }
    
    const { error } = await supabase
        .from('leads')
        .update(contratoData)
        .eq('id', leadId);
    
    if (error) {
        console.error('Erro ao fechar lead:', error);
        alert('Erro ao fechar lead');
        return;
    }
    
    // Incrementar retornos positivos do usuário
    const { error: userError } = await supabase
        .from('users')
        .update({ retornos_positivos: currentUser.retornos_positivos + 1 })
        .eq('id', currentUser.id);
    
    if (userError) {
        console.error('Erro ao atualizar retornos:', userError);
    }
    
    closeCloseModal();
    await loadLeads();
    await loadRanking();
    await updateFaturamento();
}

// ===================================
// RANKING
// ===================================
async function loadRanking() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('retornos_positivos', { ascending: false });
    
    if (error) {
        console.error('Erro ao carregar ranking:', error);
        return;
    }
    
    const tbody = document.getElementById('rankingTableBody');
    tbody.innerHTML = data.map((user, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        const isCurrentUser = user.id === currentUser.id;
        
        return `
            <tr ${isCurrentUser ? 'class="highlight-row"' : ''}>
                <td>${medal} ${index + 1}º</td>
                <td>${user.full_name}</td>
                <td>${user.retornos_positivos}</td>
                <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
            </tr>
        `;
    }).join('');
}

// ===================================
// FATURAMENTO
// ===================================
async function updateFaturamento() {
    const { data, error } = await supabase
        .from('leads')
        .select('plano_valor_contrato')
        .eq('stage', 'fechado');
    
    if (error) {
        console.error('Erro ao calcular faturamento:', error);
        return;
    }
    
    const total = data.reduce((sum, lead) => {
        const valor = parseFloat(lead.plano_valor_contrato) || 0;
        return sum + valor;
    }, 0);
    
    document.getElementById('faturamentoTotal').textContent = 
        total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    renderNegociosFechados(data);
}

async function renderNegociosFechados() {
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('stage', 'fechado')
        .order('data_fechamento', { ascending: false });
    
    if (error) {
        console.error('Erro ao carregar negócios:', error);
        return;
    }
    
    const tbody = document.getElementById('negociosTableBody');
    tbody.innerHTML = data.map(lead => `
        <tr>
            <td>${lead.nome}</td>
            <td>${lead.plano_contas || '-'}</td>
            <td>${lead.plano_posts || '-'}</td>
            <td>${parseFloat(lead.plano_valor_contrato || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${lead.plano_forma_pagamento || '-'}</td>
            <td>${new Date(lead.data_fechamento).toLocaleDateString('pt-BR')}</td>
        </tr>
    `).join('');
}

// ===================================
// FUNÇÕES GLOBAIS
// ===================================
window.showTab = showTab;
window.logout = logout;
window.closeToast = closeToast;
window.filterLeads = filterLeads;
window.openNewLeadModal = openNewLeadModal;
window.closeLeadModal = closeLeadModal;
window.saveLead = saveLead;
window.editLead = editLead;
window.deleteLead = deleteLead;
window.openCloseModal = openCloseModal;
window.closeCloseModal = closeCloseModal;
window.confirmClose = confirmClose;

// ===================================
// INICIALIZAÇÃO
// ===================================
checkAuth();

}); // Fecha DOMContentLoaded
