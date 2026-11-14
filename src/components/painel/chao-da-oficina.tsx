'use client';

import { CalendarClock, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Botao } from '@/components/ui/botao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Placa } from '@/components/ui/placa';
import { formatarHora } from '@/domain/shared/tempo';
import { useAgenda, useProfissionais } from '@/hooks/use-agenda';
import type { FiltroAgenda } from '@/schemas';
import type { AgendamentoDaLista } from '@/server/agenda';
import './chao-da-oficina.css';

// Mesmo filtro do prefetch e da agenda do dia: o cache já vem quente.
const FILTRO_DO_DIA: FiltroAgenda = { periodo: 'DIA', pago: 'todos', busca: '' };
const CIRCUNFERENCIA = 2 * Math.PI * 42;

interface Trilha {
  chave: string;
  nome: string;
  atendimentos: AgendamentoDaLista[];
}

function cronometro(segundos: number): string {
  const h = Math.floor(segundos / 3600);
  const min = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  return `${h}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function duracaoCurta(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (h === 0) return `${min} min`;
  return min === 0 ? `${h}h` : `${h}h${String(min).padStart(2, '0')}`;
}

/** Relógio de 1 s que só roda enquanto há algo em andamento. */
function useAgora(ativo: boolean): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return;
    setAgora(Date.now());
    const relogio = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(relogio);
  }, [ativo]);
  return agora;
}

/**
 * Chão da oficina: em vez de uma tabela, um cartão por profissional com o carro
 * que ele atende agora. O tempo decorrido é medido a partir do horário
 * agendado, porque o sistema não registra a hora real de início.
 */
export function ChaoDaOficina() {
  const { data: agenda, isLoading } = useAgenda(FILTRO_DO_DIA);
  const { data: profissionais } = useProfissionais();

  const trilhas = useMemo<Trilha[]>(() => {
    const ativos = (agenda?.itens ?? []).filter((item) => item.status !== 'CANCELADO');
    const porResponsavel = new Map<number | null, AgendamentoDaLista[]>();
    for (const item of ativos) {
      const lista = porResponsavel.get(item.responsavelId) ?? [];
      lista.push(item);
      porResponsavel.set(item.responsavelId, lista);
    }
    const ordenar = (lista: AgendamentoDaLista[]) =>
      [...lista].sort((a, b) => a.dataHora.localeCompare(b.dataHora));

    const resultado: Trilha[] = (profissionais ?? []).map((pessoa) => ({
      chave: `p${pessoa.id}`,
      nome: pessoa.nome.split(' ')[0] ?? pessoa.nome,
      atendimentos: ordenar(porResponsavel.get(pessoa.id) ?? []),
    }));
    const semResponsavel = porResponsavel.get(null);
    if (semResponsavel !== undefined) {
      resultado.push({ chave: 'sem', nome: 'Sem responsável', atendimentos: ordenar(semResponsavel) });
    }
    return resultado;
  }, [agenda, profissionais]);

  const todos = useMemo(
    () => trilhas.flatMap((trilha) => trilha.atendimentos),
    [trilhas],
  );
  const emAndamento = todos.filter((item) => item.status === 'EM_ANDAMENTO').length;
  const concluidos = todos.filter((item) => item.status === 'CONCLUIDO').length;
  const aguardando = todos.filter((item) => item.status === 'AGENDADO').length;

  const agora = useAgora(emAndamento > 0);
  const [anelMontado, setAnelMontado] = useState(false);
  useEffect(() => {
    // Os anéis nascem vazios e crescem até o valor: o gesto de "carregar".
    const quadro = window.setTimeout(() => setAnelMontado(true), 120);
    return () => window.clearTimeout(quadro);
  }, []);

  if (isLoading) return <Esqueleto className="mb-4 h-72" />;

  if (todos.length === 0) {
    return (
      <section
        aria-label="Chão da oficina"
        className="superficie mb-4 flex flex-wrap items-center justify-between gap-4 px-5 py-4"
      >
        <div className="flex items-center gap-3">
          <CalendarClock className="size-5 text-[var(--tinta-tenue)]" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Nenhum atendimento para hoje</p>
            <p className="text-xs text-[var(--tinta-suave)]">
              Quando houver atendimentos, cada profissional aparece aqui com o carro que atende.
            </p>
          </div>
        </div>
        <Botao comoFilho variante="contorno" tamanho="medio">
          <Link href="/painel/agenda/novo">Agendar atendimento</Link>
        </Botao>
      </section>
    );
  }

  return (
    <section aria-labelledby="chao-titulo" className="mb-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="chao-titulo"
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-[-0.03em]"
          >
            Hoje na oficina
          </h2>
          <p className="chao-resumo mt-1">
            <span>
              <b>{emAndamento}</b> em andamento
            </span>
            <span>
              <b>{aguardando}</b> aguardando
            </span>
            <span>
              <b>{concluidos}</b> concluídos
            </span>
          </p>
        </div>
        <Botao comoFilho variante="fantasma" tamanho="pequeno">
          <Link href="/painel/agenda">Abrir agenda</Link>
        </Botao>
      </div>

      <ul className="chao-grade">
        {trilhas.map((trilha) => {
          const atual = trilha.atendimentos.find((item) => item.status === 'EM_ANDAMENTO');
          const proximo = trilha.atendimentos.find(
            (item) => item.status === 'AGENDADO' && item.id !== atual?.id,
          );
          const decorrido =
            atual === undefined
              ? 0
              : Math.max(0, Math.floor((agora - new Date(atual.dataHora).getTime()) / 1000));
          const previsto = atual === undefined ? 0 : atual.duracaoMinutos * 60;
          const fracao = previsto === 0 ? 0 : Math.min(1, decorrido / previsto);
          const estourou = atual !== undefined && previsto > 0 && decorrido > previsto;
          const quem = atual ?? proximo;

          return (
            <li key={trilha.chave} className="superficie chao-cartao">
              <div className="chao-topo">
                <span>{trilha.nome}</span>
                {atual !== undefined ? (
                  <span>
                    <i className="chao-vivo" aria-hidden />
                    Em andamento
                  </span>
                ) : (
                  <span className="text-[var(--tinta-tenue)]">Livre</span>
                )}
              </div>

              <div className="chao-anel" data-estourou={estourou}>
                <svg viewBox="0 0 100 100" aria-hidden>
                  <circle className="trilha" cx="50" cy="50" r="42" />
                  <circle
                    className="prog"
                    cx="50"
                    cy="50"
                    r="42"
                    strokeDasharray={CIRCUNFERENCIA}
                    strokeDashoffset={anelMontado ? CIRCUNFERENCIA * (1 - fracao) : CIRCUNFERENCIA}
                  />
                </svg>
                <div>
                  {atual !== undefined ? (
                    <>
                      <b>{cronometro(decorrido)}</b>
                      <small>
                        {estourou ? 'além do previsto · ' : 'de '}
                        {duracaoCurta(atual.duracaoMinutos)}
                      </small>
                    </>
                  ) : (
                    <>
                      <UserRound className="mx-auto size-6 text-[var(--tinta-tenue)]" aria-hidden />
                      <small>sem carro agora</small>
                    </>
                  )}
                </div>
              </div>

              <div className="mx-auto" style={{ opacity: atual === undefined ? 0.5 : 1 }}>
                {quem !== undefined ? <Placa valor={quem.veiculoPlaca} /> : <Placa valor="— — —" />}
              </div>

              <div className="chao-nome">
                {quem !== undefined ? (
                  <>
                    <b>
                      {atual === undefined ? 'Próximo: ' : ''}
                      {quem.servicos[0]?.nome ?? 'Atendimento'}
                    </b>
                    <small>
                      {quem.veiculoModelo} · {quem.clienteNome}
                    </small>
                  </>
                ) : (
                  <b className="text-[var(--tinta-tenue)]">Nada agendado</b>
                )}
              </div>

              <div className="chao-depois">
                <span>{atual === undefined ? 'Início' : 'Depois'}</span>
                <span>
                  {atual === undefined
                    ? quem === undefined
                      ? '—'
                      : formatarHora(quem.dataHora)
                    : proximo === undefined
                      ? 'Nada agendado'
                      : `${formatarHora(proximo.dataHora)} · ${proximo.servicos[0]?.nome ?? 'Atendimento'}`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
