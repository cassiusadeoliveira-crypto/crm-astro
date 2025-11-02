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
    
    // Usar Gravatar baseado no email
    const gravatarUrl = getGravatarUrl(currentUser.email);
    document.getElementById('userAvatar').src = gravatarUrl;
}

// Função para gerar URL do Gravatar
function getGravatarUrl(email) {
    // Gerar MD5 hash do email (simplificado)
    const hash = md5(email.toLowerCase().trim());
    // Retornar URL do Gravatar com fallback para identicon
    return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
}

// Função MD5 simplificada para Gravatar
function md5(string) {
    function rotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX, lY) {
        const lX8 = (lX & 0x80000000);
        const lY8 = (lY & 0x80000000);
        const lX4 = (lX & 0x40000000);
        const lY4 = (lY & 0x40000000);
        const lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        if (lX4 | lY4) {
            if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            else return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        } else return (lResult ^ lX8 ^ lY8);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (y ^ (x | (~z))); }
    function FF(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a, b, c, d, x, s, ac) {
        a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
        return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(string) {
        let lWordCount;
        const lMessageLength = string.length;
        const lNumberOfWords_temp1 = lMessageLength + 8;
        const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        const lWordArray = Array(lNumberOfWords - 1);
        let lBytePosition = 0;
        let lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }
    function wordToHex(lValue) {
        let wordToHexValue = "", wordToHexValue_temp = "", lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    }
    let x = Array();
    let k, AA, BB, CC, DD, a, b, c, d;
    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;
    x = convertToWordArray(string);
    a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;
    for (k = 0; k < x.length; k += 16) {
        AA = a; BB = b; CC = c; DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }
    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
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
    
    // FECHA O MODAL IMEDIATAMENTE
    closeFechamentoModal();
    
    // ATUALIZAÇÃO OTIMISTA: Mostra sucesso antes da API responder
    showToast('Fechamento registrado! 🎉', 'success');
    
    // Atualizar localmente o lead no array
    const leadIndex = allLeads.findIndex(l => l.id === leadId);
    if (leadIndex !== -1) {
        allLeads[leadIndex].contas = contas;
        allLeads[leadIndex].publicacoes = publicacoes;
        allLeads[leadIndex].valor_contrato = valorContrato;
        allLeads[leadIndex].data_fechamento = dataFechamento;
        allLeads[leadIndex].vencimento_dia = vencimentoDia;
        allLeads[leadIndex].stage = 'fechado';
    }
    
    // Renderizar imediatamente
    renderLeads();
    loadRanking();
    loadNovosNegocios();
    
    // Chamar API em background
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
        
        if (!data.success) {
            // Se API falhar, reverter e recarregar
            showToast('Erro ao registrar fechamento. Recarregando...', 'error');
            await loadLeads();
            loadRanking();
            loadNovosNegocios();
        }
    } catch (error) {
        console.error('Erro ao salvar fechamento:', error);
        showToast('Erro ao salvar fechamento. Recarregando...', 'error');
        await loadLeads();
        loadRanking();
        loadNovosNegocios();
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
        
        // Usar Gravatar para foto do usuário
        const photoUrl = getGravatarUrl(user.email);
        
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
