'use client';

import { ArrowLeft, ArrowRight, CalendarClock, CircleDollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CabecalhoDePagina } from '@/components/painel/cabecalho-de-pagina';
import { Botao } from '@/components/ui/botao';
import { Selecao } from '@/components/ui/campo';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Etiqueta } from '@/components/ui/etiqueta';
import { Placa } from '@/components/ui/placa';
import { Vazio } from '@/components/ui/vazio';
import {
  avaliarMovimento,
  DESCRICAO_ETAPA,
  ETAPAS_QUADRO,
  ROTULO_ETAPA,
  STATUS_DA_ETAPA,
  type EtapaQuadro,
} from '@/domain/agendamento';
import { formatarHora } from '@/domain/shared/tempo';
import { useAgenda, useMoverEtapa, useProfissionais } from '@/hooks/use-agenda';
import type { FiltroAgenda } from '@/schemas';
import type { AgendamentoDaLista } from '@/server/agenda';
import { cn } from '@/lib/utils';

// Mesmo filtro da agenda do dia e do painel: o cache já vem quente.
const FILTRO_DO_DIA: FiltroAgenda = { periodo: 'DIA', pago: 'todos', busca: '' };

/** Cor de cada etapa na faixa do topo da coluna. */
const COR_DA_ETAPA: Readonly<Record<EtapaQuadro, string>> = {
  AGUARDANDO_CARRO: 'var(--tinta-tenue)',
  NA_FILA: 'var(--informativo)',
  EM_ANDAMENTO: 'var(--acento)',
  FINALIZACAO: 'var(--acento)',
  REVISAO: 'var(--atencao)',
  AVISAR_CLIENTE: 'var(--positivo)',
  ENTREGUE: 'var(--positivo)',
};

function proximaEtapa(etapa: EtapaQuadro): EtapaQuadro | null {
  return ETAPAS_QUADRO[ETAPAS_QUADRO.indexOf(etapa) + 1] ?? null;
}

/** Só se volta dentro do mesmo status: iniciado não vira agendado, concluído não reabre. */
function etapaAnterior(etapa: EtapaQuadro): EtapaQuadro | null {
  const anterior = ETAPAS_QUADRO[ETAPAS_QUADRO.indexOf(etapa) - 1];
  if (anterior === undefined) return null;
  return STATUS_DA_ETAPA[anterior] === STATUS_DA_ETAPA[etapa] ? anterior : null;
}

function nomeDosServicos(item: AgendamentoDaLista): string {
  const nomes = item.servicos.map((servico) => servico.nome);
  if (nomes.length === 0) return 'Atendimento';
  return nomes.length <= 2 ? nomes.join(' + ') : `${nomes[0] ?? ''} + ${nomes.length - 1} serviços`;
}

function duracaoCurta(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const min = minutos % 60;
  if (h === 0) return `${min} min`;
  return min === 0 ? `${h}h` : `${h}h${String(min).padStart(2, '0')}`;
}

export function QuadroDoDia() {
  const { data, isLoading } = useAgenda(FILTRO_DO_DIA);
  const { data: profissionais } = useProfissionais();
  const mover = useMoverEtapa();
  const [responsavel, setResponsavel] = useState<string>('todos');
  const [arrastando, setArrastando] = useState<AgendamentoDaLista | null>(null);
  const [sobre, setSobre] = useState<EtapaQuadro | null>(null);
  const [aviso, setAviso] = useState('');

  const itens = useMemo(() => {
    const lista = (data?.itens ?? []).filter((item) => item.etapa !== null);
    if (responsavel === 'todos') return lista;
    if (responsavel === 'sem') return lista.filter((item) => item.responsavelId === null);
    return lista.filter((item) => String(item.responsavelId) === responsavel);
  }, [data, responsavel]);

  const porEtapa = useMemo(() => {
    const mapa = new Map<EtapaQuadro, AgendamentoDaLista[]>();
    for (const etapa of ETAPAS_QUADRO) mapa.set(etapa, []);
    for (const item of itens) {
      if (item.etapa !== null) mapa.get(item.etapa)?.push(item);
    }
    return mapa;
  }, [itens]);

  const pedirMovimento = (item: AgendamentoDaLista, destino: EtapaQuadro) => {
    if (item.etapa === destino) return;
    const avaliacao = avaliarMovimento(item.status, destino);
    if (!avaliacao.ok) {
      toast.error(avaliacao.error.mensagem);
      return;
    }
    mover.mutate(
      { id: item.id, etapa: destino },
      {
        onSuccess: () => setAviso(`${item.veiculoPlaca} movido para ${ROTULO_ETAPA[destino]}.`),
      },
    );
  };

  const soltarEm = (destino: EtapaQuadro) => {
    const item = arrastando;
    setArrastando(null);
    setSobre(null);
    if (item !== null) pedirMovimento(item, destino);
  };

  const total = itens.length;

  return (
    <>
      <CabecalhoDePagina
        titulo="Quadro do dia"
        descricao="Os atendimentos de hoje, do carro que ainda não chegou até a entrega. Arraste um cartão ou use os botões para avançar."
        acao={
          <>
            <Selecao
              aria-label="Filtrar por profissional"
              value={responsavel}
              onChange={(evento) => setResponsavel(evento.target.value)}
            >
              <option value="todos">Todos os profissionais</option>
              {(profissionais ?? []).map((pessoa) => (
                <option key={pessoa.id} value={String(pessoa.id)}>
                  {pessoa.nome}
                </option>
              ))}
              <option value="sem">Sem responsável</option>
            </Selecao>
            <Botao comoFilho variante="acento">
              <Link href="/painel/agenda/novo">
                <CalendarClock />
                Novo atendimento
              </Link>
            </Botao>
          </>
        }
      />

      <p role="status" aria-live="polite" className="sr-only">
        {aviso}
      </p>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }, (_, indice) => (
            <Esqueleto key={indice} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      ) : total === 0 ? (
        <div className="superficie">
          <Vazio
            icone={CalendarClock}
            titulo="Nenhum atendimento para hoje"
            descricao="Quando houver atendimentos agendados para hoje, eles aparecem aqui, organizados por etapa."
            acao={
              <Botao comoFilho variante="acento">
                <Link href="/painel/agenda/novo">Agendar atendimento</Link>
              </Botao>
            }
          />
        </div>
      ) : (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 max-sm:snap-mandatory sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {ETAPAS_QUADRO.map((etapa) => {
            const cartoes = porEtapa.get(etapa) ?? [];
            const valida =
              arrastando !== null &&
              arrastando.etapa !== etapa &&
              avaliarMovimento(arrastando.status, etapa).ok;
            const bloqueada = arrastando !== null && !valida && arrastando.etapa !== etapa;
            return (
              <section
                key={etapa}
                aria-labelledby={`etapa-${etapa}`}
                onDragOver={(evento) => {
                  if (!valida) return;
                  evento.preventDefault();
                  evento.dataTransfer.dropEffect = 'move';
                  setSobre(etapa);
                }}
                onDragLeave={() => setSobre((atual) => (atual === etapa ? null : atual))}
                onDrop={(evento) => {
                  evento.preventDefault();
                  soltarEm(etapa);
                }}
                className={cn(
                  'superficie flex w-[82vw] max-w-72 shrink-0 snap-start flex-col overflow-hidden sm:w-72 transition-[opacity,box-shadow] duration-[var(--duracao-media)]',
                  bloqueada && 'opacity-50',
                  sobre === etapa && 'ring-2 ring-[var(--acento)]',
                )}
              >
                <span aria-hidden className="h-1 w-full" style={{ background: COR_DA_ETAPA[etapa] }} />
                <header className="border-b border-[var(--borda)] px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 id={`etapa-${etapa}`} className="text-sm font-semibold text-[var(--tinta)]">
                      {ROTULO_ETAPA[etapa]}
                    </h2>
                    <span className="numerico grid min-w-6 place-items-center rounded-full bg-[var(--superficie-3)] px-2 text-xs font-semibold text-[var(--tinta-suave)]">
                      {cartoes.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--tinta-tenue)]">{DESCRICAO_ETAPA[etapa]}</p>
                </header>

                <ul className="flex min-h-40 flex-1 flex-col gap-3 p-3">
                  {cartoes.length === 0 ? (
                    <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-[var(--borda)] px-3 py-6 text-center text-xs text-[var(--tinta-tenue)]">
                      Nenhum atendimento nesta etapa
                    </li>
                  ) : (
                    cartoes.map((item) => (
                      <Cartao
                        key={item.id}
                        item={item}
                        etapa={etapa}
                        arrastado={arrastando?.id === item.id}
                        aoComecarArrasto={() => setArrastando(item)}
                        aoTerminarArrasto={() => {
                          setArrastando(null);
                          setSobre(null);
                        }}
                        aoMover={(destino) => pedirMovimento(item, destino)}
                      />
                    ))
                  )}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Cartao({
  item,
  etapa,
  arrastado,
  aoComecarArrasto,
  aoTerminarArrasto,
  aoMover,
}: {
  item: AgendamentoDaLista;
  etapa: EtapaQuadro;
  arrastado: boolean;
  aoComecarArrasto: () => void;
  aoTerminarArrasto: () => void;
  aoMover: (destino: EtapaQuadro) => void;
}) {
  const proxima = proximaEtapa(etapa);
  const anterior = etapaAnterior(etapa);
  const concluindo = proxima !== null && STATUS_DA_ETAPA[proxima] === 'CONCLUIDO' && item.status !== 'CONCLUIDO';
  const iniciando = item.status === 'AGENDADO' && proxima === 'EM_ANDAMENTO';
  const nomeCompleto = `${item.veiculoPlaca}, ${nomeDosServicos(item)}`;

  return (
    <li
      draggable
      onDragStart={(evento) => {
        evento.dataTransfer.effectAllowed = 'move';
        evento.dataTransfer.setData('text/plain', String(item.id));
        aoComecarArrasto();
      }}
      onDragEnd={aoTerminarArrasto}
      className={cn(
        'cursor-grab rounded-xl border border-[var(--borda)] bg-[var(--superficie-2)] p-3 transition-[opacity,transform,border-color] duration-[var(--duracao-curta)] active:cursor-grabbing',
        'hover:border-[var(--borda-forte)]',
        arrastado && 'opacity-40',
      )}
    >
      <Link
        href={`/painel/agenda/${item.id}`}
        draggable={false}
        aria-label={`Abrir atendimento ${nomeCompleto}`}
        className="block rounded-lg outline-offset-4"
      >
        <div className="flex items-start justify-between gap-2">
          <Placa valor={item.veiculoPlaca} />
          {item.pago ? (
            <Etiqueta tom="positivo">Pago</Etiqueta>
          ) : item.status !== 'AGENDADO' ? (
            <Etiqueta tom="atencao">
              <CircleDollarSign className="size-3" aria-hidden />A receber
            </Etiqueta>
          ) : null}
        </div>
        <p className="mt-2.5 text-sm font-semibold leading-snug text-[var(--tinta)]">
          {nomeDosServicos(item)}
        </p>
        <p className="mt-0.5 truncate text-xs text-[var(--tinta-suave)]">
          {item.veiculoModelo} · {item.clienteNome}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--tinta-tenue)]">
          <Clock className="size-3.5" aria-hidden />
          {formatarHora(item.dataHora)} · {duracaoCurta(item.duracaoMinutos)}
          {item.responsavelNome !== null ? ` · ${item.responsavelNome.split(' ')[0] ?? ''}` : ''}
        </p>
      </Link>

      {anterior !== null || proxima !== null ? (
        <div className="mt-3 flex items-center gap-2 border-t border-[var(--borda)] pt-3">
          {anterior !== null ? (
            <Botao
              variante="fantasma"
              tamanho="iconePequeno"
              aria-label={`Voltar ${nomeCompleto} para ${ROTULO_ETAPA[anterior]}`}
              title={`Voltar para ${ROTULO_ETAPA[anterior]}`}
              onClick={() => aoMover(anterior)}
            >
              <ArrowLeft />
            </Botao>
          ) : null}
          {proxima !== null ? (
            concluindo ? (
              <Botao comoFilho variante="contorno" tamanho="pequeno" className="flex-1">
                <Link href={`/painel/agenda/${item.id}`}>
                  Concluir atendimento
                  <ArrowRight />
                </Link>
              </Botao>
            ) : (
              <Botao
                variante="acento"
                tamanho="pequeno"
                className="flex-1"
                aria-label={`Mover ${nomeCompleto} para ${ROTULO_ETAPA[proxima]}`}
                onClick={() => aoMover(proxima)}
              >
                {iniciando ? 'Iniciar atendimento' : ROTULO_ETAPA[proxima]}
                <ArrowRight />
              </Botao>
            )
          ) : null}
        </div>
      ) : item.status === 'CONCLUIDO' && !item.pago ? (
        <div className="mt-3 border-t border-[var(--borda)] pt-3">
          <Botao comoFilho variante="contorno" tamanho="pequeno" className="w-full">
            <Link href={`/painel/agenda/${item.id}`}>Receber pagamento</Link>
          </Botao>
        </div>
      ) : null}
    </li>
  );
}
