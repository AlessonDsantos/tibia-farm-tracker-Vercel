# Tibia Farm Tracker

Site em português (pt-BR) para quem joga **Tibia** registrar suas hunts, acompanhar metas de farm, comparar sessões e disputar rankings. Endereço: **https://www.tibiafarmtracker.com**

Contato: tibiafarmtracker@gmail.com · Instagram @tibiafarmtracker

> Este README descreve **o que o site faz e quais regras ele aplica**. Foi escrito a partir do código e das telas do site. Quando uma regra mudar no código, atualize este arquivo junto com a Central de Ajuda e a lista de novidades do site.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Estrutura do projeto](#2-estrutura-do-projeto)
3. [Como os dados são guardados](#3-como-os-dados-são-guardados)
4. [Conceitos básicos](#4-conceitos-básicos)
5. [Páginas principais](#5-páginas-principais)
6. [Ferramentas](#6-ferramentas)
7. [Rankings e Hall dos Caçadores](#7-rankings-e-hall-dos-caçadores)
8. [Hunt Analyzer: leitura e armazenamento](#8-hunt-analyzer-leitura-e-armazenamento)
9. [Regras de validação e antifraude](#9-regras-de-validação-e-antifraude)
10. [Firebase: coleções e custos](#10-firebase-coleções-e-custos)
11. [Publicação (Vercel) e arquivos de apoio](#11-publicação-vercel-e-arquivos-de-apoio)
12. [Checklist ao alterar o site](#12-checklist-ao-alterar-o-site)
13. [Limitações conhecidas](#13-limitações-conhecidas)

---

## 1. Visão geral

- **Um único arquivo HTML** (`index.html`) contém a interface, os estilos e toda a lógica. Os dados grandes (hunts, criaturas, loot) ficam em arquivos JSON ao lado.
- **Hospedagem estática** na Vercel, com o código no GitHub.
- **Firebase** (Authentication com Google e Firestore) é usado só para login, sincronização opcional, rankings e Hall.
- Funciona **sem login**: os dados ficam no navegador. O login com Google é opcional e habilita sincronização e rankings.
- Visual medieval: cores do logo (dourado, azul-céu e prata), fonte Cinzel nos títulos (carregada do Google Fonts), fundo de muralha de pedra e ícones SVG próprios.

## 2. Estrutura do projeto

| Arquivo | Para que serve |
|---|---|
| `index.html` | O site inteiro (interface, estilos, lógica, textos de ajuda e novidades). |
| `vercel.json` | Reescreve as rotas amigáveis (`/rankings`, `/ferramentas/...`) para o `index.html`. |
| `hunts.json` | Lista oficial de hunts (`id`, `name`, `city`). Usada no seletor de hunts e no Hall. |
| `sitemap.xml` | Mapa do site para buscadores (17 URLs). |
| `robots.txt` | Regras para buscadores. |
| `ads.txt` | Declaração do publisher do Google AdSense. |
| `tibia-creatures-completo.json` | Catálogo de criaturas (fonte: TibiaWikiSQL). Usado no Bestiário e no Caçar por Elemento. |
| `tibia-loot-catalog-inicial.json` | Catálogo de itens e NPCs compradores. Usado no "Onde vender o loot?". |
| `bestiario-correcoes.json` *(opcional)* | Correções manuais de dano das criaturas. **O site ainda não lê este arquivo** (constante `BST_CORRECOES=false`). |
| `img/`, `favicon.ico`, `favicon-48x48.png` | Imagens e ícones. |

### Rotas

| Rota | Página |
|---|---|
| `/` | Início |
| `/registrar-farm` | Registrar Farm |
| `/desempenho` | Desempenho |
| `/historico` | Histórico |
| `/rankings` | Rankings e Hall dos Caçadores |
| `/ajuda` | Central de Ajuda |
| `/ferramentas/onde-vender-loot` | Onde vender o loot? |
| `/ferramentas/comparar-hunts` | Comparar Hunts |
| `/ferramentas/custos-de-hunts` | Custos de Hunt |
| `/ferramentas/previsao-de-farm` | Previsão de Farm |
| `/ferramentas/divisor-party-hunt` | Divisor de Party Hunt |
| `/ferramentas/calculadora-party-xp` | Calculadora de Party XP |
| `/ferramentas/bestiario-de-hunt` | Bestiário de Hunt |
| `/ferramentas/cacar-por-elemento` | Caçar por Elemento |
| `/politica-de-privacidade`, `/termos-de-uso`, `/contato` | Páginas institucionais |

Cada rota nova precisa de uma entrada em `vercel.json` e, se for pública, em `sitemap.xml`.

## 3. Como os dados são guardados

| Dado | Onde fica | Observação |
|---|---|---|
| Metas, farms, gastos, recursos, relatórios, nickname, preços de TC | **localStorage** do navegador (chave `tibiaFarm3_data`) | Antes ficava também em cookies. Isso estourava o limite de cabeçalhos da Vercel (erro 494). Hoje **não há cookies de dados**, e os cookies antigos são migrados e apagados automaticamente. |
| Os mesmos dados, com login Google | Firestore, documento `farmTrackers/{uid}` | Sincroniza entre aparelhos. |
| Hunt Analyzers guardados no navegador | localStorage (`tibiaFarm3_analyzers`) | Só neste aparelho. |
| Hunt Analyzers das hunts do Hall | Firestore, coleção `hallAnalyzers` | Privados. Só o dono lê. |
| Parties e hunts do Divisor de Party | localStorage | **Nunca** vão para a nuvem. |
| Preferências (foco do Comparar Hunts, etc.) | localStorage | Conveniências por navegador. |

**Backup:** em Configurações há **Exportar backup (.json)** e **Importar backup**. O backup inclui os Analyzers guardados.

**Limpar dados:** em Configurações, apaga tudo neste navegador. Depois disso, a conta não volta ao ranking sozinha: o nickname automático só é criado quando uma meta nova é criada.

## 4. Conceitos básicos

### Meta
- Uma meta é um objetivo de gold, normalmente o preço de um item (o ícone é buscado na TibiaWiki), ou **Farm livre** (♾️, sem valor alvo).
- Dá para ter **várias metas** e alternar pelo seletor **Meta Atual**, no topo.
- O card da meta mostra **a data de criação** (e, no farm livre, a data do último reinício do acumulado).
- **Saldo** = gold farmado menos os gastos registrados. **Falta** = meta menos saldo.
- Ao atingir o valor, a meta é **concluída** e aparece um aviso de parabéns. Ao definir a próxima meta, saldo e gastos são zerados e o histórico continua intacto.
- **Registrar Gasto** desconta do saldo (comprou algo que não vem do farm).
- **Reiniciar acumulado** (só no farm livre) zera o gold total e o saldo da meta. Os farms antigos continuam no Histórico e no Desempenho.
- **Excluir meta atual** remove a meta e todo o histórico dela.
- A meta de **profit semanal** (em Desempenho) fica salva na conta até ser alterada ou removida.

### Tipos de farm
- **Hunt**: sessão de caça. É a única que entra em profit/h, rankings e Hall.
- **Boss** e **Outro**: contam no saldo da meta e no histórico, mas **não têm profit/h** nem disputam rankings.

### Resumo e resumo do dia
Alguns registros antigos são "resumos do dia" ou farms "somados". Eles contam no saldo, mas são **ignorados** em rankings, recordes por hunt e estimativas de ritmo.

### Tibia Coin e reais
O preço de **25 TC em R$** é opcional (Configurações). Com ele, o site mostra valores aproximados em reais. O **preço da TC em gold** é usado para converter saldo e falta em TC.

### Nickname
Obrigatório para aparecer em rankings públicos (máx. 30 caracteres). Um nickname aleatório (`JogadorNNNN`) é criado quando a primeira meta é criada, e o jogador pode trocá-lo em Configurações.

## 5. Páginas principais

### Início
- Meta com **barra de progresso** e **estimativa para concluir** (dias e data prevista, calculados pelo seu ritmo de hunts).
- **Farm total** (com TC e R$), **Média/h**, **Melhor hunt/h**, **Melhor dia de hunt** e as **últimas hunts**.
- Bloco **Meta** com detalhes (saldo, falta, Registrar Gasto, Reiniciar). Pode ser ocultado.
- Cards das ferramentas e o widget do **Ranking TFT** com a arte do topo.
- **Média/h e Melhor hunt/h** só consideram hunts **de 1 hora ou mais** e não suspeitas.

### Registrar Farm
- Escolha o tipo (Hunt, Boss, Outro), a hunt (lista oficial, favoritas e últimas), o **tempo em minutos** e o **gold**.
- **Farm do Dia** no topo (gold e TC do dia) e **Resumo da sessão** ao lado (resultado, tempo, resultado/h, custo de recursos e resultado líquido antes de salvar).
- **Hunt Analyzer** (opcional): preenche tempo e gold. Veja a [seção 8](#8-hunt-analyzer-leitura-e-armazenamento).
- **Recursos usados**: o jogador escolhe quais recursos (imbuements e tokens) usou na sessão. Cadastrar um recurso **não desconta nada sozinho**.
- Se o resultado por hora passar de **12.000.000 gp/h**, o site pede confirmação e marca a hunt como **suspeita**.
- Há um aviso quando um recurso usado tem **1 hora ou menos** restante, com botão para **renovar**.
- Hunts de **valor em gold negativo** no Analyzer não preenchem o gold: o site pede ajuste manual.

### Desempenho
- Filtro por **período** e por **hunt**. Cartões de profit, tempo e profit/h médio passam a mostrar só a hunt escolhida.
- **Meta de profit semanal** com acompanhamento.
- Recordes pessoais (seguem a regra de 1 hora para profit/h).

### Histórico
- **Resumo diário**, **Farms feitos** e **Gastos**, com filtro por data e por **hunt e cidade** (hunts oficiais aparecem como *Nome — Cidade*).
- **Relatórios semanais**: gerados automaticamente a cada **7 dias de farm** completos.
- **Relatórios mensais**: gerado automaticamente quando a meta completa **30 dias** desde a criação, e também sob demanda.
- Em Farms feitos, o ícone 📋 abre o Hunt Analyzer guardado (copiar, remover ou enviar ao Comparar Hunts).
- Profit/h no histórico, gráfico e recordes só conta hunts de **1 hora ou mais**. Boss e Outros ficam sem profit/h.

### Configurações
Nickname, preço de 25 TC em R$, criar nova meta, exportar/importar backup, excluir meta atual, limpar dados e login/logout com Google.

### Central de Ajuda
Guia de uso com as últimas atualizações no topo. Vem do próprio `index.html` (variável `ajuda`).

### Novidades
Um modal lista as atualizações (array `TFT_NOVIDADES`, mais recente primeiro). Cada entrada tem `n`, `data`, `titulo` e `texto`.

## 6. Ferramentas

### 6.1 Onde vender o loot?
- Cole o relatório do Hunt Analyzer. **Só a seção "Looted Items"** é considerada (também aceita colar apenas as linhas de loot).
- Os itens são agrupados por **NPC comprador**, ordenados pelo valor total, com alternativas de comprador para cada item, conforme o catálogo `tibia-loot-catalog-inicial.json`.
- Itens que não estão no catálogo ficam sem comprador indicado.

### 6.2 Comparar Hunts
- Compare **duas sessões** (A e B): cole o Analyzer de cada uma ou carregue um já guardado.
- **Foco** (padrão: Gold, lembrado no navegador):
  - **Gold / Farm**: Balance, Loot, Loot/min, Loot a cada 15 min, Supplies, Monsters/min.
  - **EXP/h e Raw/h**: EXP/h, Raw EXP/h, Damage, Damage/h, Monsters killed, Monsters/min.
- Mostra um **placar** (quem venceu cada indicador), **o que cada hunt fez melhor** e **os 2 fatores de maior impacto**. Um botão abre os **14 indicadores** completos.
- As diferenças são em **% relativa à Hunt B**. As relações são observações dos dados e **não provam causa** (por exemplo, mais dano não "causa" mais lucro).

### 6.3 Custos de Hunt
- Calcula o **custo por hora** de **Imbuements** e **Silver Tokens**.
  - Imbuement: custo total ÷ duração em horas.
  - Token: (quantidade × preço) ÷ duração. Também mostra tokens por hora.
- Valores acima de **5.000.000 gp/h** pedem confirmação (provável erro de digitação).
- **A calculadora funciona sem meta.** Para **guardar** o recurso como ativo é preciso ter uma meta ativa. Os recursos ficam **associados à meta**.
- Ao registrar uma hunt com recursos selecionados, o sistema aplica **custo/h × tempo da hunt**, limitado ao que resta do recurso, e reduz o tempo restante.
- Editar uma hunt **devolve** o tempo consumido antes de recalcular (para não descontar duas vezes).
- Sem recurso selecionado, nada é descontado.

### 6.4 Previsão de Farm
Dois modos:
- **Quando eu junto?** Informe quanto quer juntar, quanto já tem (opcional), a **média de farm por dia** (pode ser faixa, como `4kk a 5kk`) e os **dias de farm por semana**.
  - Dias de farm = (valor que falta) ÷ (média por dia). Depois converte para dias corridos usando os dias por semana.
  - Mostra três cenários: **otimista** (média mais alta), **médio** e **pessimista** (média mais baixa), com a data prevista.
- **Quanto preciso farmar por dia?** Informe o valor e o prazo em dias. Mostra a média diária necessária e o equivalente por semana.
- Aceita `k`, `kk` e números inteiros (`200kk`, `4,5kk`, `4500000`).
- **Usar meus dados do Histórico** preenche média por dia e dias por semana a partir das hunts da meta ativa.
- É uma estimativa: depende de manter o ritmo.

### 6.5 Divisor de Party Hunt
Quatro áreas na mesma página:
- **Divisor**: cole o relatório do **Party Hunt Analyzer** e clique em Calcular divisão.
  - Identifica jogadores, loot, supplies e balance e **confere se as somas batem** (avisa quando não fecham).
  - O balance é dividido **igualmente** entre todos. Mostra a lista de transferências e os comandos `transfer` prontos para copiar (um a um ou todos).
- **Minhas Parties**: salve sua party fixa (nome + jogadores). Cada jogador tem **classe obrigatória** (Knight, Paladin, Sorcerer, Druid ou Monk) e o nome deve ser **idêntico ao do Analyzer**. Uma party nova já vem com uma linha por classe; linhas sem nome são ignoradas. Excluir a party apaga também suas hunts.
- **Registrar hunt na Party**: após calcular, escolha a party, informe o local (opcional) e confirme a tabela com resultado, classe, damage e healing.
  - Avisa se os nomes não baterem com os da party.
  - Jogador que não está na party exige informar a classe.
  - **A mesma hunt não pode ser registrada duas vezes** na mesma party.
  - Damage e healing só aparecem quando existem no relatório (nada é inventado).
- **Histórico de Acertos**: todos os acertos, com filtro por party, totais acumulados e balance acumulado de cada jogador. Cada hunt abre em detalhes (loot, supplies, balance, balance/h, damage e healing com porcentagem e transferências).
- **Ranking de Parties** (critérios: Balance/h médio, Balance total, Melhor média por hunt): a party precisa de **pelo menos 5 hunts** registradas. O ranking compara **apenas as parties salvas neste navegador**.
- **Privacidade:** tudo roda no navegador, nada é enviado a servidor, e as parties não vão para a conta Google.

### 6.6 Calculadora de Party XP
- Informe seu level. A calculadora mostra o **level mínimo e máximo** com quem você pode compartilhar experiência.
- Regra usada: o **menor level precisa ter pelo menos 2/3 do maior**. Em party com vários jogadores, todos precisam caber na mesma faixa.
- Considera só os levels. Confira as regras atuais no jogo.

### 6.7 Bestiário de Hunt
- Busque uma criatura (ou use as sugestões rápidas). Mostra **fraqueza elemental**, **elemento alternativo**, dados básicos (HP, XP, armadura, mitigação), link para a TibiaWiki e **Como se defender**.
- **Como se defender** usa o **dano máximo registrado por elemento**:
  - Cada elemento com dano gera uma **proteção sugerida**, com o dano máximo e uma barra.
  - **Dreno de vida e de mana** aparecem só como informação (sem proteção recomendada).
  - **Só ataques físicos**: avisa que nenhuma proteção elemental é indicada.
  - **Sem dados no catálogo**: avisa e orienta consultar a TibiaWiki. O site nunca inventa proteção.
- Ataques ausentes **não significam ausência de dano**: confira a fonte.
- O catálogo vem do TibiaWikiSQL. As correções manuais ficam em `bestiario-correcoes.json` e são mescladas ao catálogo com `mesclar_correcoes.py` (veja [seção 11](#11-publicação-vercel-e-arquivos-de-apoio)).

### 6.8 Caçar por Elemento
- O caminho inverso do Bestiário: escolha o elemento do seu dano (Gelo, Fogo, Terra, Energia, Morte, Sagrado ou Físico) e veja criaturas **fracas a ele** (acima de 100%).
- Colunas: fraqueza, HP, XP, **XP por HP**, local, outras fraquezas e resistências.
- Filtros: nome ou local, fraqueza mínima (110%, 120%, 130%, 150%), classe, ordenação (fraqueza, XP, XP por HP, menor HP, nome).
- Por padrão mostra só **monstros de hunt do Bestiário** e oculta criaturas **sem XP**.
- XP por HP é um indicador simples de velocidade para subir XP, **não de lucro**.

## 7. Rankings e Hall dos Caçadores

Para aparecer é preciso **login Google** e **nickname**. Os rankings usam **apenas números calculados**, nunca o texto do Analyzer.

### Rankings gerais (todo o período, não reiniciam)
| Ranking | Regra |
|---|---|
| **Maior Farm do Dia** | Maior **soma** de gold das **hunts** em um único dia (boss e outros não contam). |
| **Melhor Profit/H** | Maior média por hora em uma hunt, **somando as sessões de 1 hora ou mais** de cada hunt (identificada pelo nome oficial). Mostra o nome da hunt. |
| **Constância** | Sequência de dias com farm até hoje. Um dia sem farm quebra a sequência, **exceto domingos**. Se hoje ainda não teve farm, a contagem parte de ontem. |
| **Tempo de farm** | Tempo total de hunts registradas. |

Os recordes **pessoais** em Desempenho têm também **Maior profit** (melhor resultado em uma única hunt) e **Maior profit/h**.

Entram apenas **hunts válidas**: tipo Hunt, tempo maior que zero, não resumo, não somada e **não suspeita**. A constância mostrada no ranking só vale enquanto não passar um dia útil (de segunda a sábado) sem farm desde o último envio.

Desempate nos rankings: maior métrica, depois maior tempo de hunt, depois quem registrou primeiro, depois o id.

### 👑 Hall dos Caçadores (mensal, por hunt)
- Cada hunt da **lista oficial** tem **um campeão por mês**: quem tem o melhor **Profit/H** naquela hunt. No **dia 1º** de cada mês o ciclo recomeça.
- Para uma hunt entrar, **todas** estas condições precisam ser verdadeiras:
  1. Tipo **Hunt**, com nome na **lista oficial** (`hunts.json`).
  2. **Tempo mínimo de 1 hora**.
  3. **Lucro positivo**.
  4. **Hunt Analyzer colado** e **"Usar esta hunt no Hall" marcado** ao registrar.
  5. Analyzer **completo** (Session, Loot, Supplies, Balance) e **consistente** (seção 9).
  6. Registro **igual ao Analyzer** (mesmo tempo e gold).
  7. Hunt do **mês atual**, jogador com **login Google** e **nickname**, e Analyzer **enviado à nuvem**.
- Se a hunt não for elegível, o site mostra o **motivo** ao registrar e na etiqueta "fora do Hall".
- Das hunts elegíveis de um jogador, só a **melhor de cada hunt no mês** disputa o Hall.
- **Empates:** maior Profit/H; depois a hunt mais longa; depois quem registrou primeiro; depois o id.
- **Últimas conquistas:** o site registra quando alguém **assume o topo** de uma hunt.
- Hunts personalizadas, Bosses e outros tipos continuam valendo no histórico e na meta, mas **não disputam**.

## 8. Hunt Analyzer: leitura e armazenamento

### O que o site lê
Do texto do Hunt Analyzer do Tibia: **Session** (duração), **Loot**, **Supplies**, **Balance**, **Balance/h** (se existir), o período **From … to …** (se existir), **Damage**, **Healing**, **Raw XP Gain**, **XP Gain**, **Killed Monsters** e **Looted Items**.

Ao colar em Registrar Farm:
- O **tempo** e o **gold (Balance)** são preenchidos. Balance negativo não é preenchido.
- O **nome da hunt** é sugerido **só** quando as suas **3 últimas hunts** foram a mesma. Em Registrar Farm, um modal "Qual hunt foi essa?" mostra favoritas e últimas.
- O campo de Registrar Farm **aceita só colar** (não digitar) e trava depois de colado, até clicar em **Limpar**.
- Tamanho máximo: **30.000 caracteres**.

### O que guardar (escolha do jogador)
Ao registrar, duas caixas, **desmarcadas por padrão**:
- **💾 Guardar no navegador:** guarda o Analyzer neste aparelho (consultar depois, copiar, Comparar Hunts). **Sem custo no Firebase.**
- **👑 Usar esta hunt no Hall:** a hunt disputa o Hall e o Analyzer vai para a **nuvem**. Também guarda no navegador.
- **Nenhuma marcada:** o Analyzer só preenche tempo e gold e **não é guardado**.

Orientação ao jogador: **guarde só o Analyzer da sua melhor hunt** para o Hall.

Hunts registradas **antes** desta regra e que já eram elegíveis continuam no Hall como antes, e os Analyzers que já estão na nuvem não são apagados.

## 9. Regras de validação e antifraude

### Da hunt
| # | Regra | Motivo exibido |
|---|---|---|
| 1 | Tipo Hunt | "só hunts participam do Hall" |
| 2 | Hunt na lista oficial | "hunts personalizadas ficam de fora" |
| 3 | Tempo maior que zero; não ser resumo, somada ou suspeita | fora dos rankings |
| 4 | Duração mínima **1 hora** (`HALL_MIN_MIN = 60`) | "a hunt precisa ter pelo menos 1 hora" |
| 5 | Balance **positivo** | "a hunt precisa ter lucro positivo" |
| 6 | Profit/h até **12.000.000/h** (`LIMITE_SUSPEITO`) | "resultado fora do padrão" |
| 7 | Marcou "Usar esta hunt no Hall" | "você não marcou Usar esta hunt no Hall" |

### Do texto do Analyzer
| # | Regra | Motivo exibido |
|---|---|---|
| 8 | Tem Session, Loot, Supplies e Balance | "o Hunt Analyzer está incompleto" |
| 9 | **Balance = Loot − Supplies** (tolerância 1 gp) | "os valores do Analyzer não conferem" |
| 10 | Duração da sessão **não excede o intervalo real** From→To em mais de 2 minutos | idem |
| 11 | Se há **Balance/h**, ele confere com o calculado (tolerância de 3%, mínimo 2) | idem |

### Do registro
| # | Regra | Motivo exibido |
|---|---|---|
| 12 | Tempo e gold registrados **iguais** aos do Analyzer (tolerância 1) | "os valores registrados diferem do Analyzer" |
| 13 | Editar a hunt depois a **reavalia** e pode tirá-la do Hall | "o registro foi alterado depois do envio" |
| 14 | Há espaço no navegador para guardar o Analyzer | "não foi possível guardar o Analyzer" |

### "Fora do padrão" (farms suspeitos)
- Uma hunt com resultado acima de **12 milhões de gp/h** é marcada como **suspeita** e **não entra nos rankings** nem nas estimativas de ritmo do Desempenho.
- **Regra dos 3 dias:** se **3 dias seguidos** têm resultados suspeitos **parecidos entre si** (o maior não passa de 1,5× o menor), esses dias deixam de ser suspeitos e voltam a valer. A ideia é não punir quem realmente faz hunts de alto valor de forma consistente.

> **Importante:** estas conferências rodam **no navegador do jogador**. Elas barram erros e trapaças simples, mas quem alterar o código da página poderia enviar dados falsos. A proteção forte depende das **regras do Firestore** (configuradas no console do Firebase, fora deste repositório) ou de uma verificação no servidor. O Analyzer fica guardado na nuvem para permitir **conferência manual** de resultados suspeitos.

## 10. Firebase: coleções e custos

| Coleção / documento | Conteúdo | Quem usa |
|---|---|---|
| `farmTrackers/{uid}` | Cópia dos dados da conta (metas, farms, etc.) | Sincronização entre aparelhos |
| `rankings/{uid}` | Números dos rankings gerais (profit, melhor hunt, constância, tempo) | Rankings públicos |
| `hallSubmissions/{ciclo__uid__hunt}` | Melhor resultado do mês por hunt (apenas números) | Hall público |
| `hallAnalyzers/{uid__sessão}` | Texto do Analyzer de hunts do Hall | Privado do dono (e conferência) |
| `hallEvents/log` | Últimas conquistas (quem assumiu o topo) | Hall público |
| `huntPerf/{uid}` | Coleção antiga de desempenho por hunt. Hoje o site só a **apaga** ao limpar os dados da conta | Legado |

### Custos (plano gratuito/Spark)
O gargalo é a **cota de leituras e escritas do Firestore**, não o número de acessos simultâneos (o site é estático). Por isso:
- Dados que não precisam de nuvem ficam no **localStorage**.
- Só vão ao Firestore os Analyzers marcados para o Hall.
- A sincronização do Hall é **limitada no tempo** (a assinatura dos dados é guardada por até 12 horas para evitar reenvios idênticos).
- Ao entrar, o site ainda **lê os Analyzers do usuário** na nuvem. Se isso pesar, o próximo passo é ler só os do mês atual.

## 11. Publicação (Vercel) e arquivos de apoio

- **Deploy:** cada commit na `main` do GitHub publica automaticamente na Vercel (cerca de 1 minuto).
- **Voltar uma versão:** no painel da Vercel, **Deployments → ⋯ → Instant Rollback**.
- **Erro 494 (`REQUEST_HEADER_TOO_LARGE`)** quase sempre vem de **cookies grandes demais** no domínio. O site não grava mais cookies de dados. Se aparecer, apague os cookies de `tibiafarmtracker.com`.

### Atualizar o catálogo de criaturas com as correções
O arquivo `bestiario-correcoes.json` lista criaturas **sem dados de dano** (`status: "pendente"`). Para corrigir:
1. Preencha o `maxDamage` (por elemento: `physical`, `earth`, `fire`, `ice`, `energy`, `death`, `holy`, `drown`, `lifedrain`, `manadrain`) e/ou `abilities`, confira na TibiaWiki e mude `status` para `"conferido"`.
2. Rode no seu computador (Python 3):
   ```
   python3 mesclar_correcoes.py tibia-creatures-completo.json bestiario-correcoes.json tibia-creatures-completo-novo.json
   ```
3. O script **valida** elementos, valores e nomes, aplica **só** os `"conferido"` e **não grava nada se houver erro**. Os arquivos de entrada não são alterados.
4. Renomeie o resultado para `tibia-creatures-completo.json` e envie ao GitHub.

`mesclar_correcoes.py` é uma ferramenta de manutenção: **não precisa ficar no repositório publicado**.

## 12. Checklist ao alterar o site

- [ ] Adicionar a entrada da mudança **na Central de Ajuda** (lista "Últimas atualizações") **e** no array `TFT_NOVIDADES` (modal de novidades).
- [ ] Rota nova → atualizar `vercel.json` e `sitemap.xml`.
- [ ] Hunt nova → atualizar `hunts.json` (ids únicos, formato *Nome — Cidade*).
- [ ] Mudou algo que grava no Firestore → conferir as **regras do Firebase**.
- [ ] Testar no navegador: registrar uma hunt, abrir cada ferramenta, testar no celular.
- [ ] Se a regra do Hall mudou, atualizar a [seção 7](#7-rankings-e-hall-dos-caçadores), a [seção 9](#9-regras-de-validação-e-antifraude) e os textos de ajuda.

## 13. Limitações conhecidas

- **Antifraude no cliente:** veja o aviso da seção 9.
- **Fonte Cinzel** depende do Google Fonts: offline, o título cai para outra fonte serif.
- **Parties** e **Analyzers guardados no navegador** não sincronizam entre aparelhos.
- **Catálogo de criaturas:** vem do TibiaWikiSQL e tem lacunas de dano em parte das criaturas (em correção).
- **Hunt registrada sem marcar "Usar no Hall"** não pode ser promovida ao Hall depois (ainda não há botão para isso).
- Possíveis **ids duplicados** em `hunts.json` (conferir, por exemplo, Stag Bastion) e hunts com nomes parecidos (Gnomprona/Warzone).
- Dados no navegador **se perdem** se o usuário limpar os dados do site e não tiver login Google ou backup.

---

*Projeto independente, sem vínculo com a CipSoft. Tibia é marca registrada da CipSoft GmbH.*
