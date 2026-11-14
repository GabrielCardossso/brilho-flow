import { lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { COOKIE_SESSAO, lerSessao } from '@/auth/sessao';
import { db } from '@/db/client';
import { sessaoRevogada } from '@/db/schema';
import { registrar } from '@/server/log';

export const runtime = 'nodejs';

export async function POST() {
  const jar = await cookies();
  const sessao = await lerSessao(jar.get(COOKIE_SESSAO)?.value);

  if (sessao !== null) {
    // O token e sem estado: para o logout valer tambem para quem copiou o
    // cookie, o identificador entra na lista de revogados ate o token expirar.
    if (sessao.jti !== null) {
      try {
        const expiraEm = new Date((sessao.exp ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30) * 1000);
        await db
          .insert(sessaoRevogada)
          .values({ jti: sessao.jti, usuarioId: sessao.usuarioId, expiraEm })
          .onConflictDoNothing();
        // Limpeza oportunista: revogacao de token ja expirado nao tem mais efeito.
        await db.delete(sessaoRevogada).where(lt(sessaoRevogada.expiraEm, new Date()));
      } catch (excecao) {
        console.error('[esteticaflow] falha ao revogar a sessão:', excecao);
      }
    }

    await registrar({
      empresaId: sessao.empresaId,
      usuarioId: sessao.usuarioId,
      acao: 'LOGOUT_REALIZADO',
    });
  }

  jar.delete(COOKIE_SESSAO);
  return NextResponse.json({ ok: true });
}
