'use client';

import {
  ArrowRight,
  BellRing,
  Boxes,
  CalendarClock,
  Check,
  CircleDollarSign,
  Menu,
  PackageCheck,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Marca, Simbolo } from '@/components/marca';
import { Botao } from '@/components/ui/botao';
import { Placa } from '@/components/ui/placa';
import { CATALOGO_PLANOS, ROTULO_RECURSO, type Recurso } from '@/domain/plano';
import { formatarMoeda } from '@/domain/shared/texto';
import './landing.css';

type Estado = 'concluido' | 'andamento' | 'agendado';

interface Ordem {
  id: string;
  box: number;
  inicio: number;
  duracao: number;
  servico: string;
  modelo: string;
  placa: string;
  cliente: string;
  estado: Estado;
  valor: number;
  consumo: string;
}

const HORA_AGORA = 11;
const CAIXA_INICIAL = 1240;

const ORDENS: readonly Ordem[] = [
  { id: 'a', box: 1, inicio: 8.5, duracao: 4, servico: 'Polimento técnico', modelo: 'Golf GTI', placa: 'RTA1B23', cliente: 'André Farias', estado: 'andamento', valor: 980, consumo: 'Composto polidor · 90 ml' },
  { id: 'b', box: 1, inicio: 14, duracao: 1.5, servico: 'Hidratação de couro', modelo: 'Corolla Cross', placa: 'MNO4C56', cliente: 'Lucas Tavares', estado: 'agendado', valor: 220, consumo: 'Hidratante de couro · 60 ml' },
  { id: 'c', box: 2, inicio: 8, duracao: 1.5, servico: 'Lavagem técnica', modelo: 'Civic Touring', placa: 'QRS1A23', cliente: 'Marina Rocha', estado: 'concluido', valor: 140, consumo: 'Shampoo neutro · 120 ml' },
  { id: 'd', box: 2, inicio: 10, duracao: 2, servico: 'Higienização interna', modelo: 'Compass', placa: 'DEF2E34', cliente: 'Gustavo Reis', estado: 'andamento', valor: 470, consumo: 'Limpador de tecidos · 200 ml' },
  { id: 'e', box: 2, inicio: 13.5, duracao: 4, servico: 'Vitrificação cerâmica', modelo: 'BMW 320i', placa: 'ABC1D23', cliente: 'Fernanda Lopes', estado: 'agendado', valor: 1290, consumo: 'Coating cerâmico · 1 un' },
  { id: 'f', box: 3, inicio: 9, duracao: 1, servico: 'Lavagem express', modelo: 'Onix', placa: 'STU7J89', cliente: 'Carla Pires', estado: 'concluido', valor: 70, consumo: 'Shampoo neutro · 80 ml' },
  { id: 'g', box: 3, inicio: 11.5, duracao: 1.5, servico: 'Detalhe de motor', modelo: 'Hilux', placa: 'NOP7T89', cliente: 'Frota Sul', estado: 'agendado', valor: 250, consumo: 'Desengraxante · 150 ml' },
  { id: 'h', box: 3, inicio: 15, duracao: 2, servico: 'Polimento comercial', modelo: 'Creta', placa: 'YZA9L01', cliente: 'Renata Silveira', estado: 'agendado', valor: 550, consumo: 'Composto polidor · 70 ml' },
];

const ROTULO_ESTADO: Record<Estado, string> = {
  concluido: 'Concluído',
  andamento: 'Em andamento',
  agendado: 'Agendado',
};

function hora(h: number): string {
  const inteiro = Math.floor(h);
  const minutos = Math.round((h - inteiro) * 60);
  return `${String(inteiro).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/** Revela cada bloco ao entrar na tela. Sem JS (ou com movimento reduzido), tudo já aparece. */
function useRevelar(raiz: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const el = raiz.current;
    if (el === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    el.classList.add('lp-js');
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add('visto');
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    el.querySelectorAll('.lp-revelar').forEach((no) => observador.observe(no));
    return () => observador.disconnect();
  }, [raiz]);
}

export function Landing() {
  const raiz = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  useRevelar(raiz);

  return (
    <div ref={raiz} className="lp min-h-dvh overflow-x-clip">
      <header className="lp-nav">
        <div className="lp-contem flex h-[68px] items-center justify-between">
          <Link href="/" aria-label="Brilhoflow, início">
            <Marca />
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Seções da página">
            <a href="#como" className="lp-nav-link">
              Como funciona
            </a>
            <a href="#painel" className="lp-nav-link">
              O painel
            </a>
            <a href="#planos" className="lp-nav-link">
              Planos
            </a>
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Botao comoFilho variante="fantasma">
              <Link href="/login">Entrar</Link>
            </Botao>
            <Botao comoFilho variante="solido">
              <Link href="/suporte">
                Pedir acesso <ArrowRight />
              </Link>
            </Botao>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-xl border border-[var(--borda)] bg-[var(--superficie-1)] sm:hidden"
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((atual) => !atual)}
          >
            {menuAberto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuAberto ? (
          <div className="border-t border-[var(--borda)] bg-[var(--superficie-1)] px-5 pb-5 pt-3 sm:hidden">
            <nav className="grid gap-1" aria-label="Menu móvel">
              {(
                [
                  ['Como funciona', '#como'],
                  ['O painel', '#painel'],
                  ['Planos', '#planos'],
                  ['Entrar', '/login'],
                ] as const
              ).map(([rotulo, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuAberto(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[var(--superficie-2)]"
                >
                  {rotulo}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main id="conteudo">
        {/* ------------------------------ Hero ----------------------------- */}
        <section className="lp-hero">
          <div className="lp-contem">
            <h1 className="lp-h1 lp-entra" style={{ '--i': 0 } as React.CSSProperties}>
              A agenda cheia e o caixa em ordem.
            </h1>
            <p className="lp-sub lp-entra" style={{ '--i': 1 } as React.CSSProperties}>
              O Brilhoflow organiza agenda por box, estoque de produto e financeiro da sua estética
              automotiva em um painel só.
            </p>
            <div
              className="lp-entra mt-8 flex flex-wrap items-center gap-3"
              style={{ '--i': 2 } as React.CSSProperties}
            >
              <Botao comoFilho variante="acento" tamanho="grande">
                <Link href="/suporte">
                  Pedir acesso <ArrowRight />
                </Link>
              </Botao>
              <Botao comoFilho variante="contorno" tamanho="grande">
                <a href="#como">Ver como funciona</a>
              </Botao>
            </div>
            <ul
              className="lp-entra mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--tinta-suave)]"
              style={{ '--i': 3 } as React.CSSProperties}
            >
              {[
                'Cada empresa vê só os próprios dados',
                'Funciona no celular e no computador',
                'Sem taxa por atendimento',
              ].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-4 text-[var(--positivo)]" aria-hidden /> {item}
                </li>
              ))}
            </ul>

            <div className="lp-entra mt-12" style={{ '--i': 4 } as React.CSSProperties}>
              <LinhaDoTempo />
            </div>
          </div>
        </section>

        {/* --------------------------- Como funciona ----------------------- */}
        <section id="como" className="lp-secao lp-faixa-cor scroll-mt-16">
          <div className="lp-contem">
            <div className="lp-revelar">
              <h2 className="lp-h2">Uma ação entra. O resto acompanha.</h2>
              <p className="lp-texto mt-4">
                Do agendamento ao caixa, nada é digitado duas vezes: o que acontece no box vira
                histórico, consumo de produto e receita.
              </p>
            </div>
            <ol className="lp-passos mt-12">
              <Passo i={0} icone={CalendarClock} titulo="Agende" texto="Cliente, carro, serviços e box. O sistema avisa se o horário já está ocupado.">
                <div className="lp-mini-linha">
                  <Placa valor="RTA1B23" />
                  <span className="font-semibold">09:30</span>
                </div>
                <div className="lp-mini-linha text-[var(--tinta-tenue)]">
                  <span>Polimento técnico</span>
                  <span>4 h</span>
                </div>
              </Passo>
              <Passo i={1} icone={Users} titulo="Atenda" texto="O histórico do carro e do cliente aparece na bancada, antes de começar.">
                <div className="lp-mini-linha">
                  <span className="font-semibold">Golf GTI</span>
                  <span className="rounded-full bg-[var(--acento-fraco)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--acento-ativo)]">
                    Em andamento
                  </span>
                </div>
                <div className="lp-mini-linha text-[var(--tinta-tenue)]">
                  <span>Última visita</span>
                  <span>há 38 dias</span>
                </div>
              </Passo>
              <Passo i={2} icone={PackageCheck} titulo="Baixe o produto" texto="Ao concluir, o consumo informado sai do estoque e o alerta de reposição se atualiza.">
                <div className="lp-mini-linha">
                  <span>Shampoo neutro</span>
                  <span className="font-semibold">− 120 ml</span>
                </div>
                <div className="lp-mini-barra mt-2">
                  <i style={{ '--v': 0.62 } as React.CSSProperties} />
                </div>
              </Passo>
              <Passo i={3} icone={CircleDollarSign} titulo="Receba" texto="Pagamento à vista ou parcelado vira receita. O resultado do mês se atualiza sozinho.">
                <div className="lp-mini-linha">
                  <span>Crédito 3×</span>
                  <span className="font-semibold">R$ 326,67</span>
                </div>
                <div className="lp-mini-linha text-[var(--positivo)]">
                  <span>1ª parcela recebida</span>
                  <Check className="size-4" aria-hidden />
                </div>
              </Passo>
            </ol>
          </div>
        </section>

        {/* ------------------------------ Painel --------------------------- */}
        <section id="painel" className="lp-secao scroll-mt-16">
          <div className="lp-contem">
            <div className="lp-revelar">
              <h2 className="lp-h2">O que você precisa ver, sem procurar.</h2>
              <p className="lp-texto mt-4">
                Cada tela mostra o que importa naquele momento. O resto fica a um clique.
              </p>
            </div>
            <div className="lp-bento mt-12">
              <article className="lp-cartao lp-b-1 lp-revelar">
                <h3>Faturamento e resultado</h3>
                <p>Receita, despesa e margem dos últimos meses, com o ticket médio do que foi recebido.</p>
                <div className="lp-barras" aria-hidden>
                  {[38, 52, 46, 64, 58, 82].map((h, k) => (
                    <i key={k} style={{ '--h': `${h}%`, '--k': k } as React.CSSProperties} />
                  ))}
                </div>
              </article>
              <article className="lp-cartao lp-b-2 lp-revelar" style={{ '--i': 1 } as React.CSSProperties}>
                <h3>Estoque sob controle</h3>
                <p>Alerta antes de faltar.</p>
                <div className="mt-5 space-y-3 text-sm">
                  {(
                    [
                      ['Shampoo neutro', 0.62, 'var(--positivo)'],
                      ['Cera sintética', 0.28, 'var(--atencao)'],
                      ['Microfibra', 0.14, 'var(--critico)'],
                    ] as const
                  ).map(([nome, nivel, cor]) => (
                    <div key={nome}>
                      <div className="mb-1 flex justify-between">
                        <span>{nome}</span>
                        <span className="text-[var(--tinta-tenue)]">{Math.round(nivel * 100)}%</span>
                      </div>
                      <div className="lp-mini-barra">
                        <i style={{ '--v': nivel, background: cor } as React.CSSProperties} />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
              <article className="lp-cartao lp-b-3 lp-revelar">
                <h3>Clientes que voltam</h3>
                <p>Quem está em risco de sumir aparece antes de sumir.</p>
                <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-[var(--positivo-fraco)] px-3 py-1 text-[var(--positivo)]">24 ativos</span>
                  <span className="rounded-full bg-[var(--atencao-fraco)] px-3 py-1 text-[var(--atencao)]">7 em risco</span>
                  <span className="rounded-full bg-[var(--critico-fraco)] px-3 py-1 text-[var(--critico)]">3 inativos</span>
                </div>
              </article>
              <article className="lp-cartao lp-b-4 lp-revelar" style={{ '--i': 1 } as React.CSSProperties}>
                <h3>Cada carro, o histórico completo</h3>
                <p>Serviços, valores e recebimentos por veículo e por cliente, na mesma ficha.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ['RTA1B23', 'Golf GTI', '12 atendimentos'],
                    ['QRS1A23', 'Civic Touring', '8 atendimentos'],
                  ].map(([placa, modelo, n]) => (
                    <div key={placa} className="flex items-center gap-3 rounded-xl bg-[var(--superficie-2)] p-3">
                      <Placa valor={placa ?? ''} />
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-semibold">{modelo}</p>
                        <p className="text-xs text-[var(--tinta-tenue)]">{n}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ------------------------------ Planos --------------------------- */}
        <section id="planos" className="lp-secao lp-faixa-cor scroll-mt-16">
          <div className="lp-contem">
            <div className="lp-revelar">
              <h2 className="lp-h2">Comece pela rotina. Cresça quando precisar.</h2>
              <p className="lp-texto mt-4">
                Dois planos. A troca preserva todo o histórico.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {(['BASICO', 'COMPLETO'] as const).map((chave, k) => {
                const plano = CATALOGO_PLANOS[chave];
                const destaque = chave === 'COMPLETO';
                const lista = [...plano.recursos];
                const exibidos = destaque ? lista : lista.slice(0, 6);
                return (
                  <article
                    key={chave}
                    data-destaque={destaque}
                    className="lp-plano lp-revelar"
                    style={{ '--i': k } as React.CSSProperties}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">{plano.nome}</h3>
                      {destaque ? (
                        <span className="rounded-full bg-[var(--acento)] px-3 py-1 text-xs font-bold text-[var(--acento-texto)]">
                          Mais escolhido
                        </span>
                      ) : null}
                    </div>
                    <p className="lp-plano-mudo mt-2 min-h-11 text-sm leading-relaxed">{plano.descricao}</p>
                    <p className="lp-plano-mudo mt-6 text-sm">
                      de <s>{formatarMoeda(plano.valorMensalTabela)}</s> por
                    </p>
                    <p className="mt-1">
                      <span className="lp-preco">{formatarMoeda(plano.valorMensalPadrao)}</span>
                      <span className="lp-plano-mudo ml-1 text-sm">/ mês</span>
                    </p>
                    <p className="lp-plano-mudo mt-2 text-sm">
                      Até {plano.limiteUsuarios} usuários ativos
                    </p>
                    <p className="mt-6 text-sm font-semibold">
                      {destaque ? 'Tudo do Básico, mais:' : 'Inclui:'}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {exibidos.map((recurso: Recurso) => (
                        <li key={recurso} className="flex items-start gap-2.5 text-sm">
                          <Check className="mt-0.5 size-4 shrink-0 text-[var(--positivo)]" aria-hidden />
                          {ROTULO_RECURSO[recurso]}
                        </li>
                      ))}
                    </ul>
                    <Botao
                      comoFilho
                      tamanho="grande"
                      variante={destaque ? 'acento' : 'contorno'}
                      className="mt-8 w-full"
                    >
                      <Link href="/suporte">
                        Quero este plano <ArrowRight />
                      </Link>
                    </Botao>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------ Final ---------------------------- */}
        <section className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <div className="lp-final lp-revelar mx-auto max-w-[1200px]">
            <Simbolo className="mx-auto size-12" />
            <h2 className="mx-auto mt-6 max-w-[16ch] font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.02] tracking-[-0.04em] sm:text-5xl">
              Coloque o próximo carro na agenda.
            </h2>
            <p className="mx-auto mt-4 max-w-md opacity-70">
              Peça o acesso e comece pelo que já está no seu caderno.
            </p>
            <Botao comoFilho variante="acento" tamanho="grande" className="mt-8">
              <Link href="/suporte">
                Pedir acesso <ArrowRight />
              </Link>
            </Botao>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--borda)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 text-sm text-[var(--tinta-suave)] sm:flex-row sm:items-center sm:justify-between">
          <Marca compacta />
          <p>Brilhoflow · gestão para estética automotiva.</p>
          <Link href="/suporte" className="font-medium hover:text-[var(--tinta)]">
            Falar com o suporte
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Passo({
  i,
  icone: Icone,
  titulo,
  texto,
  children,
}: {
  i: number;
  icone: typeof Boxes;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <li className="lp-passo lp-revelar" style={{ '--i': i } as React.CSSProperties}>
      <Icone className="size-5 text-[var(--acento-ativo)]" aria-hidden />
      <h3 className="mt-3">{titulo}</h3>
      <p>{texto}</p>
      <div className="lp-passo-cena" aria-hidden>
        {children}
      </div>
    </li>
  );
}

/**
 * A assinatura do produto: o dia dos boxes. Escolha uma ordem de serviço e
 * receba o pagamento: o caixa do dia reage na hora.
 */
function LinhaDoTempo() {
  const [selecionada, setSelecionada] = useState<string>('a');
  const [recebidas, setRecebidas] = useState<ReadonlySet<string>>(new Set());

  const ordem = ORDENS.find((o) => o.id === selecionada) ?? ORDENS[0];
  const caixa = ORDENS.filter((o) => recebidas.has(o.id)).reduce(
    (total, o) => total + o.valor,
    CAIXA_INICIAL,
  );

  const receber = (id: string) =>
    setRecebidas((atual) => {
      const proximo = new Set(atual);
      proximo.add(id);
      return proximo;
    });

  if (ordem === undefined) return null;
  const paga = recebidas.has(ordem.id);

  return (
    <div className="lp-linha">
      <div className="lp-linha-topo">
        <div>
          <p className="text-sm font-semibold">Hoje nos boxes</p>
          <p className="text-xs text-[var(--tinta-tenue)]">Toque em uma ordem de serviço</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--tinta-tenue)]">Caixa do dia</p>
          <p className="lp-caixa-valor text-xl" aria-live="polite">
            {formatarMoeda(caixa)}
          </p>
        </div>
      </div>

      <div className="lp-rolagem">
        <div className="lp-grade" style={{ '--hora-agora': HORA_AGORA } as React.CSSProperties}>
          <div className="lp-horas" aria-hidden>
            <span />
            <div className="lp-horas-trilho">
              {Array.from({ length: 10 }, (_, k) => (
                <span key={k}>{String(8 + k).padStart(2, '0')}h</span>
              ))}
            </div>
          </div>
          {[1, 2, 3].map((box) => (
            <div key={box} className="lp-box">
              <span className="lp-box-nome">Box {box}</span>
              <div className="lp-pista">
                {ORDENS.filter((o) => o.box === box).map((o, n) => (
                  <button
                    key={o.id}
                    type="button"
                    className="lp-bloco"
                    data-estado={o.estado}
                    data-pago={recebidas.has(o.id)}
                    aria-pressed={selecionada === o.id}
                    aria-label={`${o.servico}, ${o.modelo}, ${hora(o.inicio)} às ${hora(o.inicio + o.duracao)}, ${ROTULO_ESTADO[o.estado]}`}
                    onClick={() => setSelecionada(o.id)}
                    style={
                      {
                        '--ini': o.inicio,
                        '--dur': o.duracao,
                        '--n': box * 2 + n,
                      } as React.CSSProperties
                    }
                  >
                    <strong>{o.servico}</strong>
                    <small>
                      {o.modelo} · {o.placa}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="lp-agora" aria-hidden />
        </div>
      </div>

      <div key={ordem.id} className="lp-ordem lp-ordem-troca">
        <Placa valor={ordem.placa} grande />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">
            {ordem.servico} · {ordem.modelo}
          </p>
          <p className="text-[var(--tinta-tenue)]">
            {ordem.cliente} · {hora(ordem.inicio)} às {hora(ordem.inicio + ordem.duracao)} ·{' '}
            {ROTULO_ESTADO[ordem.estado]}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--tinta-suave)]">
            <PackageCheck className="size-3.5" aria-hidden /> Baixa no estoque: {ordem.consumo}
          </p>
        </div>
        {paga ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--positivo-fraco)] px-4 py-2 text-sm font-semibold text-[var(--positivo)]">
            <BellRing className="size-4" aria-hidden /> Recebido {formatarMoeda(ordem.valor)}
          </p>
        ) : (
          <Botao type="button" variante="acento" onClick={() => receber(ordem.id)}>
            Receber {formatarMoeda(ordem.valor)}
          </Botao>
        )}
      </div>
    </div>
  );
}
