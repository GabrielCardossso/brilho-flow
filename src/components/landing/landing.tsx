'use client';

import {
  ArrowRight,
  CalendarClock,
  Check,
  CircleDollarSign,
  Menu,
  PackageCheck,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { Marca, Simbolo } from '@/components/marca';
import { Botao } from '@/components/ui/botao';
import { Placa } from '@/components/ui/placa';
import { CATALOGO_PLANOS, ROTULO_RECURSO, type Recurso } from '@/domain/plano';
import { formatarMoeda } from '@/domain/shared/texto';
import './landing.css';

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

function indice(i: number): CSSProperties {
  return { '--i': i } as CSSProperties;
}

export function Landing() {
  const raiz = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  useRevelar(raiz);

  return (
    // A landing é sempre escura: a marca é pintura preta sob luz.
    <div ref={raiz} data-modo="escuro" className="lp min-h-dvh overflow-x-clip">
      <header className="lp-nav">
        <div className="lp-contem flex h-[68px] items-center justify-between">
          <Link href="/" aria-label="Brilhoflow, início">
            <Marca />
          </Link>
          <nav className="hidden items-center gap-8 lg:flex" aria-label="Seções da página">
            <a href="#painel" className="lp-nav-link">
              O painel
            </a>
            <a href="#como" className="lp-nav-link">
              Como funciona
            </a>
            <a href="#planos" className="lp-nav-link">
              Planos
            </a>
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <Botao comoFilho variante="fantasma">
              <Link href="/login">Entrar</Link>
            </Botao>
            <Botao comoFilho variante="acento">
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
                  ['O painel', '#painel'],
                  ['Como funciona', '#como'],
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
            <div className="lp-topo">
              <h1 className="lp-h1 lp-entra" style={indice(0)}>
                Tire os riscos <em>da rotina.</em>
              </h1>
              <div className="lp-entra" style={indice(1)}>
                <p className="lp-sub">
                  Agenda por profissional, estoque de produto e caixa da sua estética automotiva.
                  Tudo claro como pintura polida.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <Botao comoFilho variante="acento" tamanho="grande">
                    <Link href="/suporte">
                      Pedir acesso <ArrowRight />
                    </Link>
                  </Botao>
                  <Botao comoFilho variante="contorno" tamanho="grande">
                    <a href="#painel">Ver o painel</a>
                  </Botao>
                </div>
              </div>
            </div>

            <div className="lp-entra" style={indice(2)}>
              <PalcoPolido />
            </div>
          </div>
        </section>

        {/* --------------------------- Chão da oficina --------------------- */}
        <section id="painel" className="lp-secao scroll-mt-16">
          <div className="lp-contem">
            <div className="lp-revelar">
              <h2 className="lp-h2">Quem está fazendo o quê, agora.</h2>
              <p className="lp-texto mt-4">
                Cada cartão é um profissional da equipe. Ele mostra o carro que está sendo
                atendido, há quanto tempo e qual é o próximo da fila. Em vez de uma tabela, você vê
                a oficina como ela está agora.
              </p>
            </div>
            <ChaoDemo />
          </div>
        </section>

        {/* --------------------------- Como funciona ----------------------- */}
        <section id="como" className="lp-secao lp-faixa-cor scroll-mt-16">
          <div className="lp-contem">
            <div className="lp-revelar">
              <h2 className="lp-h2">Uma ação entra. O resto acompanha.</h2>
              <p className="lp-texto mt-4">
                Do agendamento ao caixa, nada é digitado duas vezes: o que acontece na oficina vira
                histórico, consumo de produto e receita.
              </p>
            </div>
            <ol className="lp-passos">
              <Passo
                i={0}
                icone={CalendarClock}
                titulo="Agende"
                texto="Cliente, carro, serviços e responsável. O sistema avisa se o horário já está ocupado."
              >
                <div className="lp-mini">
                  <Placa valor="RTA1B23" />
                  <span className="font-semibold">09:30</span>
                </div>
                <div className="lp-mini text-[var(--tinta-tenue)]">
                  <span>Polimento técnico</span>
                  <span>4 h</span>
                </div>
              </Passo>
              <Passo
                i={1}
                icone={Users}
                titulo="Atenda"
                texto="O histórico do carro e do cliente aparece na bancada, antes de começar."
              >
                <div className="lp-mini">
                  <span className="font-semibold">Golf GTI</span>
                  <span className="rounded-full bg-[var(--acento-fraco)] px-2 py-0.5 text-[0.68rem] font-semibold text-[var(--acento-ativo)]">
                    Em andamento
                  </span>
                </div>
                <div className="lp-mini text-[var(--tinta-tenue)]">
                  <span>Última visita</span>
                  <span>há 38 dias</span>
                </div>
              </Passo>
              <Passo
                i={2}
                icone={PackageCheck}
                titulo="Baixe o produto"
                texto="Ao concluir, o consumo informado sai do estoque e o alerta de reposição se atualiza."
              >
                <div className="lp-mini">
                  <span>Shampoo neutro</span>
                  <span className="font-semibold">− 120 ml</span>
                </div>
                <div className="lp-mini-barra">
                  <i style={{ '--v': 0.62 } as CSSProperties} />
                </div>
              </Passo>
              <Passo
                i={3}
                icone={CircleDollarSign}
                titulo="Receba"
                texto="Pagamento à vista ou parcelado vira receita. O resultado do mês se atualiza sozinho."
              >
                <div className="lp-mini">
                  <span>Crédito 3×</span>
                  <span className="font-semibold">R$ 326,67</span>
                </div>
                <div className="lp-mini text-[var(--positivo)]">
                  <span>1ª parcela recebida</span>
                  <Check className="size-4" aria-hidden />
                </div>
              </Passo>
            </ol>
          </div>
        </section>

        {/* ------------------------------ Planos --------------------------- */}
        <section id="planos" className="lp-secao scroll-mt-16">
          <div className="lp-contem">
            <div className="lp-revelar">
              <h2 className="lp-h2">Comece pela rotina. Cresça quando precisar.</h2>
              <p className="lp-texto mt-4">Dois planos. A troca preserva todo o histórico.</p>
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
                    style={indice(k)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold">{plano.nome}</h3>
                      {destaque ? (
                        <span className="rounded-full bg-[var(--acento)] px-3 py-1 text-xs font-bold text-[var(--acento-texto)]">
                          Mais escolhido
                        </span>
                      ) : null}
                    </div>
                    <p className="lp-plano-mudo mt-2 min-h-11 text-sm leading-relaxed">
                      {plano.descricao}
                    </p>
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
                    <ul className="mt-3 flex-1 space-y-2.5">
                      {exibidos.map((recurso: Recurso) => (
                        <li key={recurso} className="flex items-start gap-2.5 text-sm">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-[var(--positivo)]"
                            aria-hidden
                          />
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
            <p className="mx-auto mt-4 max-w-md text-[var(--tinta-suave)]">
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
          <Marca />
          <p>Gestão para estética automotiva.</p>
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
  icone: LucideIcon;
  titulo: string;
  texto: string;
  children: React.ReactNode;
}) {
  return (
    <li className="lp-passo lp-revelar" style={indice(i)}>
      <Icone className="size-5 text-[var(--acento-ativo)]" aria-hidden />
      <h3>{titulo}</h3>
      <p>{texto}</p>
      <div className="lp-passo-cena" aria-hidden>
        {children}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Palco: a pintura riscada que o visitante poli com o mouse ou com o dedo.
// ---------------------------------------------------------------------------

/**
 * O painel fica escondido sob uma pintura riscada (canvas). A passada do mouse
 * ou do dedo apaga os riscos e revela a interface. O polimento só termina
 * quando toda a superfície foi realmente passada. "Revelar tudo" e movimento
 * reduzido mostram direto o resultado, e o painel decorativo fica fora da
 * árvore de acessibilidade.
 */
function PalcoPolido() {
  const palcoRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const revelarRef = useRef<() => void>(() => undefined);
  const [polido, setPolido] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const palco = palcoRef.current;
    const canvas = canvasRef.current;
    if (palco === null || canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const COLS = 36;
    const ROWS = 18;
    const visitadas = new Uint8Array(COLS * ROWS);
    let largura = 0;
    let altura = 0;
    let feitas = 0;
    let concluido = false;
    let semente = 11;
    let temporizadorResize = 0;
    let ultimoX: number | null = null;
    let ultimoY = 0;

    // Gerador pseudoaleatório fixo: os riscos são os mesmos a cada visita.
    const aleatorio = (): number => {
      semente = (semente * 16807) % 2147483647;
      return (semente - 1) / 2147483646;
    };

    const concluir = (): void => {
      if (concluido) return;
      concluido = true;
      setPolido(true);
    };
    revelarRef.current = concluir;

    const desenharRiscos = (): void => {
      const limites = palco.getBoundingClientRect();
      largura = Math.round(limites.width * dpr);
      altura = Math.round(limites.height * dpr);
      canvas.width = largura;
      canvas.height = altura;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, largura, altura);
      ctx.fillStyle = '#10131a';
      ctx.fillRect(0, 0, largura, altura);

      let gradiente = ctx.createRadialGradient(
        largura * 0.28,
        altura * 0.15,
        10,
        largura * 0.28,
        altura * 0.15,
        largura * 0.85,
      );
      gradiente.addColorStop(0, 'rgba(150,160,185,.22)');
      gradiente.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradiente;
      ctx.fillRect(0, 0, largura, altura);

      gradiente = ctx.createLinearGradient(0, 0, largura, altura);
      gradiente.addColorStop(0, 'rgba(255,255,255,.04)');
      gradiente.addColorStop(0.5, 'rgba(255,255,255,0)');
      gradiente.addColorStop(1, 'rgba(255,255,255,.05)');
      ctx.fillStyle = gradiente;
      ctx.fillRect(0, 0, largura, altura);

      semente = 11;
      // Micro-riscos em redemoinho: o que o polimento tira.
      for (let i = 0; i < 2200; i += 1) {
        const x = aleatorio() * largura;
        const y = aleatorio() * altura;
        const raio = (5 + aleatorio() * 80) * dpr;
        const inicio = aleatorio() * 6.283;
        const arco = 0.4 + aleatorio() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, raio, inicio, inicio + arco);
        const alfa = 0.035 + aleatorio() * 0.13;
        const vermelho = 205 + Math.floor(aleatorio() * 50);
        const verde = 210 + Math.floor(aleatorio() * 45);
        ctx.strokeStyle = `rgba(${vermelho},${verde},255,${alfa})`;
        ctx.lineWidth = (0.4 + aleatorio() * 1) * dpr;
        ctx.stroke();
      }
      // Riscos longos, de pano ou esponja suja.
      for (let i = 0; i < 60; i += 1) {
        const x = aleatorio() * largura;
        const y = aleatorio() * altura;
        const comprimento = (80 + aleatorio() * 300) * dpr;
        const angulo = -0.4 + aleatorio() * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angulo) * comprimento, y + Math.sin(angulo) * comprimento);
        ctx.strokeStyle = `rgba(255,255,255,${0.05 + aleatorio() * 0.12})`;
        ctx.lineWidth = (0.5 + aleatorio() * 0.7) * dpr;
        ctx.stroke();
      }
      visitadas.fill(0);
      feitas = 0;
    };

    /**
     * Marca como limpas as células cujo centro está na parte sólida da escova.
     * O polimento só conclui com todas as células passadas, então nunca acaba
     * antes de a superfície estar realmente limpa.
     */
    const marcar = (x: number, y: number, raioSolido: number): void => {
      const larguraCelula = largura / COLS;
      const alturaCelula = altura / ROWS;
      const c0 = Math.max(0, Math.floor((x - raioSolido) / larguraCelula));
      const c1 = Math.min(COLS - 1, Math.floor((x + raioSolido) / larguraCelula));
      const l0 = Math.max(0, Math.floor((y - raioSolido) / alturaCelula));
      const l1 = Math.min(ROWS - 1, Math.floor((y + raioSolido) / alturaCelula));
      for (let l = l0; l <= l1; l += 1) {
        for (let c = c0; c <= c1; c += 1) {
          const dx = (c + 0.5) * larguraCelula - x;
          const dy = (l + 0.5) * alturaCelula - y;
          if (dx * dx + dy * dy > raioSolido * raioSolido) continue;
          const k = l * COLS + c;
          if (visitadas[k] === 0) {
            visitadas[k] = 1;
            feitas += 1;
          }
        }
      }
    };

    const polirPonto = (x: number, y: number): void => {
      const raio = 90 * dpr;
      ctx.globalCompositeOperation = 'destination-out';
      const gradiente = ctx.createRadialGradient(x, y, 0, x, y, raio);
      gradiente.addColorStop(0, 'rgba(0,0,0,1)');
      gradiente.addColorStop(0.55, 'rgba(0,0,0,.9)');
      gradiente.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradiente;
      ctx.beginPath();
      ctx.arc(x, y, raio, 0, Math.PI * 2);
      ctx.fill();
      marcar(x, y, raio * 0.5);
    };

    // x, y em pixels do canvas. Interpola entre pontos para não deixar buracos.
    const polirAte = (x: number, y: number): void => {
      if (ultimoX === null) {
        polirPonto(x, y);
      } else {
        const dx = x - ultimoX;
        const dy = y - ultimoY;
        const passos = Math.max(1, Math.floor(Math.hypot(dx, dy) / (14 * dpr)));
        for (let i = 1; i <= passos; i += 1) {
          polirPonto(ultimoX + (dx * i) / passos, ultimoY + (dy * i) / passos);
        }
      }
      ultimoX = x;
      ultimoY = y;
      if (feitas >= COLS * ROWS) concluir();
    };

    const local = (evento: PointerEvent): { x: number; y: number } => {
      const limites = palco.getBoundingClientRect();
      return { x: evento.clientX - limites.left, y: evento.clientY - limites.top };
    };

    const aoMover = (evento: PointerEvent): void => {
      const { x, y } = local(evento);
      palco.style.setProperty('--mx', `${x}px`);
      palco.style.setProperty('--my', `${y}px`);
      if (!concluido) polirAte(x * dpr, y * dpr);
    };
    const aoSair = (): void => {
      ultimoX = null;
    };
    const aoPressionar = (evento: PointerEvent): void => {
      if (concluido) return;
      const { x, y } = local(evento);
      polirAte(x * dpr, y * dpr);
    };

    desenharRiscos();
    setPronto(true);
    if (reduzMovimento) {
      // Sem movimento: a pintura já aparece polida.
      concluir();
      return () => undefined;
    }

    palco.addEventListener('pointermove', aoMover);
    palco.addEventListener('pointerleave', aoSair);
    palco.addEventListener('pointerdown', aoPressionar);

    const aoRedimensionar = (): void => {
      window.clearTimeout(temporizadorResize);
      temporizadorResize = window.setTimeout(() => {
        if (!concluido) desenharRiscos();
      }, 200);
    };
    window.addEventListener('resize', aoRedimensionar);

    return () => {
      palco.removeEventListener('pointermove', aoMover);
      palco.removeEventListener('pointerleave', aoSair);
      palco.removeEventListener('pointerdown', aoPressionar);
      window.removeEventListener('resize', aoRedimensionar);
      window.clearTimeout(temporizadorResize);
    };
  }, []);

  return (
    <div>
      <div className="lp-convite" data-polido={polido}>
        <div>
          {polido ? (
            <>
              <p className="lp-convite-titulo">Esse é o painel do Brilhoflow</p>
              <p className="lp-convite-texto">
                A agenda do dia por profissional, o estoque e o caixa, tudo na mesma tela.
              </p>
            </>
          ) : (
            <>
              <p className="lp-convite-titulo">Faça o polimento para ver o painel</p>
              <p className="lp-convite-texto">
                <span className="lp-so-mouse">Passe o mouse sobre a pintura riscada até limpar tudo.</span>
                <span className="lp-so-toque">Passe o dedo sobre a pintura riscada até limpar tudo.</span>
              </p>
            </>
          )}
        </div>
        {polido ? null : (
          <button type="button" className="lp-revelar-tudo" onClick={() => revelarRef.current()}>
            Revelar tudo
          </button>
        )}
      </div>
      <div
        ref={palcoRef}
        className="lp-palco"
        data-polido={polido}
        data-pronto={pronto}
        role="group"
        aria-label="Painel do Brilhoflow: agenda do dia por profissional. Passe o mouse sobre a pintura riscada para polir e revelar, ou use o botão Revelar tudo."
      >
        <PainelDecorativo />
        <div className="lp-brilho" aria-hidden />
        <canvas ref={canvasRef} aria-hidden />
      </div>
    </div>
  );
}

/** A interface que está sob a pintura. É ilustração: fora da árvore de acessibilidade. */
function PainelDecorativo() {
  return (
    <div className="lp-ui" aria-hidden>
      <aside>
        <div className="mb-3">
          <Marca />
        </div>
        <a className="on">Painel</a>
        <a>Agenda</a>
        <a>Clientes</a>
        <a>Estoque</a>
        <a>Financeiro</a>
      </aside>
      <div className="lp-ui-main">
        <div className="lp-ui-topo">
          <div>
            <h3>Hoje na oficina</h3>
            <span className="text-[0.82rem] text-[var(--tinta-suave)]">
              3 profissionais · 8 atendimentos
            </span>
          </div>
          <ul className="lp-ui-kpis">
            <li>
              <b>2</b> em andamento
            </li>
            <li>
              <b>4</b> aguardando
            </li>
            <li>
              <b>{formatarMoeda(1240)}</b> no caixa
            </li>
          </ul>
        </div>
        <div className="lp-trilhos">
          <div className="lp-trilho">
            <em>Rafael</em>
            <div className="lp-blk a" style={{ left: '14%', width: '38%' }}>
              <b>Polimento técnico</b>
              <small>Golf GTI · RTA1B23</small>
            </div>
            <div className="lp-blk c" style={{ left: '58%', width: '24%' }}>
              <b>Hidratação de couro</b>
              <small>Corolla · MNO4C56</small>
            </div>
          </div>
          <div className="lp-trilho">
            <em>Camila</em>
            <div className="lp-blk b" style={{ left: '14%', width: '17%' }}>
              <b>Lavagem técnica</b>
              <small>Civic · QRS1A23</small>
            </div>
            <div className="lp-blk a" style={{ left: '34%', width: '24%' }}>
              <b>Higienização interna</b>
              <small>Compass · DEF2E34</small>
            </div>
            <div className="lp-blk c" style={{ left: '62%', width: '34%' }}>
              <b>Vitrificação cerâmica</b>
              <small>BMW 320i · ABC1D23</small>
            </div>
          </div>
          <div className="lp-trilho lp-trilho-extra">
            <em>Diego</em>
            <div className="lp-blk b" style={{ left: '18%', width: '14%' }}>
              <b>Lavagem</b>
              <small>Onix</small>
            </div>
            <div className="lp-blk c" style={{ left: '42%', width: '20%' }}>
              <b>Detalhe de motor</b>
              <small>Hilux</small>
            </div>
            <div className="lp-blk c" style={{ left: '72%', width: '24%' }}>
              <b>Polimento comercial</b>
              <small>Creta</small>
            </div>
          </div>
        </div>
        <ul className="lp-legenda">
          <li>
            <i className="a" />
            Em andamento
          </li>
          <li>
            <i className="b" />
            Concluído
          </li>
          <li>
            <i className="c" />
            Agendado
          </li>
        </ul>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chão da oficina (demonstração com dados fictícios)
// ---------------------------------------------------------------------------

interface CartaoDemo {
  nome: string;
  placa: string | null;
  servico: string;
  carro: string;
  progresso: number;
  segundos: number;
  previstas: string;
  depois: string;
}

const EQUIPE_DEMO: readonly CartaoDemo[] = [
  {
    nome: 'Rafael',
    placa: 'RTA1B23',
    servico: 'Polimento técnico',
    carro: 'Golf GTI · André Farias',
    progresso: 0.62,
    segundos: 3752,
    previstas: 'de 4h previstas',
    depois: '14:00 · Couro',
  },
  {
    nome: 'Camila',
    placa: 'DEF2E34',
    servico: 'Higienização interna',
    carro: 'Compass · Gustavo Reis',
    progresso: 0.34,
    segundos: 2410,
    previstas: 'de 2h previstas',
    depois: '13:30 · Vitrificação',
  },
  {
    nome: 'Diego',
    placa: null,
    servico: 'Próximo: Detalhe de motor',
    carro: 'Hilux · Frota Sul · 11:30',
    progresso: 0,
    segundos: 0,
    previstas: 'aguardando',
    depois: '15:00 · Polimento',
  },
];

const CIRCUNFERENCIA = 2 * Math.PI * 42;

function cronometro(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function ChaoDemo() {
  const [decorrido, setDecorrido] = useState(0);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    const entrada = window.setTimeout(() => setMontado(true), 400);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => window.clearTimeout(entrada);
    }
    const relogio = window.setInterval(() => setDecorrido((atual) => atual + 1), 1000);
    return () => {
      window.clearTimeout(entrada);
      window.clearInterval(relogio);
    };
  }, []);

  return (
    <div className="lp-chao lp-revelar">
      <div className="lp-equipe">
        {EQUIPE_DEMO.map((cartao) => {
          const emAtendimento = cartao.placa !== null;
          return (
            <article key={cartao.nome} className="superficie lp-card">
              <div className="lp-card-topo">
                <span>{cartao.nome}</span>
                {emAtendimento ? (
                  <span>
                    <i className="lp-vivo" aria-hidden />
                    Em andamento
                  </span>
                ) : (
                  <span className="text-[var(--tinta-tenue)]">Livre</span>
                )}
              </div>
              <div className="lp-anel">
                <svg viewBox="0 0 100 100" aria-hidden>
                  <circle className="f" cx="50" cy="50" r="42" />
                  <circle
                    className="p"
                    cx="50"
                    cy="50"
                    r="42"
                    strokeDasharray={CIRCUNFERENCIA}
                    strokeDashoffset={
                      montado ? CIRCUNFERENCIA * (1 - cartao.progresso) : CIRCUNFERENCIA
                    }
                  />
                </svg>
                <div>
                  <b>{emAtendimento ? cronometro(cartao.segundos + decorrido) : '-'}</b>
                  <small>{cartao.previstas}</small>
                </div>
              </div>
              <div className="mx-auto" style={{ opacity: emAtendimento ? 1 : 0.45 }}>
                <Placa valor={cartao.placa ?? '- - -'} />
              </div>
              <div className="lp-card-nome">
                <b>{cartao.servico}</b>
                <small>{cartao.carro}</small>
              </div>
              <div className="lp-card-prox">
                <span>Depois</span>
                <span>{cartao.depois}</span>
              </div>
            </article>
          );
        })}
      </div>
      <div className="lp-lado">
        <div className="superficie lp-num">
          <small>Caixa de hoje</small>
          <div className="v">{formatarMoeda(1240)}</div>
          <span className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-[var(--positivo)]">
            <TrendingUp className="size-4" aria-hidden />
            12,4% sobre o mês passado
          </span>
        </div>
        <div className="superficie lp-num">
          <small>Estoque</small>
          <div className="mt-3 grid gap-3 text-sm">
            {(
              [
                ['Shampoo neutro', 62, 'var(--positivo)'],
                ['Cera sintética', 28, 'var(--atencao)'],
                ['Microfibra', 14, 'var(--critico)'],
              ] as const
            ).map(([nome, nivel, cor]) => (
              <div key={nome}>
                <div className="flex justify-between">
                  <span>{nome}</span>
                  <span className="text-[var(--tinta-tenue)]">{nivel}%</span>
                </div>
                <div className="lp-barra">
                  <i style={{ width: `${nivel}%`, background: cor }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
