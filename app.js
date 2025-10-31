// ===================================
// CRM ASTRO - Configuração
// ===================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NjEyODcsImV4cCI6MjA3NzMzNzI4N30.1t5Sj1i2BvLXVS6n7WvmR46KhCEYg7MZJvfma25F0QA';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let allLeads = [];
let allUsers = [];

// ===================================
// TOAST DE BOAS-VINDAS
// ===================================

function closeToast() {
    const toast = document.getElementById('welcomeToast');
    if (toast) {
        toast.style.animation = 'fadeOut 0.5s ease-in forwards';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 500);
    }
}

function showWelcomeToast(userName) {
    const toast = document.getElementById('welcomeToast');
    const toastUserName = document.getElementById('toastUserName');
    
    if (toast && toastUserName) {
        toastUserName.textContent = userName;
        toast.style.display = 'block';
        
        // Fechar automaticamente após 5 segundos
        setTimeout(() => {
            closeToast();
        }, 5000);
    }
}

// ===================================
// AUTENTICAÇÃO
// ===================================

async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session) {
            window.location.href = 'login.html';
            return;
        }

        // Buscar usuário no banco
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', session.user.email)
            .single();

        if (userError || !users) {
            alert('Usuário não autorizado. Entre em contato com o administrador.');
            await supabase.auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        currentUser = users;
        
        // Atualizar UI
        document.getElementById('userName').textContent = currentUser.full_name;
        
        // Mostrar toast de boas-vindas
        showWelcomeToast(currentUser.full_name);
        
        // Carregar dados
        await loadUsers();
        await loadLeads();
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        alert('Erro ao verificar autenticação. Tente novamente.');
        window.location.href = 'login.html';
    }
}

async function logout() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
}

// ===================================
// CARREGAR DADOS
// ===================================

async function loadUsers() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('retornos_positivos', { ascending: false });

        if (error) throw error;
        
        allUsers = data || [];
        renderRanking();
        
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
    }
}

async function loadLeads() {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allLeads = data || [];
        renderKanban();
        renderRetornos();
        renderNovosNegocios();
        
    } catch (error) {
        console.error('Erro ao carregar leads:', error);
    }
}

// ===================================
// TABS
// ===================================

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active de todas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        
        // Ativa a selecionada
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    });
});

// ===================================
// KANBAN PIPELINE
// ===================================

const stages = ['Novo', 'Em Contato', 'Interessado', 'Negociação', 'Fechado', 'Perdido'];

function renderKanban() {
    const kanbanBoard = document.getElementById('kanbanBoard');
    kanbanBoard.innerHTML = '';

    stages.forEach(stage => {
        const column = document.createElement('div');
        column.className = 'kanban-column';
        column.dataset.stage = stage;

        const stageLeads = allLeads.filter(lead => lead.stage === stage);

        column.innerHTML = `
            <h3>${stage} (${stageLeads.length})</h3>
            <div class="leads-container">
                ${stageLeads.map(lead => `
                    <div class="lead-card" draggable="true" data-id="${lead.id}">
                        <h4>${lead.nome}</h4>
                        <p>📷 ${lead.instagram}</p>
                        <p>📱 ${lead.whatsapp}</p>
                        ${lead.observacoes ? `<p>📝 ${lead.observacoes}</p>` : ''}
                        <div class="lead-card-actions">
                            <button class="btn-edit" onclick="editLead(${lead.id})">✏️ Editar</button>
                            <button class="btn-delete" onclick="deleteLead(${lead.id})">🗑️ Excluir</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        kanbanBoard.appendChild(column);
    });

    enableDragAndDrop();
}

function enableDragAndDrop() {
    const cards = document.querySelectorAll('.lead-card');
    const columns = document.querySelectorAll('.kanban-column');

    cards.forEach(card => {
        card.addEventListener('dragstart', e => {
            e.dataTransfer.setData('leadId', card.dataset.id);
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });

    columns.forEach(column => {
        column.addEventListener('dragover', e => {
            e.preventDefault();
        });

        column.addEventListener('drop', async e => {
            e.preventDefault();
            const leadId = e.dataTransfer.getData('leadId');
            const newStage = column.dataset.stage;
            
            await updateLeadStage(leadId, newStage);
        });
    });
}

async function updateLeadStage(leadId, newStage) {
    try {
        // Se mover para "Fechado", abrir modal de plano
        if (newStage === 'Fechado') {
            showPlanoModal(leadId);
            return;
        }

        const { error } = await supabase
            .from('leads')
            .update({ stage: newStage })
            .eq('id', leadId);

        if (error) throw error;

        await loadLeads();
        
    } catch (error) {
        console.error('Erro ao atualizar stage:', error);
        alert('Erro ao mover lead. Tente novamente.');
    }
}

// ===================================
// MODAIS
// ===================================

function showAddLeadModal() {
    document.getElementById('addLeadModal').classList.remove('hidden');
    document.getElementById('addLeadForm').reset();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function showPlanoModal(leadId) {
    const modal = document.getElementById('planoModal');
    const form = document.getElementById('planoForm');
    
    form.reset();
    form.querySelector('[name="leadId"]').value = leadId;
    
    // Data de hoje
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('dataFechamento').value = today;
    
    modal.classList.remove('hidden');
}

// ===================================
// CRUD LEADS
// ===================================

document.getElementById('addLeadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const leadData = {
        nome: formData.get('nome'),
        instagram: formData.get('instagram'),
        whatsapp: formData.get('whatsapp'),
        observacoes: formData.get('observacoes'),
        stage: 'Novo',
        user_id: currentUser.id
    };

    try {
        const { error } = await supabase
            .from('leads')
            .insert([leadData]);

        if (error) throw error;

        closeModal('addLeadModal');
        await loadLeads();
        
    } catch (error) {
        console.error('Erro ao adicionar lead:', error);
        alert('Erro ao adicionar lead. Tente novamente.');
    }
});

async function deleteLead(leadId) {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    try {
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadId);

        if (error) throw error;

        await loadLeads();
        
    } catch (error) {
        console.error('Erro ao excluir lead:', error);
        alert('Erro ao excluir lead. Tente novamente.');
    }
}

// ===================================
// PLANO/CONTRATO
// ===================================

document.getElementById('planoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const leadId = formData.get('leadId');
    
    const contractData = {
        stage: 'Fechado',
        plano_contas: parseInt(formData.get('plano_contas')),
        plano_posts: parseInt(formData.get('plano_posts')),
        plano_valor_contrato: parseFloat(formData.get('plano_valor_contrato')),
        plano_forma_pagamento: formData.get('plano_forma_pagamento'),
        plano_observacoes: formData.get('plano_observacoes'),
        data_fechamento: formData.get('data_fechamento')
    };

    try {
        const { error } = await supabase
            .from('leads')
            .update(contractData)
            .eq('id', leadId);

        if (error) throw error;

        closeModal('planoModal');
        await loadLeads();
        alert('Contrato fechado com sucesso! 🎉');
        
    } catch (error) {
        console.error('Erro ao salvar contrato:', error);
        alert('Erro ao salvar contrato. Tente novamente.');
    }
});

// ===================================
// RETORNOS
// ===================================

function renderRetornos() {
    const retornosList = document.getElementById('retornosList');
    const leadsEmContato = allLeads.filter(lead => 
        lead.stage === 'Em Contato' || lead.stage === 'Interessado'
    );

    if (leadsEmContato.length === 0) {
        retornosList.innerHTML = '<p>Nenhum lead aguardando retorno.</p>';
        return;
    }

    retornosList.innerHTML = leadsEmContato.map(lead => `
        <div class="retorno-item">
            <div class="retorno-info">
                <h4>${lead.nome}</h4>
                <p>📷 ${lead.instagram} | 📱 ${lead.whatsapp}</p>
                <p>Status: ${lead.stage}</p>
            </div>
            <div class="retorno-actions">
                <button class="btn-positivo" onclick="markRetornoPositivo(${lead.id})">
                    ✅ Positivo
                </button>
                <button class="btn-negativo" onclick="markRetornoNegativo(${lead.id})">
                    ❌ Negativo
                </button>
            </div>
        </div>
    `).join('');
}

async function markRetornoPositivo(leadId) {
    try {
        // Incrementar retornos_positivos do usuário
        const { error: userError } = await supabase
            .from('users')
            .update({ 
                retornos_positivos: currentUser.retornos_positivos + 1 
            })
            .eq('id', currentUser.id);

        if (userError) throw userError;

        // Atualizar lead para Interessado
        const { error: leadError } = await supabase
            .from('leads')
            .update({ stage: 'Interessado' })
            .eq('id', leadId);

        if (leadError) throw leadError;

        currentUser.retornos_positivos += 1;
        await loadUsers();
        await loadLeads();
        
        alert('Retorno positivo registrado! +1 ponto 🎉');
        
    } catch (error) {
        console.error('Erro ao registrar retorno positivo:', error);
        alert('Erro ao registrar retorno. Tente novamente.');
    }
}

async function markRetornoNegativo(leadId) {
    if (!confirm('Marcar como retorno negativo?')) return;

    try {
        const { error } = await supabase
            .from('leads')
            .update({ stage: 'Perdido' })
            .eq('id', leadId);

        if (error) throw error;

        await loadLeads();
        
    } catch (error) {
        console.error('Erro ao registrar retorno negativo:', error);
        alert('Erro ao registrar retorno. Tente novamente.');
    }
}

// ===================================
// RANKING
// ===================================

function renderRanking() {
    const rankingList = document.getElementById('rankingList');

    if (allUsers.length === 0) {
        rankingList.innerHTML = '<p>Carregando ranking...</p>';
        return;
    }

    rankingList.innerHTML = allUsers.map((user, index) => {
        const position = index + 1;
        let positionClass = '';
        
        if (position === 1) positionClass = 'first';
        else if (position === 2) positionClass = 'second';
        else if (position === 3) positionClass = 'third';

        let message = '';
        if (position === 1) {
            message = user.gender === 'Feminino' 
                ? '👑 Rainha das Vendas!' 
                : '👑 Rei das Vendas!';
        }

        return `
            <div class="ranking-item ${positionClass}">
                <div class="ranking-position">${position}º</div>
                <div class="ranking-info">
                    <h4>${user.full_name} ${message}</h4>
                    <p>${user.role === 'ADMIN' ? '⭐ Administrador' : '👤 Usuário'}</p>
                </div>
                <div class="ranking-score">
                    ${user.retornos_positivos || 0} pontos
                </div>
            </div>
        `;
    }).join('');
}

// ===================================
// NOVOS NEGÓCIOS
// ===================================

function renderNovosNegocios() {
    const negociosList = document.getElementById('negociosList');
    const faturamentoDestaque = document.getElementById('faturamentoDestaque');
    
    const leadsFechados = allLeads.filter(lead => 
        lead.stage === 'Fechado' && lead.plano_valor_contrato
    );

    // Calcular faturamento total
    const faturamentoTotal = leadsFechados.reduce((sum, lead) => 
        sum + (parseFloat(lead.plano_valor_contrato) || 0), 0
    );

    // Atualizar display do faturamento
    faturamentoDestaque.querySelector('.faturamento-valor').textContent = 
        `R$ ${faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    if (leadsFechados.length === 0) {
        negociosList.innerHTML = '<p>Nenhum contrato fechado ainda.</p>';
        return;
    }

    negociosList.innerHTML = leadsFechados.map(lead => `
        <div class="negocio-item">
            <h4>🎉 ${lead.nome}</h4>
            <div class="negocio-details">
                <div class="negocio-detail">
                    <strong>📅 Data:</strong>
                    <span>${new Date(lead.data_fechamento).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="negocio-detail">
                    <strong>📷 Contas:</strong>
                    <span>${lead.plano_contas}</span>
                </div>
                <div class="negocio-detail">
                    <strong>📝 Posts/mês:</strong>
                    <span>${lead.plano_posts}</span>
                </div>
                <div class="negocio-detail">
                    <strong>💰 Valor:</strong>
                    <span>R$ ${parseFloat(lead.plano_valor_contrato).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div class="negocio-detail">
                    <strong>💳 Pagamento:</strong>
                    <span>${lead.plano_forma_pagamento}</span>
                </div>
                ${lead.plano_observacoes ? `
                <div class="negocio-detail" style="grid-column: 1 / -1;">
                    <strong>📋 Observações:</strong>
                    <span>${lead.plano_observacoes}</span>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Filtros de período
document.querySelectorAll('[name="periodo"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Implementar filtro por período aqui
        renderNovosNegocios();
    });
});

// ===================================
// INICIALIZAÇÃO
// ===================================

window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
