// ============================================================================
// Gemini Bulk Deleter v3.0 - Final Version
// ============================================================================

// --- SELETORES ---
const CHAT_ITEM_SELECTOR = ".conversation-items-container";
const BOTTOM_CONTROLS_SELECTOR =
  'side-nav-action-button[data-test-id="settings-and-help-button"]';
const MORE_OPTIONS_BUTTON_SELECTOR =
  'button[data-test-id="actions-menu-button"]';
const MENU_DELETE_BUTTON_SELECTOR = ".mat-mdc-menu-item";
const CONFIRM_DELETE_BUTTON_SELECTOR = 'button[data-test-id="confirm-button"]';
const CHAT_CLICKABLE_AREA_SELECTOR = ".conversation";
const SIDE_NAV_SELECTOR = "mat-drawer";
const SIDE_NAV_COLLAPSED_CLASS = "mat-drawer-closed";

// --- ESTADO DA APLICAÇÃO ---
let isSelectionModeActive = false;
let bulkDeleteButton;

// CHAMA A FUNÇÃO PARA INJETAR A FONTE DE ÍCONES
injectFont();

// --- LÓGICA PRINCIPAL ---

/**
 * Observa o DOM para injetar nossa UI quando o Gemini carregar.
 */
const observer = new MutationObserver((mutations, obs) => {
  const bottomControls = document.querySelector(BOTTOM_CONTROLS_SELECTOR);
  if (bottomControls && !document.getElementById("geminiBulkDeleteBtn")) {
    console.log("Gemini UI detectada. Injetando botão de exclusão em massa.");
    injectInitialUI(bottomControls);
    obs.disconnect();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

/**
 * Injeta o botão inicial "Select" na UI.
 * @param {HTMLElement} targetElement - O elemento de 'Configurações' antes do qual vamos inserir nosso botão.
 */
function injectInitialUI(targetElement) {
  bulkDeleteButton = document.createElement("button");
  bulkDeleteButton.id = "geminiBulkDeleteBtn";

  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined";
  icon.textContent = "delete";

  const text = document.createElement("span");
  text.id = "bulkDeleteBtnText";
  text.textContent = "Select";

  bulkDeleteButton.append(icon, text);
  bulkDeleteButton.onclick = toggleSelectionMode;

  targetElement.before(bulkDeleteButton);
}

/**
 * Ativa ou desativa o modo de seleção, mostrando/escondendo os checkboxes.
 */
function toggleSelectionMode() {
  isSelectionModeActive = !isSelectionModeActive;
  const chatItems = document.querySelectorAll(CHAT_ITEM_SELECTOR);
  const buttonText = document.getElementById("bulkDeleteBtnText");

  if (isSelectionModeActive) {
    buttonText.textContent = "Cancel";
    bulkDeleteButton.classList.add("cancel-mode");
    bulkDeleteButton.classList.remove("active-delete");

    chatItems.forEach((item) => {
      const clickableArea = item.querySelector(CHAT_CLICKABLE_AREA_SELECTOR);
      if (!clickableArea || item.querySelector(".bulk-delete-checkbox")) return;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "bulk-delete-checkbox";

      checkbox.onclick = (event) => {
        event.stopPropagation();
        updateDeleteButtonState();
      };

      clickableArea.prepend(checkbox);
      item.classList.add("selection-active");
    });
  } else {
    document
      .querySelectorAll(".bulk-delete-checkbox")
      .forEach((cb) => cb.remove());
    document
      .querySelectorAll(".selection-active")
      .forEach((item) => item.classList.remove("selection-active"));

    buttonText.textContent = "Select";
    bulkDeleteButton.onclick = toggleSelectionMode;
    bulkDeleteButton.classList.remove("active-delete", "cancel-mode");
  }
}

/**
 * Injeta a fonte de ícones do Google diretamente no <head> da página.
 * Isso é mais robusto contra políticas de segurança (CSP) do que o @import no CSS.
 */
function injectFont() {
  if (document.getElementById("gemini-icon-font")) return;
  const fontLink = document.createElement("link");
  fontLink.id = "gemini-icon-font";
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
  document.head.appendChild(fontLink);
  console.log("Fonte de Ícones Material Symbols injetada via JavaScript.");
}

/**
 * Injeta o botão inicial "Select" na UI.
 * @param {HTMLElement} targetElement - O elemento de 'Configurações' antes do qual vamos inserir nosso botão.
 */
function injectInitialUI(targetElement) {
  bulkDeleteButton = document.createElement("button");
  bulkDeleteButton.id = "geminiBulkDeleteBtn";

  // Cria o ícone
  const icon = document.createElement("span");
  icon.className = "material-symbols-outlined";
  icon.textContent = "delete";

  // Cria o texto
  const text = document.createElement("span");
  text.id = "bulkDeleteBtnText";
  text.textContent = "Select";

  // NOVO: Cria o alvo de toque para o efeito de hover
  const touchTarget = document.createElement("span");
  touchTarget.className = "mat-mdc-button-touch-target";

  // Adiciona todos os elementos ao botão na ordem correta
  bulkDeleteButton.append(icon, text, touchTarget);
  bulkDeleteButton.onclick = toggleSelectionMode;

  targetElement.before(bulkDeleteButton);
}

/**
 * Atualiza a aparência e função do botão principal com base nos checkboxes marcados.
 */
function updateDeleteButtonState() {
  const checkedCount = document.querySelectorAll(
    ".bulk-delete-checkbox:checked"
  ).length;
  const buttonText = document.getElementById("bulkDeleteBtnText");

  if (checkedCount > 0) {
    buttonText.textContent = `Delete (${checkedCount})`;
    bulkDeleteButton.classList.add("active-delete");
    bulkDeleteButton.classList.remove("cancel-mode");
    bulkDeleteButton.onclick = handleBulkDelete;
  } else {
    buttonText.textContent = "Cancel";
    bulkDeleteButton.classList.remove("active-delete");
    bulkDeleteButton.classList.add("cancel-mode");
    bulkDeleteButton.onclick = toggleSelectionMode;
  }
}

/**
 * Executa a lógica de exclusão para os itens selecionados.
 */
async function handleBulkDelete() {
  const checkedItems = document.querySelectorAll(
    ".bulk-delete-checkbox:checked"
  );
  if (checkedItems.length === 0) return;

  if (
    !confirm(`Are you sure you want to delete ${checkedItems.length} chat(s)?`)
  ) {
    return;
  }

  bulkDeleteButton.disabled = true;
  const buttonText = document.getElementById("bulkDeleteBtnText");
  const total = checkedItems.length;

  // Usamos um loop 'for' tradicional com índice para podermos mostrar o progresso
  for (let i = 0; i < total; i++) {
    const checkbox = checkedItems[i];
    const chatItem = checkbox.closest(CHAT_ITEM_SELECTOR);

    // ATUALIZA O CONTADOR ANTES de tentar deletar
    buttonText.textContent = `Deleting ${i + 1} of ${total}...`;

    try {
      const moreOptionsBtn = chatItem.querySelector(
        MORE_OPTIONS_BUTTON_SELECTOR
      );
      if (moreOptionsBtn) moreOptionsBtn.click();

      const deleteOption = await waitForElement(
        'button[data-test-id="delete-button"]'
      );
      if (deleteOption) deleteOption.click();
      else throw new Error("Botão 'Delete' do menu não encontrado.");

      const confirmButton = await waitForElement(
        'button[data-test-id="confirm-button"]'
      );
      if (confirmButton) confirmButton.click();
      else throw new Error("Botão de confirmação final não encontrado.");

      await sleep(250); // Pausa para a UI respirar
    } catch (error) {
      console.error(
        "Falha ao deletar chat:",
        chatItem.textContent.trim(),
        error
      );
      chatItem.classList.add("deletion-failed");
    }
  }

  // --- LIMPEZA FINAL ---
  // Acontece uma única vez, APÓS o loop terminar completamente.
  bulkDeleteButton.disabled = false;
  toggleSelectionMode();
}

/**
 * Espera de forma inteligente por um elemento aparecer no DOM.
 * Em vez de um tempo fixo, ele verifica continuamente até encontrar o elemento ou um tempo limite ser atingido.
 * @param {string} selector - O seletor CSS do elemento a ser esperado.
 * @param {number} timeout - O tempo máximo de espera em milissegundos.
 * @returns {Promise<Element|null>} - O elemento encontrado ou null se o tempo esgotar.
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const element = document.querySelector(selector);
      if (element) {
        clearInterval(interval);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.warn(
          `Timeout: Elemento "${selector}" não encontrado em ${timeout}ms.`
        );
        resolve(null);
      }
    }, 100); // Verifica a cada 100ms
  });
}

/**
 * Inicia a observação da UI principal para injetar o botão e o observador da barra lateral.
 */
function initialize() {
  injectFont(); // Garante que a fonte dos ícones seja carregada

  const mainObserver = new MutationObserver((mutations, obs) => {
    const bottomControls = document.querySelector(BOTTOM_CONTROLS_SELECTOR);
    const sideNav = document.querySelector(SIDE_NAV_SELECTOR);

    // Precisamos tanto do local do botão quanto da barra lateral para continuar
    if (
      bottomControls &&
      sideNav &&
      !document.getElementById("geminiBulkDeleteBtn")
    ) {
      console.log("Gemini UI detectada. Injetando UI e observadores.");

      injectInitialUI(bottomControls);
      setupSidebarObserver(sideNav); // Inicia o nosso novo "espião"

      obs.disconnect(); // Para de observar a UI principal
    }
  });

  mainObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Configura o "espião" que observa as mudanças de classe na barra lateral.
 * @param {HTMLElement} sideNavElement - O elemento da barra lateral a ser vigiado.
 */
function setupSidebarObserver(sideNavElement) {
  const sidebarObserver = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      // Se o que mudou foi o atributo 'class'
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const target = mutation.target;
        // Verifica se a classe de "encolhido" está presente
        if (target.classList.contains(SIDE_NAV_COLLAPSED_CLASS)) {
          bulkDeleteButton.classList.add("icon-only");
        } else {
          bulkDeleteButton.classList.remove("icon-only");
        }
      }
    }
  });

  // Inicia a observação e também checa o estado inicial
  sidebarObserver.observe(sideNavElement, { attributes: true });
  if (sideNavElement.classList.contains(SIDE_NAV_COLLAPSED_CLASS)) {
    bulkDeleteButton.classList.add("icon-only");
  }
}

/**
 * Função utilitária para criar pausas.
 * @param {number} ms - Tempo em milissegundos.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

initialize();
