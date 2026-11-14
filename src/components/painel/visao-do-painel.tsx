'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { CabecalhoDePagina } from '@/components/painel/cabecalho-de-pagina';
import { ChaoDaOficina } from '@/components/painel/chao-da-oficina';
import { GraficoFaturamento } from '@/components/painel/grafico-faturamento';
import { Botao } from '@/components/ui/botao';
import { Cartao, CartaoCabecalho, CartaoCorpo } from '@/components/ui/cartao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Etiqueta } from '@/components/ui/etiqueta';
import { Indicador, Medidor } from '@/components/ui/indicador';
import { Placa } from '@/components/ui/placa';
import { Vazio } from '@/components/ui/vazio';
import { CATALOGO_RELACIONAMENTO, type Relacionamento } from '@/domain/cliente';
import { ROTULO_STATUS, type StatusAgendamento } from '@/domain/agendamento';
import { formatarHora, formatarRelativo, m } from '@/domain/shared/tempo';
import { formatarMoeda, formatarQuantidade } from '@/domain/shared/texto';
import { useSessao } from '@/hooks/use-sessao';
import { api, mensagemDeErro } from '@/lib/api';
import { chaves } from '@/lib/chaves';
import type { PainelDados } from '@/server/painel';

const TOM_STATUS: Record<StatusAgendamento, 'acento' | 'informativo' | 'positivo' | 'neutro'> = {
  AGENDADO: 'informativo',
  EM_ANDAMENTO: 'acento',
  CONCLUIDO: 'positivo',
  CANCELADO: 'neutro',
};

export function VisaoDoPainel() {
  const { data: sessao } = useSessao();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: chaves.painel,
    queryFn: async (): Promise<PainelDados> => {
      const resposta = await api.get<PainelDados>('/painel');
      return resposta.data;
    },
  });

  const primeiroNome = sessao?.usuario.nome.split(' ')[0] ?? '';
  const saudacao = (() => {
    const hora = m().hour();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  if (isLoading) {
    return (
      <>
        <CabecalhoDePagina titulo="Painel" descricao="Carregando indicadores..." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <Esqueleto key={indice} className="h-28" />
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Esqueleto className="h-80 lg:col-span-2" />
          <Esqueleto className="h-80" />
        </div>
      </>
    );
  }

  if (isError || data === undefined) {
    return (
      <>
        <CabecalhoDePagina titulo="Painel" />
        <Cartao>
          <Vazio
            icone={AlertTriangle}
            titulo="Não foi possível carregar o painel"
            descricao={mensagemDeErro(error)}
          />
        </Cartao>
      </>
    );
  }

  const podeFinanceiro = sessao?.recursos.includes('FINANCEIRO') ?? false;
  const podeEstoque = sessao?.recursos.includes('ESTOQUE') ?? false;

  const serieGrafico = data.serie.map((item) => ({
    mes: item.mes,
    receita: Number(item.receita),
    despesa: Number(item.despesa),
  }));

  const relacionamentos = Object.entries(data.relacionamento) as Array<[Relacionamento, number]>;

  return (
    <>
      <CabecalhoDePagina
        titulo={`${saudacao}${primeiroNome === '' ? '' : `, ${primeiroNome}`}`}
        descricao={`Visão consolidada de ${m().format('MMMM [de] YYYY')}.`}
        acao={
          <Botao comoFilho variante="acento">
            <Link href="/painel/agenda/novo">
              <CalendarClock />
              Novo atendimento
            </Link>
          </Botao>
        }
      />

      {/* ------------------------------- Chão da oficina ----------------- */}
      <ChaoDaOficina />

      {/* ------------------------------- Indicadores --------------------- */}
      <section aria-label="Indicadores do mês" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          rotulo="Faturamento do mês"
          valor={podeFinanceiro ? formatarMoeda(data.receitaMes) : 'Indisponível'}
          variacao={data.variacaoReceita}
          detalhe={podeFinanceiro ? undefined : 'Disponível no plano Pro'}
          icone={CircleDollarSign}
          tom="acento"
        />
        <Indicador
          rotulo="Resultado do mês"
          valor={podeFinanceiro ? formatarMoeda(data.lucroMes) : 'Indisponível'}
          detalhe={
            podeFinanceiro
              ? data.margem === null
                ? 'Sem margem'
                : `Margem de ${data.margem}%`
              : undefined
          }
          icone={TrendingUp}
          tom={Number(data.lucroMes) >= 0 ? 'positivo' : 'critico'}
        />
        <Indicador
          rotulo="Ticket médio"
          valor={formatarMoeda(data.ticketMedio)}
          detalhe={`${data.atendimentosRecebidosMes} atendimentos recebidos no mês`}
          icone={Receipt}
        />
        <Indicador
          rotulo="Na agenda hoje"
          valor={String(data.atendimentosHoje)}
          detalhe={`${data.atendimentosMes} no mês`}
          icone={CalendarClock}
        />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ----------------------------- Faturamento ---------------------- */}
        <Cartao className="painel-cartao lg:col-span-2" destaque>
          <CartaoCabecalho titulo="Faturamento e despesa" descricao="Últimos seis meses" />
          <CartaoCorpo>
            {!podeFinanceiro ? (
              <Vazio
                icone={CircleDollarSign}
                titulo="Módulo financeiro no plano Pro"
                descricao="Assine o plano Pro para acompanhar receita, despesa e margem."
              />
            ) : (
              <GraficoFaturamento serie={serieGrafico} />
            )}
          </CartaoCorpo>
        </Cartao>

        {/* ----------------------------- Agenda --------------------------- */}
        <Cartao className="painel-cartao">
          <CartaoCabecalho
            titulo="Próximos atendimentos"
            acao={
              <Botao comoFilho variante="fantasma" tamanho="pequeno">
                <Link href="/painel/agenda">
                  Ver agenda
                  <ArrowRight />
                </Link>
              </Botao>
            }
          />
          {data.agendaProxima.length === 0 ? (
            <Vazio
              icone={CalendarClock}
              titulo="Agenda livre"
              descricao="Nenhum atendimento nos próximos sete dias."
            />
          ) : (
            <ul className="divide-y divide-[var(--borda)]">
              {data.agendaProxima.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/painel/agenda/${item.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[var(--superficie-2)]"
                  >
                    <div className="text-center">
                      <p className="numerico text-sm font-semibold text-[var(--acento-ativo)]">
                        {formatarHora(item.dataHora)}
                      </p>
                      <p className="text-[10px] uppercase text-[var(--tinta-tenue)]">
                        {m(item.dataHora).format('DD/MM')}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--tinta)]">
                        {item.clienteNome}
                      </p>
                      <p className="mt-1 flex items-center gap-2 truncate text-xs text-[var(--tinta-tenue)]">
                        <Placa valor={item.veiculoPlaca} />
                        <span className="truncate">{item.veiculoModelo}</span>
                      </p>
                    </div>
                    <Etiqueta tom={TOM_STATUS[item.status as StatusAgendamento]}>
                      {ROTULO_STATUS[item.status as StatusAgendamento]}
                    </Etiqueta>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ----------------------------- Serviços ------------------------- */}
        <Cartao className="painel-cartao lg:col-span-2">
          <CartaoCabecalho titulo="Serviços mais executados" descricao="No mês corrente" />
          {data.servicosMaisVendidos.length === 0 ? (
            <Vazio icone={Receipt} titulo="Nenhum atendimento concluído no mês" />
          ) : (
            <CartaoCorpo className="space-y-3.5">
              {data.servicosMaisVendidos.map((servico, indice) => {
                const maximo = data.servicosMaisVendidos[0]?.quantidade ?? 1;
                const percentual = Math.round((servico.quantidade / maximo) * 100);
                return (
                  <div key={servico.nome}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="truncate text-sm text-[var(--tinta)]">{servico.nome}</span>
                      <span className="numerico shrink-0 text-sm text-[var(--tinta-suave)]">
                        {servico.quantidade}× · {formatarMoeda(servico.valor)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Medidor
                        percentual={percentual}
                        tom={indice === 0 ? 'acento' : 'positivo'}
                        rotulo={servico.nome}
                      />
                    </div>
                  </div>
                );
              })}
            </CartaoCorpo>
          )}
        </Cartao>

        {/* ----------------------------- Relacionamento ------------------- */}
        <Cartao className="painel-cartao">
          <CartaoCabecalho
            titulo="Carteira de clientes"
            descricao={`${data.totalClientes} clientes ativos`}
          />
          <CartaoCorpo>
            {data.despesasCategoria.length > 0 && podeFinanceiro ? (
              <div className="mb-5 border-b border-[var(--borda)] pb-5">
                <p className="rotulo-tecnico mb-3">Despesas por categoria</p>
                <ul className="space-y-3">
                  {(() => {
                    const itens = data.despesasCategoria
                      .map((item) => ({ nome: item.categoria, valor: Number(item.valor) }))
                      .sort((a, b) => b.valor - a.valor);
                    const total = itens.reduce((soma, item) => soma + item.valor, 0);
                    return itens.map((item) => {
                      const parte = total === 0 ? 0 : Math.round((item.valor / total) * 100);
                      return (
                        <li key={item.nome}>
                          <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="truncate text-[var(--tinta)]">{item.nome}</span>
                            <span className="numerico shrink-0 text-[var(--tinta-suave)]">
                              {formatarMoeda(item.valor)} · {parte}%
                            </span>
                          </div>
                          <div className="mt-1.5">
                            <Medidor percentual={parte} tom="acento" rotulo={item.nome} />
                          </div>
                        </li>
                      );
                    });
                  })()}
                </ul>
              </div>
            ) : null}

            <ul className="space-y-2.5">
              {relacionamentos.map(([chave, total]) => {
                const definicao = CATALOGO_RELACIONAMENTO[chave];
                if (definicao === undefined) return null;
                const tom =
                  definicao.tom === 'positivo'
                    ? 'positivo'
                    : definicao.tom === 'atencao'
                      ? 'atencao'
                      : definicao.tom === 'critico'
                        ? 'critico'
                        : 'neutro';
                return (
                  <li key={chave} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--tinta)]">{definicao.rotulo}</p>
                      <p className="truncate text-xs text-[var(--tinta-tenue)]">
                        {definicao.descricao}
                      </p>
                    </div>
                    <Etiqueta tom={tom}>{total}</Etiqueta>
                  </li>
                );
              })}
            </ul>
          </CartaoCorpo>
        </Cartao>
      </div>

      {/* ------------------------------- Estoque ------------------------- */}
      {podeEstoque && data.alertasEstoque.length > 0 ? (
        <Cartao className="painel-cartao mt-4">
          <CartaoCabecalho
            titulo="Estoque abaixo do mínimo"
            descricao="Reponha antes que falte no meio de um atendimento"
            acao={
              <Botao comoFilho variante="fantasma" tamanho="pequeno">
                <Link href="/painel/estoque">
                  Abrir estoque
                  <ArrowRight />
                </Link>
              </Botao>
            }
          />
          <CartaoCorpo className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.alertasEstoque.map((alerta) => (
              <div key={alerta.produtoId} className="superficie-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 truncate text-sm font-medium text-[var(--tinta)]">
                    {alerta.nome}
                  </p>
                  <Package className="size-4 shrink-0 text-[var(--tinta-tenue)]" aria-hidden />
                </div>
                <p className="numerico mt-2 text-lg text-[var(--critico)]">
                  {formatarQuantidade(alerta.quantidadeAtual)}{' '}
                  <span className="text-xs text-[var(--tinta-tenue)]">{alerta.unidadeMedida}</span>
                </p>
                <p className="mb-2 text-xs text-[var(--tinta-tenue)]">
                  Mínimo: {formatarQuantidade(alerta.quantidadeMinima)} {alerta.unidadeMedida}
                </p>
                <Medidor percentual={alerta.percentual} tom="critico" rotulo={alerta.nome} />
              </div>
            ))}
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {podeFinanceiro && Number(data.aReceber) > 0 ? (
        <Cartao className="painel-cartao mt-4">
          <CartaoCorpo className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-[var(--atencao)]" aria-hidden />
              <div>
                <p className="text-sm font-medium text-[var(--tinta)]">Pendente de recebimento</p>
                <p className="text-xs text-[var(--tinta-suave)]">
                  Atendimentos em andamento ou concluídos ainda não pagos
                </p>
              </div>
            </div>
            <p className="numerico text-2xl font-semibold text-[var(--atencao)]">
              {formatarMoeda(data.aReceber)}
            </p>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      <p className="mt-6 text-center text-xs text-[var(--tinta-tenue)]">
        Atualizado {formatarRelativo(new Date())}
      </p>
    </>
  );
}
