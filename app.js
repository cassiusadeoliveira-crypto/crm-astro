// ========================================
// CRM ASTRO - VERSÃO OTIMIZADA
// ========================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyb_jzBWZaVGJDjOrwD086qDVu6fxjreoYGvZpyRDVYNzlADyRq-TNq7l3wX2DaGXIX/exec';

// Estado global
let currentUser = null;
let allLeads = [];
let allUsers = [];
let negociosChart = null;

// ========================================
// INICIALIZAÇÃO
// ========================================
document.addEventListener('DOMContentLoaded', async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const userData = JSON.parse(userStr);
        if (!userData || !userData.email) {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        showLoading(true);
        await loadCurrentUser(userData.email);
        await loadUsers();
        await loadLeads();
        initializeTabs();
        initializeDragAndDrop();
        loadRanking();
        loadNovosNegocios();
        showLoading(false);
    } catch (error) {
        console.error('Erro na inicialização:', error);
        localStorage.removeItem('user');
        showError('Erro ao carregar dados. Redirecionando para login...');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
});

// ========================================
// AUTENTICAÇÃO
// ========================================
async function loadCurrentUser(email) {
    try {
        const response = await fetch(`${API_URL}?action=getUser&email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        if (data.success && data.user) {
            currentUser = data.user;
            updateUserInfo();
        } else {
            throw new Error('Usuário não encontrado');
        }
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
        logout();
    }
}

function updateUserInfo() {
    document.getElementById('userName').textContent = currentUser.full_name;
    document.getElementById('userRole').textContent = currentUser.role;
    
    const googlePhotoUrl = localStorage.getItem('userPhoto');
    if (googlePhotoUrl) {
        document.getElementById('userAvatar').src = googlePhotoUrl;
    } else {
        document.getElementById('userAvatar').src = currentUser.avatar_url || 'https://via.placeholder.com/40';
    }
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('userPhoto');
    window.location.href = 'login.html';
}

// ========================================
// CARREGAR DADOS
// ========================================
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}?action=getUsers`);
        const data = await response.json();
        
        if (data.success) {
            allUsers = data.users;
            populateOwnerSelects();
            populateFilterUsuarios();
            populateFilterColaborador();
        }
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function loadLeads() {
    try {
        const response = await fetch(`${API_URL}?action=getLeads`);
        const data = await response.json();
        
        if (data.success) {
            allLeads = data.leads;
            renderKanban();
            renderLeadsTable();
        }
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        showError('Erro ao carregar leads');
    }
}

// ========================================
// KANBAN
// ========================================
function renderKanban() {
    const stages = ['novo', 'em_contato', 'interessado', 'negociacao', 'fechado', 'perdido'];
    
    stages.forEach(stage => {
        const column = document.querySelector(`.kanban-column[data-stage="${stage}"]`);
        const cardsContainer = column.querySelector('.column-cards');
        const countElement = column.querySelector('.count');
        
        const stageLeads = allLeads.filter(lead => lead.stage === stage);
        countElement.textContent = stageLeads.length;
        cardsContainer.innerHTML = '';
        
        stageLeads.forEach(lead => {
            const card = createLeadCard(lead);
            cardsContainer.appendChild(card);
        });
    });
}

function createLeadCard(lead) {
    const card = document.createElement('div');
    card.className = 'lead-card';
    card.draggable = true;
    card.dataset.leadId = lead.id;
    
    const owner = allUsers.find(u => u.id === lead.owner_id);
    const ownerName = owner ? owner.full_name.split(' ')[0] : 'Sem responsável';
    
    // Extrair username do Instagram (remover @)
    const instagramUsername = lead.instagram ? lead.instagram.replace('@', '') : '';
    
    card.innerHTML = `
        <div class="card-header">
            <h4>${lead.name}</h4>
            <div class="card-actions">
                <button onclick="editLead('${lead.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${currentUser.role === 'ADMIN' ? `
                    <button onclick="deleteLead('${lead.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="card-body">
            ${lead.instagram ? `
                <p class="instagram-link-wrapper">
                    <i class="fab fa-instagram"></i> 
                    <a href="https://instagram.com/${instagramUsername}" 
                       target="_blank" 
                       class="instagram-link"
                       data-username="${instagramUsername}">
                        ${lead.instagram}
                    </a>
                </p>
            ` : ''}
            ${lead.whatsapp ? `<p><i class="fab fa-whatsapp"></i> ${lead.whatsapp}</p>` : ''}
            ${lead.email ? `<p><i class="fas fa-envelope"></i> ${lead.email}</p>` : ''}
            ${lead.observations ? `<p class="observations">${lead.observations}</p>` : ''}
        </div>
        <div class="card-footer">
            <span class="owner"><i class="fas fa-user"></i> ${ownerName}</span>
        </div>
    `;
    
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragend', handleDragEnd);
    
    return card;
}

// ========================================
// DRAG AND DROP - OTIMIZADO
// ========================================
let draggedCard = null;

function initializeDragAndDrop() {
    const columns = document.querySelectorAll('.column-cards');
    
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('drop', handleDrop);
        column.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedCard = e.target;
    e.target.style.opacity = '0.5';
}

function handleDragEnd(e) {
    e.target.style.opacity = '1';
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const column = e.currentTarget.closest('.kanban-column');
    const newStage = column.dataset.stage;
    const leadId = draggedCard.dataset.leadId;
    const lead = allLeads.find(l => l.id === leadId);
    
    if (currentUser.role === 'USER' && lead.owner_id !== currentUser.id) {
        showError('Você só pode mover seus próprios leads');
        return;
    }
    
    if (newStage === 'fechado' && lead.stage !== 'fechado') {
        openFechamentoModal(leadId);
        return;
    }
    
    // ATUALIZAÇÃO OTIMISTA - Atualiza interface ANTES da API responder
    const oldStage = lead.stage;
    lead.stage = newStage;
    renderKanban();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateLeadStage',
                leadId: leadId,
                stage: newStage
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Se falhar, reverte
            lead.stage = oldStage;
            renderKanban();
            showError(data.message || 'Erro ao atualizar lead');
        }
    } catch (error) {
        // Se falhar, reverte
        lead.stage = oldStage;
        renderKanban();
        console.error('Erro ao atualizar estágio:', error);
        showError('Erro ao atualizar lead');
    }
}

// ========================================
// MODAL DE LEAD - OTIMIZADO
// ========================================
function openLeadModal(leadId = null) {
    const modal = document.getElementById('leadModal');
    const form = document.getElementById('leadForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    
    if (leadId) {
        const lead = allLeads.find(l => l.id === leadId);
        if (lead) {
            title.textContent = 'Editar Lead';
            document.getElementById('leadId').value = lead.id;
            document.getElementById('leadName').value = lead.name;
            document.getElementById('leadInstagram').value = lead.instagram || '';
            document.getElementById('leadWhatsapp').value = lead.whatsapp || '';
            document.getElementById('leadEmail').value = lead.email || '';
            document.getElementById('leadObservations').value = lead.observations || '';
            document.getElementById('leadStage').value = lead.stage;
            document.getElementById('leadOwner').value = lead.owner_id;
        }
    } else {
        title.textContent = 'Novo Lead';
        document.getElementById('leadOwner').value = currentUser.id;
    }
    
    modal.style.display = 'flex';
}

function closeLeadModal() {
    document.getElementById('leadModal').style.display = 'none';
}

async function saveLead(e) {
    e.preventDefault();
    
    const leadId = document.getElementById('leadId').value;
    const leadData = {
        action: leadId ? 'updateLead' : 'createLead',
        name: document.getElementById('leadName').value,
        instagram: document.getElementById('leadInstagram').value,
        whatsapp: document.getElementById('leadWhatsapp').value,
        email: document.getElementById('leadEmail').value,
        observations: document.getElementById('leadObservations').value,
        stage: document.getElementById('leadStage').value,
        owner_id: document.getElementById('leadOwner').value
    };
    
    if (leadId) {
        leadData.leadId = leadId;
    }
    
    // ATUALIZAÇÃO OTIMISTA
    closeLeadModal();
    
    if (!leadId) {
        // Criar lead temporário na interface
        const tempLead = {
            id: 'temp_' + Date.now(),
            ...leadData,
            created_at: new Date().toISOString().split('T')[0]
        };
        allLeads.push(tempLead);
        renderKanban();
        renderLeadsTable();
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(leadData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Recarregar dados reais da API
            await loadLeads();
            showSuccess(leadId ? 'Lead atualizado!' : 'Lead criado!');
        } else {
            // Reverter se falhar
            if (!leadId) {
                allLeads = allLeads.filter(l => !l.id.toString().startsWith('temp_'));
                renderKanban();
                renderLeadsTable();
            }
            showError(data.message || 'Erro ao salvar lead');
        }
    } catch (error) {
        // Reverter se falhar
        if (!leadId) {
            allLeads = allLeads.filter(l => !l.id.toString().startsWith('temp_'));
            renderKanban();
            renderLeadsTable();
        }
        console.error('Erro ao salvar lead:', error);
        showError('Erro ao salvar lead');
    }
}

function editLead(leadId) {
    openLeadModal(leadId);
}

async function deleteLead(leadId) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) {
        return;
    }
    
    // ATUALIZAÇÃO OTIMISTA
    const leadIndex = allLeads.findIndex(l => l.id === leadId);
    const deletedLead = allLeads[leadIndex];
    allLeads.splice(leadIndex, 1);
    renderKanban();
    renderLeadsTable();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'deleteLead',
                leadId: leadId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Lead excluído!');
        } else {
            // Reverter se falhar
            allLeads.splice(leadIndex, 0, deletedLead);
            renderKanban();
            renderLeadsTable();
            showError(data.message || 'Erro ao excluir lead');
        }
    } catch (error) {
        // Reverter se falhar
        allLeads.splice(leadIndex, 0, deletedLead);
        renderKanban();
        renderLeadsTable();
        console.error('Erro ao excluir lead:', error);
        showError('Erro ao excluir lead');
    }
}

// ========================================
// MODAL DE FECHAMENTO - NOVOS CAMPOS
// ========================================
function openFechamentoModal(leadId) {
    const modal = document.getElementById('fechamentoModal');
    document.getElementById('fechamentoLeadId').value = leadId;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dataFechamento').value = today;
    
    modal.style.display = 'flex';
}

function closeFechamentoModal() {
    document.getElementById('fechamentoModal').style.display = 'none';
}

function updateVencimentoText() {
    const vencimentoInput = document.getElementById('vencimentoDia');
    const vencimentoText = document.getElementById('vencimentoText');
    const dia = parseInt(vencimentoInput.value);
    
    if (dia >= 1 && dia <= 31) {
        vencimentoText.textContent = `Todo dia ${dia}`;
        vencimentoText.style.display = 'block';
    } else {
        vencimentoText.style.display = 'none';
    }
}

async function saveFechamento(e) {
    e.preventDefault();
    
    const leadId = document.getElementById('fechamentoLeadId').value;
    const contas = document.getElementById('numContas').value;
    const publicacoes = document.getElementById('numPublicacoes').value;
    const valorContrato = document.getElementById('valorContrato').value;
    const dataFechamento = document.getElementById('dataFechamento').value;
    const vencimentoDia = document.getElementById('vencimentoDia').value;
    
    closeFechamentoModal();
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({
                action: 'saveFechamento',
                leadId: leadId,
                contas: contas,
                publicacoes: publicacoes,
                valor_contrato: valorContrato,
                data_fechamento: dataFechamento,
                vencimento_dia: vencimentoDia
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadLeads();
            loadRanking();
            loadNovosNegocios();
            showSuccess('Fechamento registrado! 🎉');
        } else {
            showError(data.message || 'Erro ao registrar fechamento');
        }
    } catch (error) {
        console.error('Erro ao salvar fechamento:', error);
        showError('Erro ao salvar fechamento');
    }
}

// ========================================
// RANKING - APENAS USERS
// ========================================
async function loadRanking() {
    try {
        const response = await fetch(`${API_URL}?action=getRanking`);
        const data = await response.json();
        
        if (data.success) {
            const usersOnly = data.ranking.filter(user => user.role === 'USER');
            renderRanking(usersOnly);
        }
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

function renderRanking(ranking) {
    const container = document.querySelector('.ranking-list');
    container.innerHTML = '';
    
    ranking.forEach((user, index) => {
        const card = document.createElement('div');
        card.className = 'ranking-card';
        
        let medal = '';
        if (index === 0) medal = '🥇';
        else if (index === 1) medal = '🥈';
        else if (index === 2) medal = '🥉';
        
        const photoUrl = user.avatar_url || 'https://via.placeholder.com/50';
        
        card.innerHTML = `
            <div class="ranking-position">${medal || (index + 1)}</div>
            <img src="${photoUrl}" alt="${user.full_name}" class="ranking-avatar">
            <div class="ranking-info">
                <h3>${user.full_name}</h3>
                <p>${user.role}</p>
            </div>
            <div class="ranking-score">
                <i class="fas fa-trophy"></i>
                <span>${user.retornos_positivos} retornos positivos</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// NOVOS NEGÓCIOS
// ========================================
async function loadNovosNegocios() {
    const periodo = document.getElementById('filterPeriodo').value;
    const usuario = document.getElementById('filterUsuario').value;
    
    try {
        const response = await fetch(`${API_URL}?action=getNovosNegocios&periodo=${periodo}&usuario=${usuario}`);
        const data = await response.json();
        
        if (data.success) {
            renderNovosNegocios(data.negocios);
        }
    } catch (error) {
        console.error('Erro ao carregar novos negócios:', error);
    }
}

function renderNovosNegocios(negocios) {
    const faturamentoTotal = negocios.reduce((sum, n) => sum + parseFloat(n.valor_contrato || 0), 0);
    const totalFechamentos = negocios.length;
    const ticketMedio = totalFechamentos > 0 ? faturamentoTotal / totalFechamentos : 0;
    
    document.getElementById('faturamentoTotal').textContent = formatCurrency(faturamentoTotal);
    document.getElementById('totalFechamentos').textContent = totalFechamentos;
    document.getElementById('ticketMedio').textContent = formatCurrency(ticketMedio);
    
    const tbody = document.getElementById('negociosTableBody');
    tbody.innerHTML = '';
    
    negocios.forEach(negocio => {
        const owner = allUsers.find(u => u.id === negocio.owner_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(negocio.data_fechamento)}</td>
            <td>${negocio.name}</td>
            <td>${owner ? owner.full_name : '-'}</td>
            <td>${formatCurrency(negocio.valor_contrato)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    renderNegociosChart(negocios);
}

function renderNegociosChart(negocios) {
    const ctx = document.getElementById('negociosChart').getContext('2d');
    
    const grouped = {};
    negocios.forEach(n => {
        const date = n.data_fechamento;
        if (!grouped[date]) grouped[date] = 0;
        grouped[date] += parseFloat(n.valor_contrato || 0);
    });
    
    const labels = Object.keys(grouped).sort();
    const values = labels.map(l => grouped[l]);
    
    if (negociosChart) {
        negociosChart.destroy();
    }
    
    negociosChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.map(formatDate),
            datasets: [{
                label: 'Faturamento',
                data: values,
                borderColor: '#00AEEF',
                backgroundColor: 'rgba(0, 174, 239, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// ========================================
// TABELA DE LEADS - COM FILTROS
// ========================================
function renderLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    tbody.innerHTML = '';
    
    // Aplicar filtros
    const periodo = document.getElementById('filterPeriodoLeads')?.value || 'todos';
    const colaborador = document.getElementById('filterColaborador')?.value || 'todos';
    
    let filteredLeads = [...allLeads];
    
    // Filtro de período
    if (periodo !== 'todos') {
        const hoje = new Date();
        filteredLeads = filteredLeads.filter(lead => {
            if (!lead.created_at) return false;
            const dataLead = new Date(lead.created_at);
            const diffDays = Math.floor((hoje - dataLead) / (1000 * 60 * 60 * 24));
            
            if (periodo === 'dia' && diffDays > 1) return false;
            if (periodo === 'semana' && diffDays > 7) return false;
            if (periodo === 'mes' && diffDays > 30) return false;
            return true;
        });
    }
    
    // Filtro de colaborador
    if (colaborador !== 'todos') {
        filteredLeads = filteredLeads.filter(lead => lead.owner_id === parseInt(colaborador));
    }
    
    filteredLeads.forEach(lead => {
        const owner = allUsers.find(u => u.id === lead.owner_id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${lead.name}</td>
            <td>${lead.instagram || '—'}</td>
            <td>${lead.whatsapp || '—'}</td>
            <td>${lead.email || '—'}</td>
            <td><span class="badge badge-${lead.stage}">${getStageLabel(lead.stage)}</span></td>
            <td>${owner ? owner.full_name : '—'}</td>
            <td>${formatDate(lead.created_at)}</td>
            <td>
                <button onclick="editLead('${lead.id}')" class="btn-icon" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                ${currentUser.role === 'ADMIN' ? `
                    <button onclick="deleteLead('${lead.id}')" class="btn-icon" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ========================================
// TABS
// ========================================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        });
    });
}

// ========================================
// HELPERS
// ========================================
function populateOwnerSelects() {
    const select = document.getElementById('leadOwner');
    select.innerHTML = '';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.full_name;
        select.appendChild(option);
    });
}

function populateFilterUsuarios() {
    const select = document.getElementById('filterUsuario');
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.full_name;
        select.appendChild(option);
    });
}

function populateFilterColaborador() {
    const select = document.getElementById('filterColaborador');
    if (!select) return;
    
    select.innerHTML = '<option value="todos">Todos os Colaboradores</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.full_name;
        select.appendChild(option);
    });
}

function getStageLabel(stage) {
    const labels = {
        'novo': 'Novo',
        'em_contato': 'Em Contato',
        'interessado': 'Interessado',
        'negociacao': 'Negociação',
        'fechado': 'Fechado',
        'perdido': 'Perdido'
    };
    return labels[stage] || stage;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

function showLoading(show) {
    // Implementar loading visual se necessário
}

function showSuccess(message) {
    // Toast notification otimizado
    const toast = document.createElement('div');
    toast.className = 'toast toast-success';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function showError(message) {
    const toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
