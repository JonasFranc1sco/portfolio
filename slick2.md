Tarefa de Implementação: Parte 2 — Slick Scroll com Rolagem Dinâmica de Página (Auto-Scroll e Overflow Visível)

Contexto do Projeto

Na primeira etapa (`slick.md`), o scroll do usuário foi interceptado para acionar a digitação sequencial de comandos no terminal com a tela travada (`overflow: hidden`). Entretanto, à medida que novas seções/linhas de comando são adicionadas na parte inferior da página, o conteúdo acaba ultrapassando o limite visível da janela (viewport) e o usuário não consegue descer a página para ler o que está sendo digitado embaixo.

O objetivo desta sequência é evoluir o **Slick Scroll** para um comportamento híbrido: continuar acionando a digitação linha a linha ao rolar para baixo, mas permitir e acompanhar a rolagem vertical da página sempre que o conteúdo inferior começar a ficar fora do campo de visão do usuário.

Arquivos Alvo

As alterações devem ser integradas nos arquivos existentes do portfólio:

index.html

main.css

main.js

🛠️ Instruções de Implementação

1. Estrutura HTML (index.html)

Mantenha a estrutura original do portfólio (`header.topbar`, `section.hero` inicial com saudação e avatar ASCII) e o contêiner `#terminal-output` onde os novos blocos de comando (`.hero` > `.terminal-name`) são injetados dinamicamente.

2. Estilização CSS (main.css)

Desbloqueio de Overflow Vertical: Remova o bloqueio rígido `overflow: hidden` do `body` (utilizando `overflow-x: hidden; overflow-y: auto;`) e adicione `scroll-behavior: smooth` no `html` para que a página possa expandir verticalmente conforme novos comandos surgem.

Preservação do Layout Original: Não altere cores, fontes, tamanhos de avatar ou espaçamentos originais do portfólio.

3. Lógica JavaScript (main.js)

Detecção de Visibilidade na Viewport:
Crie uma função utilitária que verifique se o final do terminal (`#terminal-output` ou a última linha ativa `.terminal-name`) está visível dentro da janela atual (`getBoundingClientRect().bottom <= window.innerHeight`).

Comportamento ao Rolar para Baixo (Desktop `wheel` e Mobile `touch`):
1. **Rolagem para Cima (`deltaY < 0` ou swipe para baixo)**: Não bloqueie o evento padrão; permita que o usuário role livremente para cima para visualizar o topo da página.
2. **Rolagem para Baixo quando o final do terminal está fora da tela**: Se o usuário estiver no topo da página e a última linha do terminal estiver abaixo da área visível, permita a rolagem até que a parte inferior do terminal entre no campo de visão antes de disparar o próximo comando.
3. **Gatilho de Digitação + Auto-Scroll**: Quando um novo comando for iniciado via scroll e a nova linha criada ficar próxima ou abaixo do limite inferior da janela (`rect.bottom > window.innerHeight - 40`), execute a rolagem automática suave (`lineElement.scrollIntoView({ behavior: 'smooth', block: 'end' })`) para que o usuário enxergue em tempo real o que está sendo digitado na parte de baixo da página.
4. **Controle de Concorrência (`isAnimating`)**: Enquanto uma linha estiver sendo digitada, novos gatilhos de comando continuam bloqueados pelo lock `isAnimating`, evitando sobreposição de textos.
5. **Pós-Execução Livre**: Após todos os comandos do array terem sido digitados (`currentCommandIndex >= commands.length`), libere totalmente a rolagem nativa da página para cima e para baixo.

🧪 Roteiro de Testes (Testes de Aceitação)

Por favor, o agente deve validar os seguintes cenários após a implementação:

1. Teste de Gatilho Inicial (Slick Scroll):
   - Ação: Rolar a roda do mouse para baixo pela primeira vez.
   - Esperado: O primeiro comando começa a ser digitado caractere por caractere com o cursor piscante apenas na linha ativa.

2. Teste de Acompanhamento Visual (Auto-Scroll ao Ultrapassar a Tela):
   - Ação: Continuar acionando novos comandos via scroll até que as novas linhas ultrapassem a altura inicial da janela (`100vh`).
   - Esperado: A página deve rolar automaticamente para baixo para manter a linha recém-criada visível na parte inferior da tela enquanto ela é digitada.

3. Teste de Prevenção de Concorrência (Spam de Scroll):
   - Ação: Rolar várias vezes rapidamente durante a digitação de um comando.
   - Esperado: Apenas um comando é digitado por vez (`isAnimating === true` impede disparos concorrentes).

4. Teste de Navegação Livre (Subir e Descer a Página):
   - Ação: Rolar para cima para ver o cabeçalho/avatar e depois rolar para baixo novamente até o fim da página.
   - Esperado: O usuário consegue navegar livremente pelo conteúdo já renderizado e visualizar tudo o que está escrito na parte de baixo da página.

5. Teste Mobile (Touch/Swipe):
   - Ação: Arrastar de baixo para cima em telas móveis.
   - Esperado: Aciona o próximo comando e realiza o scroll da página para exibir o conteúdo inferior quando necessário.
