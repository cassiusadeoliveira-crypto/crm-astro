// ============================================
// CRM ASTRO - APLICAÇÃO PRINCIPAL
// ============================================

// Configuração do Supabase
const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjEyODcsImV4cCI6MjA3NzMzNzI4N30.1t5Sj1i2BvLXVS6n7WvmR46KhCEYg7MZJvfma25F0QA';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis globais
let currentUser = null;
let allLeads = [];
let allUsers = [];

// Status permitidos por role
const ALLOWED_STATUSES = {
    ADMIN: ['Novo', 'Em Contato', 'Interessado', 'Negociando', 'Fechado', 'Perdido'],
    USER: ['Novo', 'Em Contato', 'Interessado']
};

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    setupEventListeners();
});

// ============================================
// AUTENTICAÇÃO
// ============================================
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        // Buscar dados do usuário no banco
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

        if (userError || !userData) {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        currentUser = userData;
        updateUserInterface();
        await loadInitialData();

    } catch (error) {
        console.error('Erro na autenticação:', error);
        window.location.href = 'login.html';
    }
}

async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        showNotification('Erro ao sair', 'error');
    }
}

// ============================================
// INTERFACE DO USUÁRIO
// ============================================
function updateUserInterface() {
    document.getElementById('userName').textContent = currentUser.full_name;

    // Mostrar/ocultar elementos para admins
    if (currentUser.role === 'ADMIN') {
        document.getElementById('novosNegociosTab').style.display = 'block';
    }

    // Restringir opções de status para colaboradores
    if (currentUser.role === 'USER') {
        const adminOnlyOptions = document.querySelectorAll('.admin-only');
        adminOnlyOptions.forEach(option => {
            option.style.display = 'none';
        });
    }
}

// ============================================
// CARREGAR DADOS INICIAIS
// ============================================
async function loadInitialData() {
    try {
        // Carregar usuários
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('full_name');

        if (usersError) throw usersError;
        allUsers = users;

        // Preencher select de responsáveis
        const responsavelSelect = document.getElementById('leadResponsavel');
        responsavelSelect.innerHTML = '<option value="">Selecione...</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.full_name;
            responsavelSelect.appendChild(option);
        });

        // Carregar leads
        await loadLeads();

    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showNotification('Erro ao carregar dados', 'error');
    }
}

// ============================================
// LEADS
// ============================================
async function loadLeads() {
    try {
        const { data: leads, error } = await supabase
            .from('leads')
            .select(`
                *,
                user:user_id (
                    id,
                    full_name,
                    email
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allLeads = leads || [];
        renderKanbanBoard();
        renderRetornos();
        renderRanking();
        
        if (currentUser.role === 'ADMIN') {
            renderNovosNegocios();
        }

    } catch (error) {
        console.error('Erro ao carregar leads:', error);
        showNotification('Erro ao carregar leads', 'error');
    }
}

// ============================================
// KANBAN BOARD
// ============================================
function renderKanbanBoard() {
    const kanbanBoard = document.getElementById('kanbanBoard');
    const statuses = currentUser.role === 'ADMIN' 
        ? ['Novo', 'Em Contato', 'Interessado', 'Negociando', 'Fechado', 'Perdido']
        : ['Novo', 'Em Contato', 'Interessado'];

    kanbanBoard.innerHTML = '';

    statuses.forEach(status => {
        const column = createKanbanColumn(status);
        kanbanBoard.appendChild(column);
    });

    setupDragAndDrop();
}

function createKanbanColumn(status) {
    const leads = allLeads.filter(lead => lead.status === status);
    
    const column = document.createElement('div');
    column.className = 'kanban-column';
    column.dataset.status = status;

    column.innerHTML = `
        <div class="column-header">
            <div class="column-title">${status}</div>
            <div class="column-count">${leads.length}</div>
        </div>
        <div class="leads-container" data-status="${status}">
            ${leads.map(lead => createLeadCard(lead)).join('')}
        </div>
    `;

    return column;
}

function createLeadCard(lead) {
    const responsavel = lead.user ? lead.user.full_name : 'Sem responsável';
    const temperatura = lead.temperatura ? `
        <div class="lead-temperatura temperatura-${lead.temperatura.toLowerCase()}">
            ${lead.temperatura}
        </div>
    ` : '';

    const instagramUsername = lead.instagram.replace('@', '');
    const instagramUrl = `https://instagram.com/${instagramUsername}`;

    return `
        <div class="lead-card" draggable="true" data-id="${lead.id}" ondblclick="openEditLeadModal('${lead.id}')">
            <div class="lead-instagram">
                <a href="${instagramUrl}" target="_blank" title="Abrir perfil no Instagram">
                    <i class="fab fa-instagram"></i>
                    ${lead.instagram}
                </a>
            </div>
            ${lead.whatsapp ? `<div class="lead-info"><i class="fab fa-whatsapp"></i> ${lead.whatsapp}</div>` : ''}
            <div class="lead-info"><i class="fas fa-user"></i> ${responsavel}</div>
            ${lead.data_retorno ? `<div class="lead-info"><i class="fas fa-calendar"></i> ${formatDate(lead.data_retorno)}</div>` : ''}
            ${temperatura}
        </div>
    `;
}

// ============================================
// DRAG AND DROP
// ============================================
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.lead-card');
    const containers = document.querySelectorAll('.leads-container');

    cards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    containers.forEach(container => {
        container.addEventListener('dragover', handleDragOver);
        container.addEventListener('drop', handleDrop);
    });
}

let draggedCard = null;

function handleDragStart(e) {
    draggedCard = e.target;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

async function handleDrop(e) {
    e.preventDefault();
    
    if (!draggedCard) return;

    const newStatus = e.currentTarget.dataset.status;
    const leadId = draggedCard.dataset.id;
    const lead = allLeads.find(l => l.id === leadId);

    if (!lead) return;

    // Verificar permissões
    if (!canMoveToStatus(newStatus)) {
        showNotification('Você não tem permissão para mover para este estágio', 'error');
        return;
    }

    // Se for mover para "Fechado", abrir modal de contrato
    if (newStatus === 'Fechado' && currentUser.role === 'ADMIN') {
        document.getElementById('contractLeadId').value = leadId;
        // Preencher data de fechamento automaticamente
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('planoDataFechamento').value = today;
        document.getElementById('contractModal').classList.add('active');
        return;
    }

    // Atualizar status
    await updateLeadStatus(leadId, newStatus);
}

function canMoveToStatus(status) {
    const allowedStatuses = ALLOWED_STATUSES[currentUser.role];
    return allowedStatuses.includes(status);
}

async function updateLeadStatus(leadId, newStatus) {
    try {
        const { error } = await supabase
            .from('leads')
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;

        // Registrar auditoria
        await logAudit(leadId, 'status_change', { new_status: newStatus });

        showNotification('Status atualizado com sucesso!', 'success');
        await loadLeads();

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showNotification('Erro ao atualizar status', 'error');
    }
}

// ============================================
// MODAL DE LEAD
// ============================================
function openAddLeadModal() {
    document.getElementById('modalTitle').textContent = 'Adicionar Lead';
    document.getElementById('leadForm').reset();
    document.getElementById('leadId').value = '';
    document.getElementById('leadModal').classList.add('active');
}

function openEditLeadModal(leadId) {
    const lead = allLeads.find(l => l.id === leadId);
    if (!lead) return;

    document.getElementById('modalTitle').textContent = 'Editar Lead';
    document.getElementById('leadId').value = lead.id;
    document.getElementById('leadInstagram').value = lead.instagram;
    document.getElementById('leadWhatsapp').value = lead.whatsapp || '';
    document.getElementById('leadStatus').value = lead.status;
    document.getElementById('leadTemperatura').value = lead.temperatura || '';
    document.getElementById('leadResponsavel').value = lead.user_id || '';
    
    if (lead.data_retorno) {
        const date = new Date(lead.data_retorno);
        document.getElementById('leadDataRetorno').value = formatDateTimeLocal(date);
    }

    document.getElementById('leadModal').classList.add('active');
}

function closeLeadModal() {
    document.getElementById('leadModal').classList.remove('active');
}

async function saveLead(e) {
    e.preventDefault();

    const leadId = document.getElementById('leadId').value;
    const leadData = {
        instagram: document.getElementById('leadInstagram').value,
        whatsapp: document.getElementById('leadWhatsapp').value || null,
        status: document.getElementById('leadStatus').value,
        temperatura: document.getElementById('leadTemperatura').value || null,
        user_id: document.getElementById('leadResponsavel').value || null,
        data_retorno: document.getElementById('leadDataRetorno').value || null,
        updated_at: new Date().toISOString()
    };

    try {
        if (leadId) {
            // Atualizar lead existente
            const { error } = await supabase
                .from('leads')
                .update(leadData)
                .eq('id', leadId);

            if (error) throw error;

            await logAudit(leadId, 'lead_updated', leadData);
            showNotification('Lead atualizado com sucesso!', 'success');

        } else {
            // Criar novo lead
            leadData.created_at = new Date().toISOString();
            
            const { data, error } = await supabase
                .from('leads')
                .insert([leadData])
                .select();

            if (error) throw error;

            await logAudit(data[0].id, 'lead_created', leadData);
            showNotification('Lead criado com sucesso!', 'success');
        }

        closeLeadModal();
        await loadLeads();

    } catch (error) {
        console.error('Erro ao salvar lead:', error);
        showNotification('Erro ao salvar lead', 'error');
    }
}

// ============================================
// MODAL DE CONTRATO
// ============================================
function closeContractModal() {
    document.getElementById('contractModal').classList.remove('active');
}

async function saveContract(e) {
    e.preventDefault();

    const leadId = document.getElementById('contractLeadId').value;
    const contractData = {
        status: 'Fechado',
        plano_contas: parseInt(document.getElementById('planoContas').value),
        plano_posts: parseInt(document.getElementById('planoPosts').value),
        plano_valor_contrato: parseFloat(document.getElementById('planoValorContrato').value),
        plano_forma_pagamento: document.getElementById('planoFormaPagamento').value,
        plano_observacoes: document.getElementById('planoObservacoes').value,
        data_fechamento: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from('leads')
            .update(contractData)
            .eq('id', leadId);

        if (error) throw error;

        await logAudit(leadId, 'contract_closed', contractData);
        
        // Fechar modal
        closeContractModal();
        
        // Recarregar dados (isso atualizará o faturamento automaticamente)
        await loadLeads();
        
        // Mensagem de sucesso com destaque para o faturamento atualizado
        const valorFormatado = formatCurrency(contractData.plano_valor_contrato);
        showNotification(`🎉 Contrato de ${valorFormatado} fechado! Faturamento atualizado!`, 'success');

    } catch (error) {
        console.error('Erro ao fechar contrato:', error);
        showNotification('Erro ao fechar contrato', 'error');
    }
}

// ============================================
// RETORNOS
// ============================================
function renderRetornos(filter = 'hoje') {
    const retornosList = document.getElementById('retornosList');
    const now = new Date();
    
    let filteredLeads = allLeads.filter(lead => {
        if (!lead.data_retorno) return false;
        
        const retornoDate = new Date(lead.data_retorno);
        
        if (filter === 'hoje') {
            return isSameDay(retornoDate, now);
        } else if (filter === 'semana') {
            return isThisWeek(retornoDate, now);
        } else if (filter === 'mes') {
            return isThisMonth(retornoDate, now);
        }
        
        return false;
    });

    if (filteredLeads.length === 0) {
        retornosList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum retorno para o período selecionado.</p>';
        return;
    }

    retornosList.innerHTML = filteredLeads.map(lead => {
        const responsavel = lead.user ? lead.user.full_name : 'Sem responsável';
        const whatsappLink = lead.whatsapp ? `https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}` : '#';
        
        return `
            <div class="retorno-item">
                <div>
                    <div class="retorno-lead">${lead.instagram}</div>
                    <div class="retorno-date"><i class="fas fa-calendar"></i> ${formatDate(lead.data_retorno)} | <i class="fas fa-user"></i> ${responsavel}</div>
                </div>
                <div class="retorno-actions">
                    ${lead.whatsapp ? `<button class="btn-small btn-whatsapp" onclick="window.open('${whatsappLink}', '_blank')"><i class="fab fa-whatsapp"></i> WhatsApp</button>` : ''}
                    <button class="btn-small btn-success" onclick="markRetornoPositivo('${lead.id}')"><i class="fas fa-thumbs-up"></i> Positivo</button>
                    <button class="btn-small btn-concluir" onclick="markRetornoComplete('${lead.id}')">Concluir</button>
                </div>
            </div>
        `;
    }).join('');
}

async function markRetornoPositivo(leadId) {
    try {
        // Encontrar o lead para pegar o user_id
        const lead = allLeads.find(l => l.id === leadId);
        if (!lead || !lead.user_id) {
            showNotification('Erro: lead não encontrado', 'error');
            return;
        }

        // Incrementar retornos_positivos do usuário
        const currentUser = allUsers.find(u => u.id === lead.user_id);
        const newCount = (currentUser?.retornos_positivos || 0) + 1;
        
        const { error: userError } = await supabase
            .from('users')
            .update({
                retornos_positivos: newCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', lead.user_id);

        if (userError) throw userError;

        // Marcar retorno como concluído
        const { error: leadError } = await supabase
            .from('leads')
            .update({
                data_retorno: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (leadError) throw leadError;

        await logAudit(leadId, 'retorno_positivo', { user_id: lead.user_id });
        showNotification('Retorno positivo registrado! +1 ponto no ranking 🎆', 'success');
        
        // Recarregar dados
        await loadUsers();
        await loadLeads();

    } catch (error) {
        console.error('Erro ao registrar retorno positivo:', error);
        showNotification('Erro ao registrar retorno positivo', 'error');
    }
}

async function markRetornoComplete(leadId) {
    try {
        const { error } = await supabase
            .from('leads')
            .update({ 
                data_retorno: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', leadId);

        if (error) throw error;

        await logAudit(leadId, 'retorno_completed');
        showNotification('Retorno concluído!', 'success');
        await loadLeads();

    } catch (error) {
        console.error('Erro ao concluir retorno:', error);
        showNotification('Erro ao concluir retorno', 'error');
    }
}

// ============================================
// RANKING
// ============================================
function renderRanking() {
    const rankingList = document.getElementById('rankingList');
    
    // Calcular retornos positivos por usuário
    const userStats = {};
    
    allUsers.forEach(user => {
        userStats[user.id] = {
            name: user.full_name,
            retornos_positivos: user.retornos_positivos || 0,
            total_leads: 0,
            fechados: 0
        };
    });

    allLeads.forEach(lead => {
        if (!lead.user_id || !userStats[lead.user_id]) return;
        
        const stats = userStats[lead.user_id];
        stats.total_leads++;
        
        if (lead.status === 'Fechado') {
            stats.fechados++;
        }
    });

    // Ordenar por retornos positivos
    const ranking = Object.values(userStats)
        .sort((a, b) => b.retornos_positivos - a.retornos_positivos);

    if (ranking.length === 0) {
        rankingList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum dado disponível.</p>';
        return;
    }

    rankingList.innerHTML = ranking.map((user, index) => {
        const position = index + 1;
        let positionClass = '';
        let medal = '';
        
        if (position === 1) {
            positionClass = 'gold';
            medal = '🥇';
        } else if (position === 2) {
            positionClass = 'silver';
            medal = '🥈';
        } else if (position === 3) {
            positionClass = 'bronze';
            medal = '🥉';
        }

        // Mensagem personalizada por gênero para o 1º lugar
        let genderMessage = '';
        if (position === 1) {
            // Identificar gênero pelo nome (simples´ficado para este exemplo)
            const femaleNames = ['Raphaela', 'Sofia', 'Carolina', 'Karollyne', 'Jessika', 'Juliana'];
            const isFemale = femaleNames.some(name => user.name.includes(name));
            genderMessage = `<div class="ranking-message">${isFemale ? 'Parabéns, guerreira! 🎆' : 'Parabéns, guerreiro! 🎆'}</div>`;
        }

        return `
            <div class="ranking-item">
                <div class="ranking-position ${positionClass}">${medal || position + 'º'}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${user.name}</div>
                    <div class="ranking-stats">
                        <strong>${user.retornos_positivos}</strong> retornos positivos • ${user.fechados} fechados • ${user.total_leads} leads total
                    </div>
                    ${genderMessage}
                </div>
                <div class="ranking-score"><strong>${user.retornos_positivos}</strong></div>
            </div>
        `;
    }).join('');
}



// ============================================
// NOVOS NEGÓCIOS (APENAS ADMINS) - INTERFACE SIMPLIFICADA
// ============================================
function renderNovosNegocios(filter = 'hoje') {
    if (currentUser.role !== 'ADMIN') return;

    const now = new Date();
    
    // Calcular FATURAMENTO TOTAL (todos os contratos fechados)
    const allClosedLeads = allLeads.filter(lead => lead.status === 'Fechado');
    const faturamentoTotal = allClosedLeads.reduce((sum, lead) => {
        return sum + (lead.plano_valor_contrato || lead.plano_valor_mensal || 0);
    }, 0);

    // Filtrar leads fechados no período selecionado
    const closedLeadsPeriodo = allClosedLeads.filter(lead => {
        if (!lead.data_fechamento) return false;
        
        const fechamentoDate = new Date(lead.data_fechamento);
        
        if (filter === 'hoje') {
            return isSameDay(fechamentoDate, now);
        } else if (filter === 'semana') {
            return isThisWeek(fechamentoDate, now);
        } else if (filter === 'mes') {
            return isThisMonth(fechamentoDate, now);
        }
        return false;
    });

    // Filtrar todos os leads do período para cálculo da taxa de conversão
    const allLeadsInPeriod = allLeads.filter(lead => {
        const createdDate = new Date(lead.created_at);
        
        if (filter === 'hoje') {
            return isSameDay(createdDate, now);
        } else if (filter === 'semana') {
            return isThisWeek(createdDate, now);
        } else if (filter === 'mes') {
            return isThisMonth(createdDate, now);
        }
        return false;
    });

    // Calcular KPIs do período
    const faturamentoPeriodo = closedLeadsPeriodo.reduce((sum, lead) => {
        return sum + (lead.plano_valor_contrato || lead.plano_valor_mensal || 0);
    }, 0);
    
    const contratosPeriodo = closedLeadsPeriodo.length;
    const ticketMedioPeriodo = contratosPeriodo > 0 ? faturamentoPeriodo / contratosPeriodo : 0;
    const taxaConversaoPeriodo = allLeadsInPeriod.length > 0 ? (contratosPeriodo / allLeadsInPeriod.length) * 100 : 0;

    // Atualizar FATURAMENTO TOTAL EM DESTAQUE
    document.getElementById('faturamentoDestaque').textContent = formatCurrency(faturamentoTotal);

    // Atualizar KPIs do período
    document.getElementById('faturamentoPeriodo').textContent = formatCurrency(faturamentoPeriodo);
    document.getElementById('contratosPeriodo').textContent = contratosPeriodo;
    document.getElementById('ticketMedioPeriodo').textContent = formatCurrency(ticketMedioPeriodo);
    document.getElementById('taxaConversaoPeriodo').textContent = `${taxaConversaoPeriodo.toFixed(1)}%`;

    // Renderizar lista completa de contratos (todos os fechados)
    renderContratosDetalhados(allClosedLeads);
}

function renderContratosDetalhados(closedLeads) {
    const contratosLista = document.getElementById('contratosLista');
    
    if (closedLeads.length === 0) {
        contratosLista.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">Nenhum contrato foi fechado ainda.</p>';
        return;
    }

    // Ordenar por data de fechamento (mais recente primeiro)
    const sortedLeads = closedLeads.sort((a, b) => new Date(b.data_fechamento) - new Date(a.data_fechamento));

    contratosLista.innerHTML = sortedLeads.map(lead => {
        const responsavel = lead.user ? lead.user.full_name : 'Não informado';
        const valor = lead.plano_valor_contrato || lead.plano_valor_mensal || 0;
        const pagamento = lead.plano_forma_pagamento || 'Não informado';
        const contas = lead.plano_contas || 0;
        const posts = lead.plano_posts || 0;
        const observacoes = lead.plano_observacoes || '';
        
        return `
            <div class="contrato-item">
                <div class="contrato-header">
                    <div class="contrato-cliente">
                        <h4 class="contrato-instagram">📱 ${lead.instagram}</h4>
                        <div class="contrato-vendedor">👤 Responsável: ${responsavel}</div>
                    </div>
                    <div class="contrato-valor-destaque">
                        <div class="contrato-valor">${formatCurrency(valor)}</div>
                        <div class="contrato-data">${formatDate(lead.data_fechamento)}</div>
                    </div>
                </div>
                
                <div class="contrato-detalhes">
                    <div class="detalhe-item">
                        <div class="detalhe-label">Contas</div>
                        <div class="detalhe-valor">${contas}</div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Postagens</div>
                        <div class="detalhe-valor">${posts}</div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Forma de Pagamento</div>
                        <div class="detalhe-valor">${pagamento}</div>
                    </div>
                    <div class="detalhe-item">
                        <div class="detalhe-label">Valor do Contrato</div>
                        <div class="detalhe-valor">${formatCurrency(valor)}</div>
                    </div>
                </div>
                
                ${observacoes ? `
                    <div class="observacoes">
                        <div class="observacoes-label">Observações</div>
                        <div class="observacoes-texto">${observacoes}</div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}



// ============================================
// AUDITORIA
// ============================================
async function logAudit(leadId, action, details = {}) {
    try {
        await supabase
            .from('audit_log')
            .insert([{
                user_id: currentUser.id,
                lead_id: leadId,
                action: action,
                details: details,
                created_at: new Date().toISOString()
            }]);
    } catch (error) {
        console.error('Erro ao registrar auditoria:', error);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchTab(tabName);
        });
    });

    // Adicionar lead
    document.getElementById('addLeadBtn').addEventListener('click', openAddLeadModal);

    // Modal de lead
    document.getElementById('closeModal').addEventListener('click', closeLeadModal);
    document.getElementById('cancelBtn').addEventListener('click', closeLeadModal);
    document.getElementById('leadForm').addEventListener('submit', saveLead);

    // Modal de contrato
    document.getElementById('closeContractModal').addEventListener('click', closeContractModal);
    document.getElementById('cancelContractBtn').addEventListener('click', closeContractModal);
    document.getElementById('contractForm').addEventListener('submit', saveContract);

    // Filtros de retornos
    document.querySelectorAll('#retornos .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#retornos .filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderRetornos(e.target.dataset.filter);
        });
    });

    // Filtros de novos negócios
    document.querySelectorAll('#novos-negocios .filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('#novos-negocios .filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderNovosNegocios(e.target.dataset.filter);
        });
    });

    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function switchTab(tabName) {
    // Atualizar tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Atualizar conteúdo
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
}

// ============================================
// NOTIFICAÇÕES
// ============================================
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    notificationText.textContent = message;
    notification.className = `notification ${type} active`;

    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
}

function isThisWeek(date, now) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return date >= weekStart && date <= weekEnd;
}

function isThisMonth(date, now) {
    return date.getMonth() === now.getMonth() &&
           date.getFullYear() === now.getFullYear();
}
