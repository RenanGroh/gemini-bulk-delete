// ============================================================================
const CHAT_ITEM_SELECTOR = '.conversation-items-container';
const BOTTOM_CONTROLS_SELECTOR = 'side-nav-action-button[data-test-id="settings-and-help-button"]'; // <<< A CHAVE!
const MORE_OPTIONS_BUTTON_SELECTOR = 'button[data-test-id="actions-menu-button"]';
const MENU_DELETE_BUTTON_SELECTOR = '.mat-mdc-menu-item';
const CONFIRM_DELETE_BUTTON_SELECTOR = '.confirmation-dialog .confirm-button';

// ============================================================================
// Estado da Aplicação
// ============================================================================
let isSelectionModeActive = false;
let bulkDeleteButton;

/**
 * Função principal que observa o DOM para injetar nossa UI.
 */
const observer = new MutationObserver((mutations, obs) => {
    const bottomControls = document.querySelector(BOTTOM_CONTROLS_SELECTOR);

    // Se o container de baixo existir e nosso botão ainda não, injetamos a UI.
    if (bottomControls && !document.getElementById('geminiBulkDeleteBtn')) {
        console.log('Gemini UI detectada. Injetando botão de exclusão em massa.');
        injectInitialUI(bottomControls);
        // Uma vez injetado, não precisamos mais observar.
        obs.disconnect();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

/**
 * Injeta o botão inicial "Excluir Vários" na UI.
 * @param {HTMLElement} targetElement - O elemento de 'Configurações' antes do qual vamos inserir nosso botão.
 */
function injectInitialUI(targetElement) {
    bulkDeleteButton = document.createElement('button');
    bulkDeleteButton.id = 'geminiBulkDeleteBtn';
    bulkDeleteButton.textContent = 'Excluir Vários';
    bulkDeleteButton.onclick = toggleSelectionMode;

    // Adiciona nosso botão ANTES do elemento de configurações.
    targetElement.before(bulkDeleteButton);
}

/**
 * Ativa ou desativa o modo de seleção, mostrando/escondendo os checkboxes.
 */
function toggleSelectionMode() {
    isSelectionModeActive = !isSelectionModeActive;
    const chatItems = document.querySelectorAll(CHAT_ITEM_SELECTOR);

    if (isSelectionModeActive) {
        bulkDeleteButton.textContent = 'Cancelar';
        bulkDeleteButton.classList.add('cancel-mode'); // Adiciona classe para estilo de "cancelar"

        chatItems.forEach(item => {
            if (item.querySelector('.bulk-delete-checkbox')) return; // Já tem, não faz nada.
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'bulk-delete-checkbox';
            checkbox.onclick = updateDeleteButtonState;
            item.prepend(checkbox);
            item.classList.add('selection-active'); // Para estilização do item
        });
    } else {
        // Sai do modo de seleção
        document.querySelectorAll('.bulk-delete-checkbox').forEach(cb => cb.remove());
        document.querySelectorAll('.selection-active').forEach(item => item.classList.remove('selection-active'));
        
        // Reseta o botão principal
        bulkDeleteButton.textContent = 'Excluir Vários';
        bulkDeleteButton.onclick = toggleSelectionMode; // Garante que a função seja a de alternar
        bulkDeleteButton.classList.remove('active-delete', 'cancel-mode');
    }
}

/**
 * Atualiza a aparência e função do botão principal com base nos checkboxes marcados.
 */
function updateDeleteButtonState() {
    const checkedCount = document.querySelectorAll('.bulk-delete-checkbox:checked').length;

    if (checkedCount > 0) {
        bulkDeleteButton.textContent = `Excluir (${checkedCount})`;
        bulkDeleteButton.classList.add('active-delete'); // Deixa o botão vermelho vivo
        bulkDeleteButton.classList.remove('cancel-mode');
        bulkDeleteButton.onclick = handleBulkDelete; // Muda a função do botão para DELETAR
    } else {
        // Nenhum selecionado, o botão age como "Cancelar"
        bulkDeleteButton.textContent = 'Cancelar';
        bulkDeleteButton.classList.remove('active-delete');
        bulkDeleteButton.classList.add('cancel-mode');
        bulkDeleteButton.onclick = toggleSelectionMode; // Volta a função para CANCELAR
    }
}

/**
 * Executa a lógica de exclusão para os itens selecionados.
 */
async function handleBulkDelete() {
    const checkedItems = document.querySelectorAll('.bulk-delete-checkbox:checked');
    if (checkedItems.length === 0) return;

    if (!confirm(`Tem certeza que quer deletar ${checkedItems.length} chat(s)?`)) {
        return;
    }
    
    bulkDeleteButton.disabled = true;
    bulkDeleteButton.textContent = 'Excluindo...';

    for (const checkbox of checkedItems) {
        const chatItem = checkbox.closest(CHAT_ITEM_SELECTOR);
        try {
            // A lógica de simular cliques permanece a mesma
            const moreOptionsBtn = chatItem.querySelector(MORE_OPTIONS_BUTTON_SELECTOR);
            if (moreOptionsBtn) moreOptionsBtn.click();
            await sleep(150);

            const deleteOption = Array.from(document.querySelectorAll(MENU_DELETE_BUTTON_SELECTOR))
                                     .find(el => el.textContent.trim().toLowerCase() === 'excluir');
            if (deleteOption) deleteOption.click();
            await sleep(150);

            const confirmButton = document.querySelector(CONFIRM_DELETE_BUTTON_SELECTOR);
            if (confirmButton) confirmButton.click();
            
            console.log('Chat deletado:', chatItem.textContent.trim());
            await sleep(500); // Pausa para a UI do Gemini respirar
        } catch (error) {
            console.error('Falha ao deletar chat:', error);
        }
    }

    bulkDeleteButton.disabled = false;
    // Após deletar tudo, sai do modo de seleção.
    toggleSelectionMode();
}


/**
 * Função utilitária para criar pausas.
 * @param {number} ms - Tempo em milissegundos.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}