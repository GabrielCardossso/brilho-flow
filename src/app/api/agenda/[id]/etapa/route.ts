import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ETAPAS_QUADRO } from '@/domain/agendamento';
import { comContexto, lerCorpo, lerId } from '@/server/api';
import { moverEtapa } from '@/server/agenda';

export const runtime = 'nodejs';

const schema = z.object({ etapa: z.enum(ETAPAS_QUADRO) });

/** Move o cartão do quadro do dia para outra etapa. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numero = lerId(id);
  if (numero === null) return NextResponse.json({ erro: { mensagem: 'Id inválido.' } }, { status: 400 });
  const corpo = await lerCorpo(request, schema);
  if (!corpo.ok) return corpo.resposta;
  return comContexto((contexto) => moverEtapa(contexto, numero, corpo.dados.etapa));
}
