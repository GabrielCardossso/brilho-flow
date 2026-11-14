# Plano de deploy: Cloudflare + Supabase, conta pessoal e duas demos

Objetivo: colocar o Brilhoflow no ar com a conta pessoal do Gabriel, usando **Cloudflare Workers** (com o adaptador OpenNext) para o app e **Supabase** para o Postgres, ligados pelo **Hyperdrive**. O banco terá:

- o administrador da plataforma (e-mail pessoal do Gabriel);
- uma demo no **plano Pro** (Lumen Auto Studio, já existe no seed);
- uma demo no **plano Básico** (nova, a criar no seed).

As demos são para mostrar ao vivo, no notebook, a donos de estética.

## Quem faz o quê

| Quem | O que |
|---|---|
| Gabriel | Entrar nas contas (Cloudflare, Supabase, GitHub), digitar senhas e a string de conexão do banco, aprovar pagamento do plano Workers Paid, autorizar a integração do GitHub com a Cloudflare |
| Claude (Edge conectado) | Navegar nos painéis, conferir qual conta está logada, criar projeto, buscar IDs, conferir o resultado e testar o site no ar |
| Claude (local) | Preparar o código, rodar testes, migrações e seed quando o Gabriel liberar a conexão |

Regras de segurança do trabalho no navegador:

- Usar a extensão Claude in Chrome, no navegador deste computador, e conferir o e-mail da conta antes de qualquer criação ou alteração.
- Nunca usar a conta de outra pessoa da empresa, mesmo que apareça logada.
- Senha, token e string de conexão são digitados só pelo Gabriel. Claude não preenche esses campos nem os repete no chat.

## Fase 0. Pré-requisitos (antes de começar)

1. Edge aberto, com a extensão conectada (Claude confirma qual navegador é o deste computador).
2. Contas pessoais criadas e logadas: GitHub (`GabrielCardossso`), Supabase e Cloudflare. Claude confere o e-mail mostrado em cada painel antes de agir.
3. Decisão: plano **Workers Paid** (cerca de US$ 5 por mês). Motivos: o login com bcrypt gasta mais CPU do que o limite do plano gratuito, e o tamanho do app (Excel, PDF, gráficos) provavelmente passa do limite gratuito. É estimativa, vale medir.
4. O trabalho está na branch `perf-ux-refactor`. Fazer o merge no `main` (ou apontar a Cloudflare para a branch).
5. Gerar e guardar num gerenciador de senhas: senha do banco, `SESSION_SECRET` (mínimo 32 caracteres), senha do administrador, senhas das duas demos.

## Fase 1. Supabase

1. Criar o projeto na região **São Paulo (sa-east-1)**, com a senha do banco digitada pelo Gabriel.
2. Anotar (só o Gabriel vê e guarda): conexão direta e conexão do pooler.
3. Confirmar com Claude que o RLS está ativo e que `anon` e `authenticated` não têm acesso às tabelas (as migrações já fazem isso; conferir nos avisos de segurança do painel depois das migrações).
4. Não usar a API REST nem o auth do Supabase: o app só usa o Postgres.

## Fase 2. Preparar o código (Claude, local, sem tocar em conta) — CONCLUÍDA

Feito e testado localmente (Worker rodando no `workerd`, contra o Postgres local): login, painel, agenda, quadro, relatório em PDF e em Excel. O pacote ficou com cerca de 2,5 MiB compactado. Resumo no README, seção Deploy.

1. Instalar `@opennextjs/cloudflare` e `wrangler`.
2. Criar `wrangler.jsonc` (flag `nodejs_compat`, data de compatibilidade recente, binding do Hyperdrive) e `open-next.config.ts`.
3. Mudar `src/db/client.ts`: hoje há um pool compartilhado entre requisições, o que não funciona em Workers. Passa a haver **uma conexão por requisição**, usando o Hyperdrive quando existir e a `DATABASE_URL` nos demais casos (desenvolvimento local continua igual).
4. Ajustar scripts: `cf:build`, `cf:preview`, `cf:deploy`.
5. Conferir pontos de risco: `after()` no layout do painel, middleware, `process.env` no Worker, exportação PDF e Excel, tamanho do pacote.
6. Seed: transformar a criação da demo em função com parâmetro de plano. Cria a **demo Básica**, por exemplo Brilho Express Estética (CNPJ fictício, 2 usuários, sem dados de estoque e financeiro, com agenda e atendimentos de hoje para o Quadro do dia).
7. Testes de domínio, lint e tipos. O OpenNext não roda bem no Windows: o build real acontece na Cloudflare (ou no WSL, se houver).

## Fase 3. Banco em produção (da máquina do Gabriel)

Com a conexão direta do Supabase, digitada pelo Gabriel no terminal:

1. Rodar as migrações (`npx tsx src/db/migrate.ts`). Isso cria todas as tabelas, inclusive a coluna `etapa` do Quadro do dia.
2. Rodar o seed com `SEED_SUPER_ADMIN_EMAIL` (e-mail pessoal), `SEED_SUPER_ADMIN_SENHA`, `SEED_DEMO=true` e as senhas das demos.
3. Conferir no Supabase: 3 empresas (plataforma, Lumen Auto Studio Pro e demo Básica), usuários e atendimentos de hoje.
4. O seed não troca o administrador se a empresa da plataforma já existir. Se isso acontecer, Claude escreve o ajuste.

## Fase 4. Cloudflare

1. Entrar na conta pessoal. Claude confere o e-mail e o plano.
2. Contratar o **Workers Paid** (só o Gabriel, é pagamento).
3. Criar o **Hyperdrive** apontando para o Supabase. A string de conexão é digitada pelo Gabriel. Claude anota apenas o ID resultante (não é segredo) e o coloca no `wrangler.jsonc`.
4. Criar o **Worker** a partir do repositório do GitHub (Workers & Pages, importar repositório), não um projeto Pages. O Gabriel autoriza a integração do GitHub.
5. Comandos do build: build com `npx opennextjs-cloudflare build` e deploy com `npx opennextjs-cloudflare deploy`.
6. Variáveis do Worker: `SESSION_SECRET` (como segredo), `NEXT_PUBLIC_APP_URL` (endereço final do site) e, se necessário, `DATABASE_URL`. O Gabriel digita os valores.
7. Domínio: quando o `brilhoflow.com.br` for registrado, adicionar como domínio personalizado do Worker, atualizar `NEXT_PUBLIC_APP_URL` e publicar de novo.

## Fase 5. Verificação no ar (Claude, pelo Edge)

Roteiro de fumaça:

1. Landing: pintura, quadro Kanban, planos, rodapé com contatos e link do WhatsApp.
2. Login do administrador, aba Plataforma, criar uma empresa de teste e depois removê-la ou bloqueá-la.
3. **Demo Pro:** painel, Quadro do dia (mover um cartão), estoque, financeiro, relatório com exportação em PDF e Excel, personalização de tema.
4. **Demo Básica:** Painel, Agenda, Quadro do dia, Clientes, Serviços e Relatório simples com PDF; módulos fora do plano (estoque, financeiro, Excel) bloqueados ou escondidos.
5. Sair da conta e conferir que a sessão antiga não volta (revogação do login).
6. Tempo de resposta do painel e da agenda (comparar com o local) e conferir os registros de erro do Worker.

## Fase 6. Rotina das demos

Antes de cada visita, refazer as duas demos, para que o "hoje" esteja vivo:

- Com `SEED_DEMO_RECRIAR=true`, o seed apaga e recria apenas as empresas demo.
- Alternativa mais segura em visita: rodar tudo **local** no notebook (`localhost`), sem depender do wi-fi da estética.
- As senhas das demos ficam só com o Gabriel.

## Riscos e plano B

| Risco | Plano B |
|---|---|
| Pacote do Worker maior que o limite | Tirar a exportação PDF e Excel do Worker (rota separada) ou usar um servidor Node |
| Limite de CPU no login | Usar o plano pago. Não reduzir o custo do bcrypt só para caber no limite, porque isso enfraquece as senhas |
| `after()` ou algo do Next sem suporte no adaptador | Trocar por `waitUntil` do Worker |
| Hyperdrive com a conexão do Supabase | Testar o pooler em modo sessão (IPv4) ou a conexão direta; conferir nos documentos da Cloudflare na hora |
| Build só falha na Cloudflare | Uma a duas rodadas de ajuste pelos logs do build |
| Tudo travar | Hospedar em servidor Node comum (Render, Railway, Fly) e deixar a Cloudflare só no DNS e na proteção |

## Ordem sugerida

1. Fase 2 (código), pode ser feita já, sem conta nenhuma.
2. Fases 0, 1 e 3 (contas e banco).
3. Fase 4 (Cloudflare).
4. Fases 5 e 6 (testes e rotina das demos).
