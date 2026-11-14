import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env';
import * as schema from './schema';

type Sql = ReturnType<typeof postgres>;
type BancoDrizzle = ReturnType<typeof criarBanco>;

/**
 * Tamanho do pool por instancia. Com 1 conexao, as consultas paralelas de uma
 * tela (o painel dispara mais de dez) rodam uma atras da outra. Com um pooler
 * em modo transaction, poucas conexoes por instancia sao baratas; ajuste com
 * DATABASE_POOL_MAX se o plano do banco limitar conexoes.
 */
function tamanhoDoPool(): number {
  const configurado = Number.parseInt(process.env.DATABASE_POOL_MAX ?? '', 10);
  if (Number.isInteger(configurado) && configurado >= 1 && configurado <= 20) return configurado;
  return env().NODE_ENV === 'production' ? 4 : 5;
}

function criarBanco(sql: Sql) {
  return drizzle(sql, { schema, casing: 'snake_case' });
}

// ---------------------------------------------------------------------------
// Contexto da Cloudflare (Workers com OpenNext)
// ---------------------------------------------------------------------------

interface ContextoCloudflare {
  env?: { HYPERDRIVE?: { connectionString?: string } };
}

/**
 * Em Workers, cada requisicao tem seu proprio contexto, publicado pelo
 * adaptador OpenNext neste simbolo global. Fora da Cloudflare (desenvolvimento,
 * Node, Vercel) ele nao existe e tudo segue como sempre.
 */
function contextoDaCloudflare(): ContextoCloudflare | null {
  const global = globalThis as unknown as Record<symbol, ContextoCloudflare | undefined>;
  return global[Symbol.for('__cloudflare-context__')] ?? null;
}

/**
 * Workers proíbem reaproveitar conexoes entre requisicoes (erro "Cannot perform
 * I/O on behalf of a different request"). Por isso, na Cloudflare cada
 * requisicao recebe a sua propria conexao, ligada ao Hyperdrive (que faz o
 * pooling de verdade, perto do banco). O limite de conexoes simultaneas por
 * requisicao em Workers e 6; ficamos abaixo dele.
 */
const porRequisicao = new WeakMap<object, BancoDrizzle>();
const CONEXOES_POR_REQUISICAO = 5;

function bancoDaRequisicao(contexto: ContextoCloudflare): BancoDrizzle {
  const existente = porRequisicao.get(contexto);
  if (existente !== undefined) return existente;

  const endereco = contexto.env?.HYPERDRIVE?.connectionString ?? env().DATABASE_URL;
  if (endereco === undefined) {
    throw new Error('Sem Hyperdrive e sem DATABASE_URL: nao ha como conectar ao banco.');
  }
  const banco = criarBanco(
    postgres(endereco, {
      max: CONEXOES_POR_REQUISICAO,
      idle_timeout: 5,
      connect_timeout: 15,
      prepare: false,
    }),
  );
  porRequisicao.set(contexto, banco);
  return banco;
}

// ---------------------------------------------------------------------------
// Node (desenvolvimento, servidor proprio, Vercel): uma conexao por instancia
// ---------------------------------------------------------------------------

const globalForDb = globalThis as unknown as { __esteticaflowSql?: Sql };

let bancoDaInstancia: BancoDrizzle | null = null;

function bancoCompartilhado(): BancoDrizzle {
  if (bancoDaInstancia !== null) return bancoDaInstancia;
  const url = env().DATABASE_URL;
  if (url === undefined) throw new Error('DATABASE_URL nao configurada.');
  const sql =
    globalForDb.__esteticaflowSql ??
    postgres(url, {
      max: tamanhoDoPool(),
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  if (env().NODE_ENV !== 'production') globalForDb.__esteticaflowSql = sql;
  bancoDaInstancia = criarBanco(sql);
  return bancoDaInstancia;
}

function bancoAtual(): BancoDrizzle {
  const contexto = contextoDaCloudflare();
  return contexto === null ? bancoCompartilhado() : bancoDaRequisicao(contexto);
}

/**
 * `db` continua sendo importado como antes. Por baixo, cada uso escolhe o banco
 * certo: o compartilhado (Node) ou o da requisicao atual (Cloudflare).
 */
export const db: BancoDrizzle = new Proxy({} as BancoDrizzle, {
  get(_alvo, propriedade) {
    const banco = bancoAtual();
    const valor = Reflect.get(banco, propriedade, banco) as unknown;
    return typeof valor === 'function' ? valor.bind(banco) : valor;
  },
});

export type Db = typeof db;
export type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];
