Tarefa de Implementação: Efeito de Terminal Controlado por Scroll

Contexto do Projeto

O objetivo é criar uma experiência interativa onde a rolagem da página (scroll) do usuário não movimenta a tela verticalmente, mas sim aciona a digitação de linhas de comando em um terminal simulado na tela. A implementação deve ser feita utilizando apenas HTML, CSS e JavaScript puro (Vanilla JS).

Arquivos Alvo

As alterações devem ser integradas na seguinte estrutura (conforme o portfólio base):

index.html

main.css

main.js

🛠️ Instruções de Implementação

1. Estrutura HTML (index.html)

Crie um contêiner principal para o terminal que ocupe 100% da altura da tela (100vh).

Crie um contêiner interno vazio onde o output do terminal será renderizado e injetado via JavaScript.

Não crie conteúdo rolável real na página.

2. Estilização CSS (main.css)

Bloqueio de Scroll: Defina overflow: hidden no body e remova as margens padrão.

Visual do Terminal: Fundo escuro (ex: #1e1e1e), fonte monoespaçada (ex: Courier New, monospace) e texto verde ou cinza claro.

Prompt: Estilize o prefixo do usuário (ex: [user@fedora ~]$) com uma cor de destaque, como azul ou verde claro.

Cursor de Texto: Crie uma classe CSS com uma animação keyframes para simular um bloco de cursor piscando no final da linha que está sendo digitada atualmente.

3. Lógica JavaScript (main.js)

Estado Inicial: Defina um array com pelo menos 5 linhas de comandos/textos a serem exibidos sequencialmente. Crie variáveis de controle para o índice atual do comando e um lock booleano (isAnimating) para evitar concorrência.

Escuta de Eventos (Desktop): Adicione um ouvinte para o evento wheel. Previna o comportamento padrão (e.preventDefault()). Identifique se a rolagem foi para baixo (e.deltaY > 0).

Escuta de Eventos (Mobile): Adicione ouvintes para touchstart e touchend (ou touchmove) para calcular o deslocamento no eixo Y. Se o usuário arrastar de baixo para cima (simulando descer a página), acione a lógica.

Controle de Fluxo (Debounce/Lock): Se a variável isAnimating for verdadeira, ignore qualquer novo evento de rolagem.

Efeito Máquina de Escrever: Crie uma função que pegue a string correspondente ao passo atual e insira caractere por caractere no DOM usando setInterval ou setTimeout. Ao terminar a linha, libere o lock (isAnimating = false) e avance o contador de passos. Remova o cursor piscante da linha concluída e deixe apenas na linha ativa.

🧪 Roteiro de Testes (Testes de Aceitação)

Por favor, o agente deve validar os seguintes cenários após a implementação:

Teste de Bloqueio de Scroll Nativo:

Ação: Tentar rolar a página violentamente usando a barra de rolagem (que não deve existir) ou a roda do mouse.

Esperado: A página não deve se mover para cima ou para baixo visualmente.

Teste de Gatilho por Roda do Mouse (Desktop):

Ação: Dar um pequeno giro na roda do mouse para baixo.

Esperado: O primeiro comando deve começar a ser digitado na tela, caractere por caractere, precedido pelo texto do prompt.

Teste de Prevenção de Concorrência (Spam de Scroll):

Ação: Girar a roda do mouse rapidamente várias vezes enquanto uma linha está sendo digitada.

Esperado: Apenas a linha atual deve continuar sendo digitada em sua velocidade normal. Novos comandos só podem iniciar após a conclusão completa da linha atual.

Teste Mobile (Touch/Swipe):

Ação: Simular ambiente mobile nas ferramentas de desenvolvedor e arrastar o dedo de baixo para cima.

Esperado: O evento touch deve ser interceptado e iniciar a digitação do próximo comando da mesma forma que o mouse no desktop.

Fim da Execução:

Ação: Continuar rolando até esgotar todos os itens do array de comandos.

Esperado: O script não deve causar erros no console ao tentar acessar índices inexistentes e deve parar silenciosamente de responder aos eventos de scroll.