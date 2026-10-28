
// ==========================================
// 2. ELEMENTOS DO TERMINAL E ESTADO
// ==========================================
const terminalOutput = document.getElementById('terminal-output');
const terminalInput = document.getElementById('terminal-input');
const terminalDropdown = document.getElementById('terminal-dropdown');
const terminalCwd = document.getElementById('terminal-cwd');
const terminalHeaderCwd = document.getElementById('terminal-header-cwd');
const terminalBody = document.getElementById('terminal-body');

// Estado da aplicação isolado e escalável
const terminalState = {
    currentPath: ['Projects']
};

function getCurrentPathString() {
    return terminalState.currentPath.join('/');
}

function getCurrentDirName() {
    return terminalState.currentPath[terminalState.currentPath.length - 1];
}

function updateDirectoryUI() {
    const pathStr = getCurrentPathString();
    const dirName = getCurrentDirName();

    if (terminalCwd) {
        terminalCwd.textContent = dirName;
    }
    if (terminalHeaderCwd) {
        terminalHeaderCwd.textContent = `~/${pathStr}`;
    }
}

// ==========================================
// 3. DADOS DO PORTFÓLIO
// ==========================================
const PROJECTS = {
    autogestor: {
        name: 'AutoGestor',
        summary: 'Sistema de gestão automotiva e controle de estoque/oficina.',
        stack: 'TypeScript, Node.js, PostgreSQL, Docker',
        repo: 'https://github.com/JonasFranc1sco'
    },
    portfolio: {
        name: 'Portfolio Terminal',
        summary: 'Portfólio interativo inspirado em terminal Fedora Linux.',
        stack: 'HTML5, CSS3, Vanilla JavaScript',
        repo: 'https://github.com/JonasFranc1sco/portfolio'
    }
};

const COMMAND_SUGGESTIONS = [
    { cmd: 'cd autogestor', desc: 'Entrar no projeto AutoGestor' },
    { cmd: 'cd portfolio', desc: 'Entrar no projeto Portfolio' },
    { cmd: 'ls', desc: 'Listar conteúdo do diretório atual' },
    { cmd: 'cat README.md', desc: 'Exibir detalhes do projeto atual' },
    { cmd: 'cat skills.txt', desc: 'Listar habilidades e tecnologias' },
    { cmd: 'whoami', desc: 'Sobre Jonas Francisco' },
    { cmd: 'cd ..', desc: 'Voltar para o diretório Projects' },
    { cmd: 'help', desc: 'Ver todos os comandos disponíveis' },
    { cmd: 'clear', desc: 'Limpar o terminal' }
];

const COMMANDS = {
    help: () => ({
        html: [
            '<span class="highlight">Comandos disponíveis:</span>',
            '  cd autogestor   — Acessa a pasta do projeto AutoGestor',
            '  cd portfolio    — Acessa a pasta do projeto Portfolio',
            '  cd ..           — Volta para a pasta Projects',
            '  ls              — Lista projetos ou arquivos da pasta atual',
            '  cat README.md   — Mostra informações do projeto atual',
            '  cat skills.txt  — Exibe tecnologias e ferramentas',
            '  whoami          — Exibe informações sobre o autor',
            '  clear           — Limpa o histórico do terminal'
        ].join('\n')
    }),

    whoami: () => ({
        text: 'Jonas Francisco — Desenvolvedor de Software apaixonado por Linux, automação e arquitetura limpa.'
    }),

    clear: () => {
        if (terminalOutput) terminalOutput.innerHTML = '';
        return null; // Retorna null para não renderizar nova linha
    },

    ls: () => {
        const dir = getCurrentDirName();
        if (dir === 'Projects') {
            return { html: '<span class="highlight">autogestor/</span>   <span class="highlight">portfolio/</span>   skills.txt' };
        }
        return { text: 'README.md   package.json   src/' };
    },

    cd: (args) => {
        const target = args.join(' ').toLowerCase();

        if (!target || target === '~' || target === '..' || target === '../') {
            terminalState.currentPath = ['Projects'];
            updateDirectoryUI();
            return { html: 'Diretório atual: <span class="highlight">~/Projects</span>' };
        }

        if (PROJECTS[target]) {
            terminalState.currentPath = ['Projects', target];
            updateDirectoryUI();
            const proj = PROJECTS[target];
            return {
                html: [
                    `Entrou em <span class="highlight">~/Projects/${target}</span>`,
                    `📦 <strong>${proj.name}</strong>: ${proj.summary}`,
                    `🛠️ Stack: ${proj.stack}`,
                    `💡 Digite <span class="highlight">cat README.md</span> para mais detalhes ou <span class="highlight">cd ..</span> para voltar.`
                ].join('\n')
            };
        }

        // Usa text para erro, mitigando XSS via input do usuário
        return { text: `cd: diretório não encontrado: ${target}`, isError: true };
    },

    cat: (args) => {
        const target = args.join(' ').toLowerCase();
        const dir = getCurrentDirName();

        if (target === 'skills.txt') {
            return {
                html: [
                    '<span class="highlight">• Back-end & Linguagens:</span> JavaScript, TypeScript, Node.js, Python, SQL',
                    '<span class="highlight">• Front-end:</span> HTML5, CSS3, React',
                    '<span class="highlight">• DevOps & Ambiente:</span> Linux (Fedora), Git, Docker'
                ].join('\n')
            };
        }

        if (target === 'readme.md') {
            if (PROJECTS[dir]) {
                const proj = PROJECTS[dir];
                return {
                    html: [
                        `<span class="highlight"># ${proj.name}</span>`,
                        proj.summary,
                        `Tecnologias: ${proj.stack}`,
                        `Repositório: <a href="${proj.repo}" target="_blank" rel="noopener noreferrer">${proj.repo}</a>`
                    ].join('\n')
                };
            }
            return { html: 'Você está em <span class="highlight">~/Projects</span>. Use <span class="highlight">cd autogestor</span> ou <span class="highlight">cd portfolio</span> primeiro.' };
        }

        return { text: `cat: arquivo não encontrado: ${target || '(especifique um arquivo)'}`, isError: true };
    }
};

// ==========================================
// 5. MOTOR DO TERMINAL E PROTEÇÃO XSS
// ==========================================
function appendSafeTerminalEntry(commandText, responseData, dirAtExecution) {
    if (!terminalOutput) return;

    const entry = document.createElement('div');
    entry.className = 'terminal-entry';

    // Construção segura da linha de comando
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-command-line';

    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '➜';

    const folder = document.createElement('span');
    folder.className = 'folder';
    folder.textContent = dirAtExecution;

    const cmdText = document.createElement('span');
    cmdText.className = 'terminal-command-text';
    cmdText.textContent = commandText; // textContent protege contra scripts maliciosos digitados

    cmdLine.appendChild(arrow);
    cmdLine.appendChild(folder);
    cmdLine.appendChild(cmdText);
    entry.appendChild(cmdLine);

    // Adicionando a resposta (HTML interno controlado ou Texto não seguro sanitizado)
    if (responseData) {
        const response = document.createElement('div');
        response.className = `terminal-response ${responseData.isError ? 'error-text' : ''}`;

        if (responseData.html) {
            response.innerHTML = responseData.html;
        } else if (responseData.text) {
            response.textContent = responseData.text;
        }
        entry.appendChild(response);
    }

    terminalOutput.appendChild(entry);
    terminalInput?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function executeCommand(rawInput) {
    const input = rawInput.trim();
    if (!input) return;

    const dirBefore = getCurrentDirName();
    const [cmdName, ...args] = input.split(/\s+/);
    
    // Busca a função de comando correspondente (ignora case)
    const command = COMMANDS[cmdName.toLowerCase()];
    let response;

    if (command) {
        response = command(args);
    } else {
        response = { text: `Comando não reconhecido: "${input}". Digite help ou escolha uma opção no dropdown.`, isError: true };
    }

    // Se o comando não exigiu limpeza de tela (clear), renderiza a linha
    if (response !== null) {
        appendSafeTerminalEntry(input, response, dirBefore);
    }
}

// ==========================================
// 6. LÓGICA DO DROPDOWN (AUTOCOMPLETE)
// ==========================================
let activeDropdownIndex = -1;
let filteredSuggestions = [];

function renderDropdown(filterText = '') {
    if (!terminalDropdown) return;

    const query = filterText.trim().toLowerCase();
    filteredSuggestions = COMMAND_SUGGESTIONS.filter(
        (item) =>
            item.cmd.toLowerCase().includes(query) ||
            item.desc.toLowerCase().includes(query)
    );

    if (filteredSuggestions.length === 0) {
        hideDropdown();
        return;
    }

    terminalDropdown.innerHTML = '';
    activeDropdownIndex = 0;

    filteredSuggestions.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = `dropdown-item${index === activeDropdownIndex ? ' active' : ''}`;
        li.setAttribute('role', 'option');

        const cmdSpan = document.createElement('span');
        cmdSpan.className = 'dropdown-cmd';
        cmdSpan.textContent = item.cmd;

        const descSpan = document.createElement('span');
        descSpan.className = 'dropdown-desc';
        descSpan.textContent = item.desc;

        li.appendChild(cmdSpan);
        li.appendChild(descSpan);

        li.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Previne perda de foco do input
            selectSuggestion(item.cmd, true);
        });

        terminalDropdown.appendChild(li);
    });

    terminalDropdown.classList.remove('hidden');
}

function hideDropdown() {
    if (!terminalDropdown) return;
    terminalDropdown.classList.add('hidden');
    activeDropdownIndex = -1;
}

function updateActiveDropdownItem() {
    if (!terminalDropdown) return;
    const items = terminalDropdown.querySelectorAll('.dropdown-item');
    items.forEach((el, idx) => {
        el.classList.toggle('active', idx === activeDropdownIndex);
        if (idx === activeDropdownIndex) {
            el.scrollIntoView({ block: 'nearest' });
        }
    });
}

function selectSuggestion(commandText, executeImmediately = false) {
    if (!terminalInput) return;
    terminalInput.value = commandText;
    hideDropdown();
    terminalInput.focus();

    if (executeImmediately) {
        executeCommand(commandText);
        terminalInput.value = '';
    }
}

// ==========================================
// 7. EVENT LISTENERS
// ==========================================
if (terminalInput) {
    terminalInput.addEventListener('focus', () => renderDropdown(terminalInput.value));
    terminalInput.addEventListener('click', () => renderDropdown(terminalInput.value));
    terminalInput.addEventListener('input', () => renderDropdown(terminalInput.value));

    terminalInput.addEventListener('keydown', (e) => {
        const isDropdownOpen = terminalDropdown && !terminalDropdown.classList.contains('hidden');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!isDropdownOpen) {
                renderDropdown(terminalInput.value);
            } else if (filteredSuggestions.length > 0) {
                activeDropdownIndex = (activeDropdownIndex + 1) % filteredSuggestions.length;
                updateActiveDropdownItem();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (isDropdownOpen && filteredSuggestions.length > 0) {
                activeDropdownIndex = (activeDropdownIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
                updateActiveDropdownItem();
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (isDropdownOpen && filteredSuggestions.length > 0) {
                const chosen = filteredSuggestions[Math.max(0, activeDropdownIndex)];
                selectSuggestion(chosen.cmd, false);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const currentVal = terminalInput.value.trim();

            // Executa item do dropdown se estiver navegando, senão executa o texto atual
            if (
                isDropdownOpen &&
                activeDropdownIndex >= 0 &&
                filteredSuggestions[activeDropdownIndex] &&
                (!currentVal || filteredSuggestions[activeDropdownIndex].cmd.startsWith(currentVal.toLowerCase()))
            ) {
                const chosenCmd = filteredSuggestions[activeDropdownIndex].cmd;
                terminalInput.value = '';
                hideDropdown();
                executeCommand(chosenCmd);
            } else if (currentVal) {
                terminalInput.value = '';
                hideDropdown();
                executeCommand(currentVal);
            }
        } else if (e.key === 'Escape') {
            hideDropdown();
        }
    });
}

// Fecha dropdown clicando fora
document.addEventListener('click', (e) => {
    if (terminalDropdown && !terminalDropdown.contains(e.target) && e.target !== terminalInput) {
        hideDropdown();
    }
});

// Foca no input ao clicar em qualquer lugar do corpo do terminal
if (terminalBody) {
    terminalBody.addEventListener('click', (e) => {
        // Evita focar se o clique foi em um link dentro da resposta
        if (e.target.tagName !== 'A') {
            terminalInput?.focus();
        }
    });
}