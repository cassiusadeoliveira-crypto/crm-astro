// ============================================
// CRM ASTRO - LÓGICA PRINCIPAL v2.0
// ============================================

const SUPABASE_URL = 'https://uddrzwpycixkmegliftj.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZHJ6d3B5Y2l4a21lZ2xpZnRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzg2MDgwNCwiZXhwIjoyMDYzNDM2ODA0fQ.rqe5t1vYMWD5AXpDpwLq4LIbL7wqM3LhAa9sOMg8P0A';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let currentUser = null;
let allLeads = [];
let allUsers = [];
let currentPeriod = 'month'; // day, week, month

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  // FORÇAR LOGOUT SE NÃO VIER DO LOGIN
  const cameFromLogin = sessionStorage.getItem('cameFromLogin');
  if (!cameFromLogin) {
    sessionStorage.clear();
    localStorage.clear();
    await supabase.auth.signOut();
    window.location.href = 'login.html';
    return;
  }

  await initializeApp();
});

async function initializeApp() {
  try {
    // Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Erro na sessão:', sessionError);
      window.location.href = 'login.html';
      return;
    }

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      console.error('Erro ao buscar usuário:', userError);
      alert('Erro ao carregar dados do usuário.');
      window.location.href = 'login.html';
      return;
    }

    currentUser = userData;

    // Atualizar UI com dados do usuário
    updateUserUI();

    // Carregar todos os usuários (para filtros e ranking)
    await loadAllUsers();

    // Configurar permissões baseadas no role
    setupPermissions();

    // Carregar dados
    await loadLeads();
    await loadRanking();
    await loadNovosNegocios();

    // Configurar event listeners
    setupEventListeners();

    console.log('✅ App inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    alert('Erro ao inicializar o sistema.');
  }
}

// ============================================
// UI DO USUÁRIO
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
}

// ============================================
// CARREGAR TODOS OS USUÁRIOS
// ============================================
async function loadAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (error) throw error;

    allUsers = data || [];

    // Preencher filtro de colaborador (apenas para ADMIN)
    if (currentUser.role === 'ADMIN') {
      const filterSelect = document.getElementById('filterColaborador');
      if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos os colaboradores</option>';
        allUsers.forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.full_name;
          filterSelect.appendChild(option);
        });
      }
    }
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
  }
}

// ============================================
// CONFIGURAR PERMISSÕES
// ============================================
function setupPermissions() {
  const isAdmin = currentUser.role === 'ADMIN';

  // Mostrar/ocultar filtro de colaborador
  const filterColaboradorGroup = document.querySelector('.filter-group');
  if (filterColaboradorGroup && !isAdmin) {
    filterColaboradorGroup.style.display = 'none';
  }

  // Bloquear aba Novos Negócios para USERS
  const negociosTab = document.querySelector('[data-tab="negocios"]');
  if (negociosTab && !isAdmin) {
    negociosTab.style.display = 'none';
  }
}

// ============================================
// CARREGAR LEADS
// ============================================
async function loadLeads() {
  try {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Se não for ADMIN, filtrar apenas leads do próprio usuário
    if (currentUser.role !== 'ADMIN') {
      query = query.eq('owner_id', currentUser.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    allLeads = data || [];
    renderPipeline();
  } catch (error) {
    console.error('❌ Erro ao carregar leads:', error);
    alert('Erro ao carregar leads.');
  }
}

// ============================================
// FILTRAR LEADS POR COLABORADOR (ADMIN)
// ============================================
function filterLeadsByColaborador(colaboradorId) {
  if (!colaboradorId) {
    renderPipeline();
    return;
  }

  const filteredLeads = allLeads.filter(lead => lead.owner_id === colaboradorId);
  renderPipeline(filteredLeads);
}

// ============================================
// RENDERIZAR PIPELINE
// ============================================
function renderPipeline(leadsToRender = null) {
  const leads = leadsToRender || allLeads;
  
  const stages = ['novo', 'em_contato', 'interessado', 'negociacao', 'fechado', 'perdido'];

  stages.forEach(stage => {
    const container = document.getElementById(`leads-${stage}`);
    const countEl = document.getElementById(`count-${stage}`);
    
    if (!container) return;

    const stageLeads = leads.filter(lead => lead.stage === stage);
    
    // Atualizar contador
    if (countEl) {
      countEl.textContent = stageLeads.length;
    }

    // Renderizar cards
    container.innerHTML = '';
    
    if (stageLeads.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <p>Nenhum lead</p>
        </div>
      `;
      return;
    }

    stageLeads.forEach(lead => {
      const card = createLeadCard(lead);
      container.appendChild(card);
    });
  });
}

// ============================================
// CRIAR CARD DE LEAD
// ============================================
function createLeadCard(lead) {
  const card = document.createElement('div');
  card.className = 'lead-card';
  card.draggable = true;
  card.dataset.leadId = lead.id;
  card.dataset.stage = lead.stage;

  // Buscar nome do owner
  const owner = allUsers.find(u => u.id === lead.owner_id);
  const ownerName = owner ? owner.full_name : 'Desconhecido';

  // Formatar Instagram com link
  const instagramLink = lead.instagram ? 
    `<a href="https://instagram.com/${lead.instagram}" target="_blank" class="lead-instagram">
      <i class="fab fa-instagram"></i> @${lead.instagram}
    </a>` : 
    '<span class="lead-instagram">Sem Instagram</span>';

  card.innerHTML = `
    <div class="lead-header">
      <div>
        <div class="lead-name">${lead.name || 'Sem nome'}</div>
        ${instagramLink}
      </div>
      <span class="lead-owner">${ownerName}</span>
    </div>
    <div class="lead-info">
      ${lead.whatsapp ? `
        <div class="lead-info-item">
          <i class="fab fa-whatsapp"></i>
          <span>${lead.whatsapp}</span>
        </div>
      ` : ''}
      ${lead.email ? `
        <div class="lead-info-item">
          <i class="fas fa-envelope"></i>
          <span>${lead.email}</span>
        </div>
      ` : ''}
    </div>
    ${lead.observations ? `
      <div class="lead-observations">
        <i class="fas fa-comment"></i> ${lead.observations}
      </div>
    ` : ''}
    <div class="lead-actions">
      <button class="btn-icon" onclick="editLead('${lead.id}')">
        <i class="fas fa-edit"></i>
      </button>
      <button class="btn-icon delete" onclick="deleteLead('${lead.id}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;

  // Drag and drop events
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  return card;
}

// ============================================
// DRAG AND DROP
// ============================================
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
}

// Configurar zonas de drop
document.querySelectorAll('.leads-container').forEach(container => {
  container.addEventListener('dragover', handleDragOver);
  container.addEventListener('drop', handleDrop);
});

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

async function handleDrop(e) {
  e.preventDefault();
  
  if (!draggedElement) return;

  const targetContainer = e.target.closest('.leads-container');
  if (!targetContainer) return;

  const newStage = targetContainer.id.replace('leads-', '');
  const leadId = draggedElement.dataset.leadId;
  const currentStage = draggedElement.dataset.stage;

  // VERIFICAR PERMISSÕES: USERS não podem mover para negociacao, fechado, perdido
  const restrictedStages = ['negociacao', 'fechado', 'perdido'];
  if (currentUser.role !== 'ADMIN' && restrictedStages.includes(newStage)) {
    alert('❌ Você não tem permissão para mover leads para esta coluna. Somente ADMIN pode fazer isso.');
    return;
  }

  if (newStage === currentStage) return;

  // Atualizar no banco de dados
  await updateLeadStage(leadId, newStage);
}

async function updateLeadStage(leadId, newStage) {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId);

    if (error) throw error;

    // Atualizar lead no array local
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      lead.stage = newStage;
    }

    renderPipeline();
    
    // Se moveu para "fechado", abrir modal de fechamento
    if (newStage === 'fechado') {
      openFechamentoModal(leadId);
    }
  } catch (error) {
    console.error('Erro ao atualizar stage:', error);
    alert('Erro ao mover lead.');
  }
}

// ============================================
// MODAL DE NOVO LEAD
// ============================================
function openNovoLeadModal() {
  const modal = document.getElementById('modalNovoLead');
  const form = document.getElementById('formNovoLead');
  
  form.reset();
  modal.classList.add('show');
}

function closeNovoLeadModal() {
  const modal = document.getElementById('modalNovoLead');
  modal.classList.remove('show');
}

async function saveNovoLead(e) {
  e.preventDefault();

  const name = document.getElementById('leadNome').value.trim();
  const instagram = document.getElementById('leadInstagram').value.trim();
  const whatsapp = document.getElementById('leadWhatsapp').value.trim();
  const observations = document.getElementById('leadObservations').value.trim();

  // VALIDAÇÃO
  if (!name) {
    alert('❌ Nome é obrigatório!');
    return;
  }

  try {
    const newLead = {
      name: name,
      instagram: instagram || null,
      whatsapp: whatsapp || null,
      observations: observations || null,
      stage: 'novo',
      owner_id: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select();

    if (error) {
      console.error('Erro ao salvar lead:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Lead não foi criado no banco de dados');
    }

    console.log('✅ Lead salvo com sucesso:', data[0]);

    // Adicionar ao array local
    allLeads.push(data[0]);

    // Recarregar pipeline
    renderPipeline();

    // Fechar modal
    closeNovoLeadModal();

    alert('✅ Lead criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao salvar lead:', error);
    alert('Erro ao criar lead: ' + error.message);
  }
}

// ============================================
// EDITAR LEAD
// ============================================
function editLead(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  // Verificar se é o dono ou ADMIN
  if (lead.owner_id !== currentUser.id && currentUser.role !== 'ADMIN') {
    alert('❌ Você só pode editar seus próprios leads.');
    return;
  }

  const modal = document.getElementById('modalEditLead');
  const form = document.getElementById('formEditLead');

  document.getElementById('editLeadId').value = lead.id;
  document.getElementById('editLeadNome').value = lead.name || '';
  document.getElementById('editLeadInstagram').value = lead.instagram || '';
  document.getElementById('editLeadWhatsapp').value = lead.whatsapp || '';
  document.getElementById('editLeadEmail').value = lead.email || '';
  document.getElementById('editLeadObservations').value = lead.observations || '';

  modal.classList.add('show');
}

function closeEditLeadModal() {
  const modal = document.getElementById('modalEditLead');
  modal.classList.remove('show');
}

async function saveEditLead(e) {
  e.preventDefault();

  const leadId = document.getElementById('editLeadId').value;
  const name = document.getElementById('editLeadNome').value.trim();
  const instagram = document.getElementById('editLeadInstagram').value.trim();
  const whatsapp = document.getElementById('editLeadWhatsapp').value.trim();
  const email = document.getElementById('editLeadEmail').value.trim();
  const observations = document.getElementById('editLeadObservations').value.trim();

  if (!name) {
    alert('❌ Nome é obrigatório!');
    return;
  }

  try {
    const { error } = await supabase
      .from('leads')
      .update({
        name,
        instagram: instagram || null,
        whatsapp: whatsapp || null,
        email: email || null,
        observations: observations || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) throw error;

    // Atualizar no array local
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      lead.name = name;
      lead.instagram = instagram || null;
      lead.whatsapp = whatsapp || null;
      lead.email = email || null;
      lead.observations = observations || null;
    }

    renderPipeline();
    closeEditLeadModal();

    alert('✅ Lead atualizado com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    alert('Erro ao atualizar lead.');
  }
}

// ============================================
// DELETAR LEAD
// ============================================
async function deleteLead(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  // Verificar se é o dono ou ADMIN
  if (lead.owner_id !== currentUser.id && currentUser.role !== 'ADMIN') {
    alert('❌ Você só pode deletar seus próprios leads.');
    return;
  }

  if (!confirm('Tem certeza que deseja deletar este lead?')) return;

  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;

    // Remover do array local
    allLeads = allLeads.filter(l => l.id !== leadId);

    renderPipeline();

    alert('✅ Lead deletado com sucesso!');
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    alert('Erro ao deletar lead.');
  }
}

// ============================================
// MODAL DE FECHAMENTO
// ============================================
function openFechamentoModal(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;

  const modal = document.getElementById('modalFechamento');
  
  document.getElementById('fechamentoLeadId').value = lead.id;
  document.getElementById('fechamentoNome').textContent = lead.name;

  modal.classList.add('show');
}

function closeFechamentoModal() {
  const modal = document.getElementById('modalFechamento');
  modal.classList.remove('show');
}

async function saveFechamento(e) {
  e.preventDefault();

  const leadId = document.getElementById('fechamentoLeadId').value;
  const valorContrato = parseFloat(document.getElementById('fechamentoValor').value);
  const dataFechamento = document.getElementById('fechamentoData').value;
  const observacoes = document.getElementById('fechamentoObservacoes').value.trim();

  if (!valorContrato || valorContrato <= 0) {
    alert('❌ Valor do contrato inválido!');
    return;
  }

  if (!dataFechamento) {
    alert('❌ Data de fechamento é obrigatória!');
    return;
  }

  try {
    const { error } = await supabase
      .from('leads')
      .update({
        valor_contrato: valorContrato,
        data_fechamento: dataFechamento,
        observacoes_fechamento: observacoes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) throw error;

    // Atualizar no array local
    const lead = allLeads.find(l => l.id === leadId);
    if (lead) {
      lead.valor_contrato = valorContrato;
      lead.data_fechamento = dataFechamento;
      lead.observacoes_fechamento = observacoes || null;
    }

    // Incrementar retornos positivos do owner
    await incrementRetornosPositivos(lead.owner_id);

    renderPipeline();
    await loadNovosNegocios();
    await loadRanking();
    closeFechamentoModal();

    alert('✅ Fechamento registrado com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar fechamento:', error);
    alert('Erro ao registrar fechamento.');
  }
}

// ============================================
// INCREMENTAR RETORNOS POSITIVOS
// ============================================
async function incrementRetornosPositivos(userId) {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('retornos_positivos')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const novoValor = (user.retornos_positivos || 0) + 1;

    const { error: updateError } = await supabase
      .from('users')
      .update({ retornos_positivos: novoValor })
      .eq('id', userId);

    if (updateError) throw updateError;

    // Atualizar localmente
    const userInArray = allUsers.find(u => u.id === userId);
    if (userInArray) {
      userInArray.retornos_positivos = novoValor;
    }
  } catch (error) {
    console.error('Erro ao incrementar retornos positivos:', error);
  }
}

// ============================================
// RANKING
// ============================================
async function loadRanking() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('retornos_positivos', { ascending: false });

    if (error) throw error;

    const rankingContainer = document.getElementById('rankingList');
    if (!rankingContainer) return;

    if (!data || data.length === 0) {
      rankingContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-trophy"></i>
          <p>Nenhum colaborador com retornos positivos ainda</p>
        </div>
      `;
      return;
    }

    rankingContainer.innerHTML = '';

    data.forEach((user, index) => {
      const rankingItem = document.createElement('div');
      rankingItem.className = 'ranking-item';

      rankingItem.innerHTML = `
        <div class="ranking-position">${index + 1}º</div>
        <div class="ranking-user-info">
          <img src="${user.avatar_url || 'https://via.placeholder.com/60'}" 
               alt="${user.full_name}" 
               class="ranking-avatar">
          <div class="ranking-details">
            <h3>${user.full_name}</h3>
            <p>${user.role}</p>
          </div>
        </div>
        <div class="ranking-score">
          <span class="ranking-score-label">Retornos</span>
          <span class="ranking-score-value">${user.retornos_positivos || 0}</span>
        </div>
      `;

      rankingContainer.appendChild(rankingItem);
    });

    console.log('✅ Ranking carregado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao carregar ranking:', error);
    const rankingContainer = document.getElementById('rankingList');
    if (rankingContainer) {
      rankingContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erro ao carregar ranking</p>
        </div>
      `;
    }
  }
}

// ============================================
// NOVOS NEGÓCIOS
// ============================================
async function loadNovosNegocios() {
  try {
    // Buscar leads fechados com dados completos
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('stage', 'fechado')
      .not('valor_contrato', 'is', null)
      .order('data_fechamento', { ascending: false });

    if (error) throw error;

    // Filtrar por período
    const filteredData = filterByPeriod(data || []);

    // Calcular total de faturamento
    const totalFaturamento = filteredData.reduce((sum, lead) => sum + (lead.valor_contrato || 0), 0);

    // Atualizar valor total
    const valorEl = document.querySelector('.total-faturamento .valor');
    if (valorEl) {
      valorEl.textContent = `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Renderizar tabela
    renderNegociosTable(filteredData);

    // Renderizar gráfico
    renderFaturamentoChart(data || []);
  } catch (error) {
    console.error('Erro ao carregar novos negócios:', error);
  }
}

function filterByPeriod(data) {
  const now = new Date();
  
  return data.filter(lead => {
    if (!lead.data_fechamento) return false;
    
    const dataFechamento = new Date(lead.data_fechamento);
    
    if (currentPeriod === 'day') {
      return dataFechamento.toDateString() === now.toDateString();
    } else if (currentPeriod === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return dataFechamento >= oneWeekAgo;
    } else if (currentPeriod === 'month') {
      return dataFechamento.getMonth() === now.getMonth() && 
             dataFechamento.getFullYear() === now.getFullYear();
    }
    
    return true;
  });
}

function renderNegociosTable(data) {
  const tbody = document.querySelector('#tableNegocios tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">Nenhum negócio fechado no período selecionado</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';

  data.forEach(lead => {
    const owner = allUsers.find(u => u.id === lead.owner_id);
    const ownerName = owner ? owner.full_name : 'Desconhecido';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${lead.name}</td>
      <td>${lead.email || '-'}</td>
      <td>${lead.whatsapp || '-'}</td>
      <td>R$ ${(lead.valor_contrato || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      <td>${new Date(lead.data_fechamento).toLocaleDateString('pt-BR')}</td>
      <td>${ownerName}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================
// GRÁFICO DE FATURAMENTO
// ============================================
function renderFaturamentoChart(data) {
  const ctx = document.getElementById('faturamentoChart');
  if (!ctx) return;

  // Preparar dados para o gráfico (últimos 30 dias)
  const hoje = new Date();
  const labels = [];
  const valores = [];

  for (let i = 29; i >= 0; i--) {
    const data = new Date(hoje);
    data.setDate(data.getDate() - i);
    labels.push(data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

    const faturamentoDia = data.filter(lead => {
      if (!lead.data_fechamento) return false;
      const dataFechamento = new Date(lead.data_fechamento);
      return dataFechamento.toDateString() === data.toDateString();
    }).reduce((sum, lead) => sum + (lead.valor_contrato || 0), 0);

    valores.push(faturamentoDia);
  }

  // Destruir gráfico anterior se existir
  if (window.faturamentoChartInstance) {
    window.faturamentoChartInstance.destroy();
  }

  // Criar novo gráfico
  window.faturamentoChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Faturamento Diário (R$)',
        data: valores,
        borderColor: '#00AEEF',
        backgroundColor: 'rgba(0, 174, 239, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00AEEF',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: '#E0E0E0',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 66, 0.95)',
          titleColor: '#00AEEF',
          bodyColor: '#E0E0E0',
          borderColor: '#00AEEF',
          borderWidth: 2,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#E0E0E0',
            callback: function(value) {
              return 'R$ ' + value.toLocaleString('pt-BR');
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#E0E0E0'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        }
      }
    }
  });
}

// ============================================
// FILTROS DE PERÍODO
// ============================================
function setPeriod(period) {
  currentPeriod = period;

  // Atualizar botões ativos
  document.querySelectorAll('.btn-period').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Recarregar dados
  loadNovosNegocios();
}

// ============================================
// TROCA DE TABS
// ============================================
function switchTab(tabName) {
  // Remover active de todas as tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Adicionar active na tab clicada
  event.target.classList.add('active');
  document.getElementById(`tab-${tabName}`).classList.add('active');

  // Recarregar dados se necessário
  if (tabName === 'ranking') {
    loadRanking();
  } else if (tabName === 'negocios') {
    loadNovosNegocios();
  }
}

// ============================================
// LOGOUT
// ============================================
async function logout() {
  if (!confirm('Deseja realmente sair?')) return;

  try {
    sessionStorage.clear();
    localStorage.clear();
    await supabase.auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Filtro de colaborador
  const filterColaborador = document.getElementById('filterColaborador');
  if (filterColaborador) {
    filterColaborador.addEventListener('change', (e) => {
      filterLeadsByColaborador(e.target.value);
    });
  }

  // Formulários
  const formNovoLead = document.getElementById('formNovoLead');
  if (formNovoLead) {
    formNovoLead.addEventListener('submit', saveNovoLead);
  }

  const formEditLead = document.getElementById('formEditLead');
  if (formEditLead) {
    formEditLead.addEventListener('submit', saveEditLead);
  }

  const formFechamento = document.getElementById('formFechamento');
  if (formFechamento) {
    formFechamento.addEventListener('submit', saveFechamento);
  }
}
