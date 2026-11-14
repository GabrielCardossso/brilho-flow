'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  Boxes,
  Building2,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  LogOut,
  Menu,
  Moon,
  ScrollText,
  Settings,
  Sun,
  Users,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Marca, Simbolo } from '@/components/marca';
import { Botao } from '@/components/ui/botao';
import { Etiqueta } from '@/components/ui/etiqueta';
import { BuscaGlobal } from '@/components/painel/busca-global';
import type { Papel, Recurso, StatusAssinatura } from '@/domain/plano';
import { diasEmAtraso } from '@/domain/plano';
import type { ModoTema } from '@/domain/tema';
import { formatarData } from '@/domain/shared/tempo';
import { useSessao, type SessaoAtual } from '@/hooks/use-sessao';
import { api } from '@/lib/api';
import { prefetchDaRota } from '@/lib/prefetch';
import { aplicarTemaNoDocumento } from '@/lib/tema-cliente';
import { cn } from '@/lib/utils';

interface ItemDeMenu {
  href: string;
  rotulo: string;
  icone: typeof Gauge;
  recurso?: Recurso;
  somenteSuperAdmin?: boolean;
}

interface GrupoDeMenu {
  titulo: string;
  itens: readonly ItemDeMenu[];
}

/** O menu é dividido por assunto: o dia a dia da oficina, a gestão do negócio e a conta. */
const MENU: readonly GrupoDeMenu[] = [
  {
    titulo: 'Operação',
    itens: [
      { href: '/painel', rotulo: 'Painel', icone: Gauge },
      { href: '/painel/agenda', rotulo: 'Agenda', icone: CalendarClock, recurso: 'AGENDA' },
      { href: '/painel/clientes', rotulo: 'Clientes', icone: Users, recurso: 'CLIENTES' },
      { href: '/painel/servicos', rotulo: 'Serviços', icone: Wrench, recurso: 'SERVICOS' },
    ],
  },
  {
    titulo: 'Gestão',
    itens: [
      { href: '/painel/estoque', rotulo: 'Estoque', icone: Boxes, recurso: 'ESTOQUE' },
      { href: '/painel/financeiro', rotulo: 'Financeiro', icone: Wallet, recurso: 'FINANCEIRO' },
      {
        href: '/painel/relatorios',
        rotulo: 'Relatórios',
        icone: ScrollText,
        recurso: 'RELATORIO_SIMPLES',
      },
    ],
  },
  {
    titulo: 'Conta',
    itens: [
      { href: '/painel/notificacoes', rotulo: 'Notificações', icone: Bell },
      { href: '/painel/configuracoes', rotulo: 'Configurações', icone: Settings },
    ],
  },
  {
    titulo: 'Plataforma',
    itens: [
      { href: '/painel/plataforma', rotulo: 'Plataforma', icone: Building2, somenteSuperAdmin: true },
    ],
  },
];

const CHAVE_LATERAL = 'brilhoflow.lateral-recolhida';

export function Casca({
  children,
  modoInicial,
  empresa,
  usuario,
  papel,
  recursos,
  statusAssinatura,
  proximoVencimento,
  inatividadeAtiva,
  inatividadeMinutos,
  sessaoInicial,
}: {
  children: ReactNode;
  modoInicial: ModoTema;
  empresa: string;
  usuario: string;
  papel: Papel;
  recursos: Recurso[];
  statusAssinatura: StatusAssinatura;
  proximoVencimento: string;
  inatividadeAtiva: boolean;
  inatividadeMinutos: number;
  sessaoInicial: SessaoAtual;
}) {
  const caminho = usePathname();
  const roteador = useRouter();
  const clienteDeCache = useQueryClient();
  const { data: sessao } = useSessao(sessaoInicial);
  const [menuAberto, setMenuAberto] = useState(false);
  const [recolhida, setRecolhida] = useState(false);
  const [animarLateral, setAnimarLateral] = useState(false);
  const [indoPara, setIndoPara] = useState<string | null>(null);
  const [modo, setModo] = useState<ModoTema>(modoInicial === 'sistema' ? 'escuro' : modoInicial);

  const naoLidas = sessao?.notificacoesNaoLidas ?? 0;
  const ehSuperAdmin = papel === 'SUPER_ADMIN';

  // Preferência por aparelho: lida depois da hidratação para não divergir do HTML do servidor.
  useEffect(() => {
    try {
      setRecolhida(window.localStorage.getItem(CHAVE_LATERAL) === '1');
    } catch {
      // Sem armazenamento (janela privada): segue expandida.
    }
    const quadro = requestAnimationFrame(() => setAnimarLateral(true));
    return () => cancelAnimationFrame(quadro);
  }, []);

  const alternarLateral = useCallback(() => {
    setRecolhida((atual) => {
      const proximo = !atual;
      try {
        window.localStorage.setItem(CHAVE_LATERAL, proximo ? '1' : '0');
      } catch {
        // A preferência não persiste, mas a tela responde.
      }
      return proximo;
    });
  }, []);

  useEffect(() => {
    setMenuAberto(false);
    setIndoPara(null);
  }, [caminho]);

  // Ao chegar na nova tela, o foco vai para o conteúdo (leitor de tela e teclado).
  useEffect(() => {
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  }, [caminho]);

  const aquecer = useCallback(
    (href: string) => {
      roteador.prefetch(href);
      prefetchDaRota(clienteDeCache, href);
    },
    [roteador, clienteDeCache],
  );

  useEffect(() => {
    if (sessao === undefined) return;
    const modoDaSessao =
      sessao.preferencias.modo === 'sistema' ? 'escuro' : sessao.preferencias.modo;
    setModo(modoDaSessao);
    aplicarTemaNoDocumento(sessao.preferencias);
  }, [sessao]);

  const alternarModo = useCallback(() => {
    const proximo: ModoTema = modo === 'escuro' ? 'claro' : 'escuro';
    setModo(proximo);
    document.documentElement.dataset['modo'] = proximo;
    document.cookie = `esteticaflow_modo=${proximo}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [modo]);

  const sair = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clienteDeCache.clear();
      window.location.assign('/login');
    },
  });

  // Encerramento por inatividade: preferência da empresa, não imposição.
  useEffect(() => {
    if (!inatividadeAtiva) return;

    let temporizador: ReturnType<typeof setTimeout>;
    const limite = inatividadeMinutos * 60 * 1000;

    const reiniciar = () => {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        void api.post('/auth/logout').finally(() => {
          window.location.assign('/login?motivo=inatividade');
        });
      }, limite);
    };

    const eventos = ['pointerdown', 'keydown', 'scroll', 'visibilitychange'] as const;
    for (const evento of eventos) window.addEventListener(evento, reiniciar, { passive: true });
    reiniciar();

    return () => {
      clearTimeout(temporizador);
      for (const evento of eventos) window.removeEventListener(evento, reiniciar);
    };
  }, [inatividadeAtiva, inatividadeMinutos]);

  const gruposVisiveis = MENU.map((grupo) => ({
    titulo: grupo.titulo,
    itens: grupo.itens.filter((item) => {
      if (item.somenteSuperAdmin === true) return ehSuperAdmin;
      if (item.recurso === undefined) return true;
      return recursos.includes(item.recurso);
    }),
  })).filter((grupo) => grupo.itens.length > 0);

  const ativo = (href: string): boolean =>
    href === '/painel' ? caminho === '/painel' : caminho.startsWith(href);

  /** `estreita` mostra só os ícones (lateral recolhida no desktop). A gaveta móvel é sempre larga. */
  const renderNavegacao = (estreita: boolean) => (
    <nav
      className={cn('flex flex-1 flex-col overflow-y-auto p-3', estreita ? 'items-center gap-1' : 'gap-1')}
      aria-label="Navegação principal"
    >
      {estreita ? (
        <Botao
          variante="contorno"
          tamanho="iconePequeno"
          aria-label="Expandir menu lateral"
          title="Expandir menu lateral"
          aria-expanded={false}
          onClick={alternarLateral}
          className="mb-2"
        >
          <ChevronsRight />
        </Botao>
      ) : null}
      {gruposVisiveis.map((grupo, posicao) => (
        <div key={grupo.titulo} className={cn('flex flex-col gap-1', estreita && 'w-full items-center')}>
          {estreita ? (
            posicao > 0 ? (
              <span aria-hidden className="my-2 h-px w-8 bg-[var(--borda)]" />
            ) : null
          ) : (
            <p className={cn('rotulo-tecnico px-3 pb-1', posicao > 0 ? 'pt-4' : 'pt-1')}>{grupo.titulo}</p>
          )}
          {grupo.itens.map((item) => {
            const Icone = item.icone;
            const selecionado = ativo(item.href);
            const temAviso = item.rotulo === 'Notificações' && naoLidas > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={selecionado ? 'page' : undefined}
                aria-label={estreita ? item.rotulo : undefined}
                title={estreita ? item.rotulo : undefined}
                onPointerEnter={() => aquecer(item.href)}
                onFocus={() => aquecer(item.href)}
                onClick={() => {
                  if (!selecionado) setIndoPara(item.href);
                }}
                className={cn(
                  'painel-link group relative flex items-center rounded-[0.7rem] text-sm',
                  estreita ? 'size-10 justify-center' : 'gap-3 px-3 py-2.5',
                  selecionado
                    ? 'bg-[var(--superficie-inversa)] font-semibold text-[var(--tinta-inversa)]'
                    : 'text-[var(--tinta-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)]',
                  indoPara === item.href && 'opacity-70',
                )}
              >
                <Icone
                  className={cn(
                    'size-4 shrink-0',
                    selecionado
                      ? 'text-[var(--acento)]'
                      : 'text-[var(--tinta-tenue)] group-hover:text-[var(--tinta)]',
                  )}
                  aria-hidden
                />
                {estreita ? null : <span className="flex-1 truncate">{item.rotulo}</span>}
                {temAviso ? (
                  estreita ? (
                    <span
                      aria-hidden
                      className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--acento)] ring-2 ring-[var(--superficie-0)]"
                    />
                  ) : (
                    <span className="numerico grid min-w-5 place-items-center rounded-full bg-[var(--acento)] px-1.5 text-[11px] font-semibold text-[var(--acento-texto)]">
                      {naoLidas > 99 ? '99+' : naoLidas}
                    </span>
                  )
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const renderRodape = (estreita: boolean) => (
    <div className={cn('border-t border-[var(--borda)] p-3', estreita && 'flex flex-col items-center gap-2')}>
      <div className={cn('flex items-center rounded-lg py-2', estreita ? 'justify-center' : 'gap-3 px-2')}>
        <span
          aria-hidden
          title={estreita ? `${usuario} · ${empresa}` : undefined}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--acento-fraco)] text-sm font-semibold text-[var(--acento-ativo)]"
        >
          {usuario.slice(0, 1).toUpperCase()}
        </span>
        {estreita ? null : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--tinta)]">{usuario}</p>
            <p className="truncate text-xs text-[var(--tinta-tenue)]">{empresa}</p>
          </div>
        )}
      </div>
      {estreita ? (
        <Botao
          variante="fantasma"
          tamanho="iconePequeno"
          aria-label="Sair"
          title="Sair"
          onClick={() => sair.mutate()}
          carregando={sair.isPending}
        >
          <LogOut />
        </Botao>
      ) : (
        <Botao
          variante="fantasma"
          tamanho="pequeno"
          className="mt-1 w-full justify-start"
          onClick={() => sair.mutate()}
          carregando={sair.isPending}
        >
          <LogOut />
          Sair
        </Botao>
      )}
    </div>
  );

  const diasAtraso = diasEmAtraso(proximoVencimento);

  return (
    <div className="flex min-h-dvh">
      {indoPara !== null ? (
        <div className="barra-navegacao" role="progressbar" aria-label="Carregando a página">
          <span />
        </div>
      ) : null}
      {/* -------------------------------- Lateral fixa (desktop) ---------- */}
      <aside
        className={cn(
          'painel-lateral sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-[var(--borda)] lg:flex',
          animarLateral && 'transition-[width] duration-[var(--duracao-media)] ease-[var(--ease-mecanico)]',
          recolhida ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-[68px] shrink-0 items-center border-b border-[var(--borda)]',
            recolhida ? 'justify-center' : 'justify-between pl-5 pr-3',
          )}
        >
          <Link href="/painel" aria-label="Ir para o painel">
            <Marca compacta={recolhida} />
          </Link>
          {recolhida ? null : (
            <Botao
              variante="contorno"
              tamanho="iconePequeno"
              aria-label="Recolher menu lateral"
              title="Recolher menu lateral"
              aria-expanded
              onClick={alternarLateral}
            >
              <ChevronsLeft />
            </Botao>
          )}
        </div>
        {renderNavegacao(recolhida)}
        {renderRodape(recolhida)}
      </aside>

      {/* -------------------------------- Gaveta (mobile) ----------------- */}
      {menuAberto ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMenuAberto(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="painel-lateral relative flex h-full w-72 max-w-[85vw] flex-col border-r border-[var(--borda)] shadow-2xl">
            <div className="flex h-[68px] items-center justify-between border-b border-[var(--borda)] px-5">
              <Marca />
              <button
                type="button"
                onClick={() => setMenuAberto(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1 text-[var(--tinta-tenue)] hover:text-[var(--tinta)]"
              >
                <X className="size-5" />
              </button>
            </div>
            {renderNavegacao(false)}
            {renderRodape(false)}
          </div>
        </div>
      ) : null}

      {/* -------------------------------- Conteúdo ------------------------ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="painel-topo sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-[var(--borda)] px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMenuAberto(true)}
            aria-label="Abrir menu"
            className="rounded-md p-1.5 text-[var(--tinta-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)] lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <Link href="/painel" className="lg:hidden" aria-label="Ir para o painel">
            <Simbolo className="size-7" />
          </Link>

          <BuscaGlobal />

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={alternarModo}
              aria-label={modo === 'escuro' ? 'Ativar modo claro' : 'Ativar modo escuro'}
              className="rounded-md p-2 text-[var(--tinta-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)]"
            >
              {modo === 'escuro' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            <Link
              href="/painel/notificacoes"
              aria-label={`Notificações${naoLidas > 0 ? `: ${naoLidas} não lidas` : ''}`}
              className="relative rounded-md p-2 text-[var(--tinta-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)]"
            >
              <Bell className="size-4" />
              {naoLidas > 0 ? (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-[var(--acento-ativo)] ring-2 ring-[var(--superficie-0)]" />
              ) : null}
            </Link>
          </div>
        </header>

        {/* Aviso de assinatura: informa sem bloquear quem ainda pode operar. */}
        {statusAssinatura === 'EM_ATRASO' && !ehSuperAdmin ? (
          <div
            role="status"
            className="flex flex-wrap items-center gap-2 border-b border-[var(--atencao)]/30 bg-[var(--atencao-fraco)] px-4 py-2.5 text-sm text-[var(--atencao)] sm:px-6"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            <span>
              Assinatura em atraso há {diasAtraso} {diasAtraso === 1 ? 'dia' : 'dias'}. Vencimento
              em {formatarData(proximoVencimento)}.
            </span>
            <Etiqueta tom="atencao" className="ml-auto">
              Regularize para manter o acesso
            </Etiqueta>
          </div>
        ) : null}

        <main
          id="conteudo"
          tabIndex={-1}
          className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
