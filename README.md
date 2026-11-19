<img src="./.github/readme/header.svg" width="100%" alt="brilho-flow: Projeto pessoal · ERP SaaS" />

<img src="./.github/readme/sobre.svg" width="100%" alt="Sobre o projeto: ERP/SaaS de gestão para empresas de estética automotiva: agenda, clientes, veículos, catálogo de serviços, estoque, financeiro e relatórios num único painel, com isolamento multiempresa e planos de assinatura." />

---

## Sumário

- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Arquitetura](#arquitetura)
- [Decisões e trade-offs](#decisões-e-trade-offs)
- [Modelo de dados](#modelo-de-dados)
- [Segurança](#segurança)
- [Deploy](#deploy)
- [Verificação](#verificação)

---

## Como rodar

Pré-requisitos: **Node 20+** e um **PostgreSQL 14+** acessível.

```bash
# 1. Dependências
yarn

# 2. Ambiente
cp .env.example .env.local
# edite .env.local: DATABASE_URL e SESSION_SECRET
# (os scripts db:* leem `.env` — mantenha uma cópia ou symlink: cp .env.local .env)

# gere um segredo forte:
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"

# 3. Banco
yarn db:migrate     # aplica o schema (Postgres comum ou Supabase)
yarn db:seed        # cria o admin da plataforma e uma empresa de demonstração

# 4. Desenvolvimento
yarn dev            # http://localhost:3000
```

O seed cria a plataforma e **duas empresas de demonstração**, uma em cada plano:

| Conta | Perfil | Senha | Para quê |
| --- | --- | --- | --- |
| valor de `SEED_SUPER_ADMIN_EMAIL` | Administrador da plataforma | `SEED_SUPER_ADMIN_SENHA` | Console de empresas, assinaturas e auditoria |
| `demo@lumenauto.com.br` | Administrador da demo **Pro** (Lumen Auto Studio, 5 usuários) | `SEED_DEMO_SENHA`, ou uma senha aleatória impressa no terminal ao final do seed | Produto inteiro, com seis meses de dados e atendimentos de hoje em todas as etapas do quadro |
| `demo.basico@brilhoexpress.com.br` | Administrador da demo **Básica** (Brilho Express Estética, 2 usuários) | `SEED_DEMO_BASICO_SENHA`, ou aleatória | Só os módulos do plano; estoque e financeiro ficam escondidos. Trocando o plano para Pro na aba Plataforma, eles aparecem (o "upgrade" da demonstração) |

- Nenhuma senha fica fixa no repositório.
- Em `NODE_ENV=production` a empresa demo **não** é criada, a menos que `SEED_DEMO=true`.
- O seed é idempotente. `SEED_DEMO_RECRIAR=true` apaga e recria apenas as empresas demo. Refaça antes de cada demonstração: os atendimentos "de hoje" são gerados no momento do seed.

---

## Variáveis de ambiente

Validadas por Zod no boot (`src/env.ts`). Ausência ou formato inválido derruba a aplicação imediatamente, em vez de falhar no meio de uma requisição.

| Variável | Obrigatória | Descrição |
| --- | :-: | --- |
| `DATABASE_URL` | ✅ (Node) | Conexão PostgreSQL. Em produção, use o endpoint do **pooler**. Na Cloudflare é opcional: a conexão vem do binding `HYPERDRIVE` |
| `SESSION_SECRET` | ✅ | Segredo de assinatura do cookie de sessão. Mínimo de 32 caracteres |
| `NEXT_PUBLIC_APP_URL` | — | URL pública. Padrão: `http://localhost:3000` |
| `DATABASE_POOL_MAX` | — | Conexões por instância (1 a 20). Padrão: 4 em produção, 5 em desenvolvimento |
| `NODE_ENV` | — | Definida pelo runtime |
| `SEED_SUPER_ADMIN_EMAIL` | seed | E-mail do administrador da plataforma |
| `SEED_SUPER_ADMIN_SENHA` | seed | Senha inicial — troque após o primeiro acesso |
| `SEED_SUPER_ADMIN_NOME` | seed | Nome de exibição |
| `SEED_DEMO_SENHA` | — | Senha do usuário da demo Pro. Sem ela, o seed gera uma aleatória |
| `SEED_DEMO_BASICO_SENHA` | — | Senha do usuário da demo Básica. Sem ela, o seed gera uma aleatória |
| `SEED_DEMO` | — | `true` para criar a empresa demo em produção |
| `SEED_DEMO_RECRIAR` | — | `true` para apagar e recriar as empresas demo |

Nenhum segredo é versionado. `.env*` está no `.gitignore`.

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `yarn dev` | Servidor de desenvolvimento |
| `yarn build` | Build de produção |
| `yarn start` | Servidor de produção |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn lint` | ESLint |
| `yarn test` | Testes do domínio (Vitest) |
| `yarn verify` | Typecheck + lint + testes |
| `yarn db:generate` | Gera migration a partir do schema |
| `yarn db:migrate` | Aplica migrations pendentes |
| `yarn db:seed` | Popula o ambiente |
| `yarn db:studio` | Interface visual do banco |
| `yarn format` | Prettier |

---

## Arquitetura

```
src/
├── app/                    Rotas (App Router)
│   ├── page.tsx            Landing pública
│   ├── login/  suporte/    Páginas públicas
│   ├── painel/             Área autenticada
│   └── api/                API REST (route handlers, runtime Node)
│
├── domain/                 REGRAS DE NEGÓCIO — funções puras, zero IO
│   ├── result.ts           Result<T,E>: erro de negócio é valor, não exceção
│   ├── agendamento.ts      Totais, conflito de horário, máquina de estados
│   ├── estoque.ts          Custo por embalagem, validação de baixa, níveis
│   ├── plano.ts            Matriz plano × recurso, ciclo da assinatura
│   ├── financeiro.ts       Parcelamento em até 12x, sem perder centavos
│   ├── cliente.ts          Classificação de relacionamento, links de contato
│   ├── relatorio.ts        Períodos e indicadores
│   ├── tema.ts             Acentos, contraste AA, tokens derivados
│   ├── auditoria.ts        Catálogo de ações auditáveis
│   └── shared/             Decimal exato, tempo (moment-timezone), documentos, texto
│
├── db/                     Schema Drizzle, cliente, migrate, seed
├── schemas/                Contratos Zod — fronteira de entrada
├── server/                 Orquestração: transação + domínio + persistência + log
├── auth/                   Sessão, senha, contexto e guards
├── components/             Interface (design system + telas)
├── hooks/                  React Query por área
└── lib/                    Cliente HTTP (axios), chaves de cache, utilitários
```

**Regra estrutural inegociável:** `src/domain/` não importa `next`, `drizzle`, `react` nem `src/db`. É testável com Vitest sem mock, sem banco e sem servidor. Toda decisão de negócio mora ali; `src/server/` só orquestra IO em volta dela.

### Fluxo de uma requisição

```
Componente cliente
      │ React Query + axios
      ▼
Route handler ──► lerCorpo/lerQuery (Zod)  ──► 422 se inválido
      │
      ▼
carregarContexto() ──► sessão + empresa + recálculo da assinatura
      │                    └─► 401/403 se sessão caiu ou empresa bloqueada
      ▼
Guard de perfil e gate de plano ──► 403/402
      │
      ▼
src/server/*  ──► função pura do domínio ──► Result
      │                                        └─► falha vira HTTP + mensagem
      ▼
Drizzle (transação quando há mais de uma escrita)
      │
      ▼
Trilha de auditoria (nunca derruba a operação principal)
```

---

## Decisões e trade-offs

### Por que Drizzle e não Prisma
O schema depende de recursos que o Prisma abstrai mal: *check constraints* compostas, índices únicos **parciais** (uma solicitação pendente por empresa; uma receita por atendimento) e `SELECT ... FOR UPDATE`. Drizzle mantém o SQL visível e não carrega engine binário — cold start menor em ambiente serverless.
**Trade-off:** menos maturidade em migrations complexas; menos ferramental pronto.

### Por que sessão própria e não Auth.js
O modelo de autorização é perfil + plano + revalidação da assinatura **a cada requisição**. Encaixar isso nos adapters do Auth.js exigiria contorná-los. Um login por credenciais com cookie assinado (`jose`) são ~120 linhas e reproduzem o comportamento exigido.
**Trade-off:** provedores OAuth exigiriam trabalho adicional. Não estão no escopo.

### Por que API REST e não Server Actions
A interface é orientada a dados que mudam com frequência (agenda, saldo, financeiro). React Query dá cache, invalidação por chave, revalidação em foco e estado de carregamento sem esforço. Uma API REST explícita torna isso natural e mantém a superfície testável independentemente da UI.
**Trade-off:** mais arquivos que Server Actions e um salto de rede a mais no primeiro carregamento.

### Por que `BigInt` para dinheiro
`0.1 + 0.2 !== 0.3`. Em sistema financeiro isso vira centavo perdido em relatório. Valores circulam como string decimal e toda conta acontece em inteiros escalados, com arredondamento HALF_UP.
**Trade-off:** conversão na fronteira e código de aritmética mais verboso.
*Um teste desta suíte pegou um bug real de conversão de escala no custo unitário.*

### Por que `moment-timezone`
A operação inteira vive em `America/Sao_Paulo`. Um único módulo (`domain/shared/tempo.ts`) concentra "agora", "hoje" e formatação, e nenhum outro arquivo chama `new Date()` para decidir regra.
**Trade-off:** `moment` está em manutenção e é mais pesado que alternativas modernas. Foi requisito explícito do projeto e está isolado atrás de um módulo — trocar por `date-fns-tz` ou `Temporal` mexe em um arquivo só.

### Por que fontes em runtime e não `next/font`
`next/font` baixa os arquivos **durante o build**. Em ambiente de CI sem acesso ao Google Fonts, o build quebra. As fontes são carregadas pelo navegador com `display=swap` e pilha de fallback do sistema.
**Trade-off:** um salto de rede no primeiro carregamento e possível FOUT.

### Por que responsável = usuário
Existia uma tabela de funcionários sem nenhuma tela de cadastro: o seletor de responsável na agenda ficaria permanentemente vazio. O responsável passou a ser um **usuário ativo da empresa**, e o recurso funciona de ponta a ponta sem um CRUD a mais.
**Trade-off:** não há campos de RH (CPF, admissão, comissão). Nenhum deles era usado.

---

## Modelo de dados

23 tabelas, todas com `empresa_id` (exceto `empresa`, `controle_rate_limit` e `sessao_revogada`) e auditoria de criação/atualização.

| Área | Tabelas |
| --- | --- |
| Organização | `empresa`, `usuario`, `configuracao`, `solicitacao_alteracao_empresa` |
| Operação | `cliente`, `veiculo`, `categoria_servico`, `servico`, `agendamento`, `agendamento_servico` |
| Estoque | `categoria_produto`, `produto`, `estoque`, `movimentacao_estoque` |
| Financeiro | `forma_pagamento`, `receita`, `parcela_recebimento`, `despesa` |
| Plataforma | `log`, `historico_acesso`, `notificacao`, `controle_rate_limit`, `sessao_revogada` |

Invariantes replicadas no banco, não só no código:

- `agendamento`: `subtotal > 0`, `0 ≤ desconto < subtotal`, `total = subtotal − desconto`
- `receita`: índice único parcial em `agendamento_id` (recebimentos à vista) e em `parcela_recebimento_id` — um atendimento não é pago duas vezes
- `parcela_recebimento`: 2 a 12 parcelas, valor positivo, `paga` coerente com `data_pagamento`
- `solicitacao_alteracao_empresa`: índice único parcial em `empresa_id WHERE status = 'PENDENTE'`
- `cliente`: índice único parcial em `(empresa_id, cpf_cnpj) WHERE cpf_cnpj IS NOT NULL`
- Formato de CNPJ, telefone, CEP e placa validado por *check constraint*

---

## Segurança

- **Sessão** em cookie `httpOnly`, `SameSite=Lax`, assinado com HS256; `Secure` em produção.
- **Senha** com bcrypt custo 10.
- **Autorização em três camadas**: rota (middleware) → perfil (guard) → recurso do plano (gate).
- **Isolamento multiempresa**: `empresaId` sempre da sessão assinada, nunca de parâmetro do cliente.
- **Revalidação por requisição**: empresa bloqueada perde acesso na próxima ação, sem esperar o cookie expirar. O **usuário** também é relido a cada requisição: arquivado, movido de empresa ou com a senha trocada perde a sessão na hora, e o papel vigente vem do banco (não do cookie).
- **Limite de tentativas**: login (por IP e por e-mail) e pagamentos têm contador persistente no banco; o middleware ainda aplica um escudo de rajada por instância.
- **Logout revoga o token**: cada sessão tem um identificador (`jti`); ao sair, ele entra em `sessao_revogada` até o token expirar, então um cookie copiado também deixa de valer.
- **Contador de notificações**: os alertas são recalculados no máximo a cada 5 minutos por empresa ao navegar pelo painel, e sempre ao abrir a tela de notificações.
- **Cabeçalhos**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS de 1 ano.
- **Mensagem de login única** para e-mail inexistente e senha errada — não revela quais contas existem.
- **Trilha de auditoria** por empresa e histórico de acesso por usuário.
- **Segredos** apenas em variável de ambiente.

---

## Deploy

Preparado para **Vercel**. Todas as rotas de API declaram `runtime = 'nodejs'`.

1. Configure `DATABASE_URL` (endpoint do **pooler**, não o direto), `SESSION_SECRET` e `NEXT_PUBLIC_APP_URL`.
2. Rode `yarn db:migrate` no passo de deploy ou manualmente antes de publicar.
3. Rode `yarn db:seed` uma única vez, no primeiro deploy.

### Cloudflare Workers (OpenNext)

O projeto também roda em **Cloudflare Workers** com o adaptador [OpenNext](https://opennext.js.org/cloudflare). Passo a passo completo em [docs/plano-deploy-cloudflare-supabase.md](docs/plano-deploy-cloudflare-supabase.md). Resumo do que existe no repositório:

- `wrangler.jsonc`: Worker, flag `nodejs_compat` e binding `HYPERDRIVE` (troque o id pelo da sua conta).
- `open-next.config.ts` e os scripts `cf:build`, `cf:preview` e `cf:deploy`.
- `src/db/client.ts`: fora da Cloudflare mantém uma conexão por instância; na Cloudflare cria **uma conexão por requisição**, ligada ao Hyperdrive (Workers não reaproveitam conexões entre requisições).
- Relatórios: o PDF é desenhado com `pdf-lib` e a planilha usa a versão "navegador" do ExcelJS, porque o renderizador anterior de PDF compilava WebAssembly em tempo de execução, o que Workers não permite.
- Segredos do Worker (`SESSION_SECRET`) vão no painel da Cloudflare; para testar localmente copie `.dev.vars.example` para `.dev.vars`.
- O build de produção na Cloudflare roda em Linux. No Windows funciona se `yarn` estiver no PATH.
- O pacote do Worker fica por volta de 2,5 MiB compactado (limite do plano gratuito: 3 MiB; plano pago: 10 MiB).

### Servidor Node ou Vercel

Se estiver atrás de PgBouncer em modo *transaction*, o driver já vai com `prepare: false`. O pool é de **4 conexões por instância** em produção (`DATABASE_POOL_MAX` ajusta, de 1 a 20): com 1 conexão, as consultas paralelas de uma tela rodavam em fila. Se o plano do banco limitar conexões, reduza.

### Desempenho

Medido em build de produção contra Postgres local (16 conexões simultâneas): ver a seção de medições abaixo. O que mudou:

- A cada requisição autenticada, usuário, empresa e revogação de sessão vêm em **uma** consulta (eram três).
- O layout do painel lê os parâmetros da empresa uma vez e roda a sincronização de alertas **depois** da resposta (`after`).
- Trocar de aba: `loading.tsx` mostra o esqueleto no mesmo instante do clique, o menu pré-carrega os dados da aba ao passar o mouse ou focar, e uma barra fina indica a navegação em curso.
- O limite de requisições por IP no middleware subiu (leitura: 1500/min; escrita: 300/min), porque uma empresa inteira costuma sair pelo mesmo IP.
- `yarn dev` recompila cada página na primeira visita e é **muito** mais lento que produção. Para medir tempo de resposta use `yarn build && yarn start`.

## Identidade visual

A ideia é **polimento**: o sistema tira os riscos da rotina. Escuro por padrão (pintura preta sob luz), com modo claro. Acento padrão **Azul**; a empresa com plano Pro escolhe o próprio. Tipografia: Bricolage Grotesque (títulos), Geist (texto) e Outfit (marca). A placa Mercosul é o identificador do veículo em todas as telas.

- **Landing:** o painel aparece sob uma pintura riscada que o visitante poli com o mouse (canvas; botão "Revelar tudo" e movimento reduzido mostram direto o resultado).
- **Painel:** o "chão da oficina" mostra um cartão por profissional com o carro que ele atende agora. O cronômetro conta desde o horário **agendado**, porque o sistema não guarda a hora real de início.
- **Superfícies que refletem:** os cartões refletem a luz seguindo o mouse; botões principais se preenchem a partir do ponto em que o mouse entra.

Todo movimento respeita `prefers-reduced-motion`.

---

## Quadro do dia

Em Operação, o **Quadro do dia** mostra os atendimentos de hoje em sete etapas: Aguardando o carro, Na fila, Em andamento, Finalização, Revisão, Avisar o cliente e Entregue. Cada cartão avança com um botão ou arrastando.

- A etapa **detalha** o status, nunca o contradiz: as duas primeiras são "agendado", as três seguintes "em andamento" e as duas últimas "concluído". Mover um cartão de "agendado" para uma etapa de andamento inicia o atendimento, com a mesma regra do botão Iniciar da agenda.
- Concluir **não** acontece arrastando: exige o consumo de produtos e o pagamento. O botão "Concluir atendimento" abre a conclusão de sempre.
- Não se volta de status (iniciado não vira agendado, concluído não reabre). Dentro do mesmo status, vai-se e volta-se livremente.
- Se o status muda por outro caminho (por exemplo, Iniciar na agenda), a etapa se ajusta sozinha. Cancelados não aparecem.
- Persistência: coluna `etapa` em `agendamento` (migração 0006), nula significa a etapa inicial do status.

---

## Verificação

```bash
yarn verify   # typecheck + lint + testes
yarn build    # build de produção
```

Estado atual desta entrega:

| Verificação | Resultado |
| --- | --- |
| `tsc --noEmit` (strict) | ✅ sem erros |
| ESLint | ✅ sem erros e sem avisos |
| Vitest — domínio, validações e sessão | ✅ 71 testes |
| `next build` | ✅ 16 páginas + 65 rotas de API |
| Java remanescente | ✅ nenhum arquivo |

**Não verificado neste ambiente:** as migrations e o seed ainda não foram executados contra um PostgreSQL real, e as regras que dependem de banco (travas, transações, índices parciais) não têm teste automatizado — os testes cobrem o domínio puro e as validações. **Rode `yarn db:migrate` e `yarn db:seed` em uma base limpa antes de considerar o schema validado**, por exemplo:

```bash
docker run -d --name esteticaflow-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=esteticaflow -p 5432:5432 postgres:16
# .env: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/esteticaflow
yarn db:migrate && yarn db:seed
```
 Testes de integração com banco real (testcontainers) e e2e (Playwright) seguem como próximo passo.

---

## Documentação relacionada

| Arquivo | Conteúdo |
| --- | --- |
| [`REQUISITOS.md`](./REQUISITOS.md) | Atores, 78 casos de uso, 20 regras de negócio, requisitos não funcionais |
| [`MIGRATION-MAP.md`](./MIGRATION-MAP.md) | Inventário do sistema Java de origem e o mapa da migração |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Arquitetura alvo e justificativa de cada dependência |
