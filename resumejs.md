# Análise de Integridade e Qualidade de Código — `main.js`

## 1. Resumo Geral de Integridade

- **Sincronia com HTML e CSS (Zero Alucinações de DOM/Classes)**:
  - Todos os 9 seletores consultados no DOM (`#theme-toggle`, `.theme-icon`, `.theme-label`, `#terminal-output`, `#terminal-input`, `#terminal-dropdown`, `#terminal-cwd`, `#terminal-header-cwd` e `#terminal-body`) existem em `index.html`.
  - Todas as classes manipuladas via JavaScript (`.light-mode`, `.hidden`, `.dropdown-item`, `.active`, `.dropdown-cmd`, `.dropdown-desc`, `.terminal-entry`, `.terminal-command-line`, `.arrow`, `.folder`, `.terminal-command-text`, `.terminal-response`, `.highlight`, `.error-text`) possuem regras correspondentes em `main.css`.
  - Não há chamadas a APIs inexistentes, variáveis órfãs ou código morto remanescente das versões anteriores.

---

## 2. Bugs Reais e Riscos Encontrados

### 2.1. Injeção de HTML / XSS via `innerHTML` (Linhas 179, 240, 265 e 275)
- **Onde ocorre**: Em `appendTerminalEntry()`, o conteúdo de `responseHTML` é inserido com `response.innerHTML = responseHTML`. Nas linhas 240, 265 e 275, o texto digitado pelo usuário (`input` ou `args.join(' ')`) é interpolado diretamente na string HTML de erro.
- **Impacto**: Se alguém digitar no terminal algo como `<img src=x onerror=alert(1)>`, o navegador interpretará como HTML/JS real.
- **Como melhorar**: Criar uma função simples de escape (`escapeHTML`) para sanitizar qualquer entrada do usuário antes de interpolá-la em templates que usam `innerHTML`.

### 2.2. Acesso a propriedades herdadas de `Object.prototype` em `PROJECTS[arg]` (Linhas 230 e 252)
- **Onde ocorre**: `else if (PROJECTS[arg])` na linha 230.
- **Impacto**: Se o usuário digitar `cd constructor`, `cd toString` ou `cd valueOf`, a expressão `PROJECTS[arg]` retornará a função nativa do `Object.prototype` (que é *truthy*). O terminal mudará o diretório para `constructor` e imprimirá `📦 undefined: undefined`.
- **Como melhorar**: Substituir `PROJECTS[arg]` por `Object.hasOwn(PROJECTS, arg)` (ou transformar `PROJECTS` em um `Map` / `Object.create(null)`).

### 2.3. Case-Sensitivity e Seleção Forçada no `Enter` (Linhas 327–335)
- **Onde ocorre**:
  ```js
  filteredSuggestions[activeDropdownIndex].cmd.startsWith(currentVal.toLowerCase())
  ```
- **Impacto 1 (Bug de maiúsculas/minúsculas)**: A sugestão `'cat README.md'` possui letras maiúsculas. Se o usuário digitar `'cat r'` e pressionar `Enter`, `'cat README.md'.startsWith('cat r')` retorna `false` porque `.cmd` não foi convertido com `.toLowerCase()`.
- **Impacto 2 (Comportamento ao digitar `cd`)**: Na linha 227 existe suporte para o comando `cd` sem argumentos (voltar para `~/Projects`). Porém, como `activeDropdownIndex` começa sempre em `0` quando o dropdown abre, digitar `cd` e apertar `Enter` faz `'cd autogestor'.startsWith('cd')` ser verdadeiro, forçando a execução de `cd autogestor` em vez de `cd`.
- **Como melhorar**:
  - Converter ambos os lados para minúsculas: `.cmd.toLowerCase().startsWith(currentVal.toLowerCase())`.
  - Iniciar `activeDropdownIndex = -1` ao digitar e só preencher/executar a sugestão do dropdown no `Enter` se o usuário tiver navegado com as setas (`activeDropdownIndex >= 0`), deixando o `Tab` para autocompletar a primeira opção.

---

## 3. Pontos de Melhoria de Performance e UX

### 3.1. Renderização Dupla no Clique Inicial (Linhas 283–289)
- **Onde ocorre**: Ouvintes separados para `focus` e `click` chamam `renderDropdown(terminalInput.value)` sem verificar se o dropdown já está aberto com o mesmo filtro.
- **Impacto**: Quando o input está sem foco e o usuário clica nele, o navegador dispara `focus` e imediatamente `click`, recriando os elementos `<li>` do DOM duas vezes seguidas.
- **Como melhorar**: No evento `click`, só chamar `renderDropdown` se o dropdown estiver oculto (`terminalDropdown.classList.contains('hidden')`).

### 3.2. Sugestões Contextuais por Diretório (Linhas 53–63)
- **Onde ocorre**: `COMMAND_SUGGESTIONS` é uma lista estática.
- **Impacto**: Mesmo quando o usuário já está dentro de `~/Projects/autogestor`, o dropdown continua sugerindo `cd autogestor` no topo em vez de priorizar `cat README.md` e `cd ..`.
- **Como melhorar**: Filtrar ou reordenar `COMMAND_SUGGESTIONS` com base no `currentDir` atual (ex.: ocultar `cd autogestor` se já estiver na pasta `autogestor`).

### 3.3. Histórico de Comandos com Setas quando o Dropdown está Fechado
- **Onde ocorre**: Tratamento de `ArrowUp` e `ArrowDown` (linhas 299–315).
- **Como melhorar**: Guardar um array `commandHistory` com os comandos já executados ou permitir fechar o dropdown com `Escape` para navegar nos comandos anteriores, comportamento clássico de terminais.

### 3.4. Acessibilidade ARIA no Dropdown (Linhas 94–118)
- **Onde ocorre**: Os itens `<li role="option">` não recebem o atributo `aria-selected="true"` / `"false"` quando `activeDropdownIndex` muda, e o `<input>` não alterna `aria-expanded="true"` / `"false"`.
- **Como melhorar**: Atualizar `aria-expanded` em `renderDropdown` / `hideDropdown` e `aria-selected` em `updateActiveDropdownItem`.
