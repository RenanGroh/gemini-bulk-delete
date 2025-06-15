// Aguarda um pouco para garantir que a UI do Gemini carregou completamente.
// Usamos um MutationObserver para reagir a mudanças no DOM, o que é mais robusto
// do que um simples setTimeout.
const observer = new MutationObserver((mutations, obs) => {
    // Procura o local onde os botões de controle ficam (ex: "Novo Chat")
    const sidebarControls = document.querySelector('.nav-controls');
    // Procura a lista de chats recentes
    const recentChatList = document.querySelector('.recent-chats-list');

    // Se a UI estiver pronta e nosso botão ainda não existir, nós o criamos.
    if (sidebarControls && recentChatList && !document.getElementById('bulkDeleteBtn')) {
        console.log('Gemini UI carregada, injetando funcionalidade de bulk delete.');
        injectBulkDeleteUI(sidebarControls, recentChatList);
        // Podemos parar de observar uma vez que a UI foi injetada.
        // obs.disconnect(); // Descomente se quiser que rode apenas uma vez.
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/**
 * Injeta os checkboxes e o botão principal na UI do Gemini.
 * @param {HTMLElement} controlsContainer - O container onde o botão de deletar será adicionado.
 * @param {HTMLElement} chatListContainer - O container da lista de chats.
 */
function injectBulkDeleteUI(controlsContainer, chatListContainer) {
    // 1. Criar o botão de deletar
    const bulkDeleteBtn = document.createElement('button');
    bulkDeleteBtn.id = 'bulkDeleteBtn';
    bulkDeleteBtn.textContent = 'Deletar Selecionados';
    bulkDeleteBtn.onclick = handleBulkDelete;
    controlsContainer.appendChild(bulkDeleteBtn);

    // 2. Adicionar checkboxes aos itens de chat existentes e futuros
    const addCheckboxes = (targetNode) => {
        const chatItems = targetNode.querySelectorAll('.chat-history-item:not(.has-checkbox)');
        chatItems.forEach(item => {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'bulk-delete-checkbox';
            item.classList.add('has-checkbox'); // Evita adicionar múltiplos checkboxes
            // Adiciona o checkbox no início do item do chat
            item.prepend(checkbox);
        });
    };
    
    // Adiciona aos chats já existentes
    addCheckboxes(chatListContainer);

    // Observa a lista de chats para adicionar checkboxes a novos itens (quando o histórico carrega mais)
    const chatObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                addCheckboxes(mutation.target);
            }
        });
    });

    chatObserver.observe(chatListContainer, {
        childList: true,
        subtree: true
    });
}

/**
 * Lida com o evento de clique do botão "Deletar Selecionados".
 */
async function handleBulkDelete() {
    const checkedItems = document.querySelectorAll('.bulk-delete-checkbox:checked');
    if (checkedItems.length === 0) {
        alert('Nenhum chat selecionado para deletar.');
        return;
    }

    if (!confirm(`Você tem certeza que quer deletar ${checkedItems.length} chat(s)?`)) {
        return;
    }

    this.disabled = true; // Desabilita o botão para evitar cliques duplos
    this.textContent = 'Deletando...';

    for (const checkbox of checkedItems) {
        const chatItem = checkbox.closest('.chat-history-item');
        try {
            // Simula o processo de deleção manual
            // 1. Encontra e clica no botão "..." (mais opções)
            const moreOptionsBtn = chatItem.querySelector('button[aria-label="More"]'); // O seletor pode mudar!
            if (moreOptionsBtn) moreOptionsBtn.click();
            await sleep(100); // Pequena pausa para o menu aparecer

            // 2. Encontra e clica no botão "Delete" no menu que apareceu
            // O menu de contexto é geralmente adicionado ao body, não dentro do item.
            const deleteOption = Array.from(document.querySelectorAll('.mat-mdc-menu-item'))
                                     .find(el => el.textContent.trim() === 'Delete');
            if (deleteOption) deleteOption.click();
            await sleep(100); // Pausa para o diálogo de confirmação

            // 3. Encontra e clica no botão de confirmação da deleção
            const confirmButton = document.querySelector('.confirmation-dialog button.confirm-button'); // Seletor de exemplo
            if(confirmButton) confirmButton.click();

            console.log('Chat deletado:', chatItem.textContent);
            await sleep(500); // Pausa maior entre deleções para a UI do Gemini processar
        } catch (error) {
            console.error('Falha ao deletar o chat:', chatItem.textContent, error);
        }
    }
    
    this.disabled = false;
    this.textContent = 'Deletar Selecionados';
    alert('Deleção em massa concluída!');
}

/**
 * Função utilitária para criar pausas.
 * @param {number} ms - Tempo em milissegundos.
 * @returns {Promise}
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}