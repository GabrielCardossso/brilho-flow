import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/env';
import * as schema from './schema';

/**
 * Conexao unica por instancia. Em ambiente serverless o modulo e reaproveitado
 * entre invocacoes quentes, entao o pool fica pequeno e `prepare` desligado
 * para funcionar com poolers em modo transaction (PgBouncer/Supabase).
 */
const globalForDb = globalThis as unknown as {
  __esteticaflowSql?: ReturnType<typeof postgres>;
};

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

function criarConexao() {
  return postgres(env().DATABASE_URL, {
    max: tamanhoDoPool(),
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
  });
}

const sql = globalForDb.__esteticaflowSql ?? criarConexao();
if (env().NODE_ENV !== 'production') {
  globalForDb.__esteticaflowSql = sql;
}

export const db = drizzle(sql, { schema, casing: 'snake_case' });
export const conexao = sql;
export type Db = typeof db;
export type Transacao = Parameters<Parameters<typeof db.transaction>[0]>[0];
