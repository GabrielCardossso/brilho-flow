'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type PointerEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * Botões principais (acento, sólido, contorno, crítico) se preenchem a partir
 * do ponto em que o mouse entra. As cores de cada variante vêm de variáveis
 * --b-*, definidas aqui; a mecânica do preenchimento vive em `.botao-preenche`.
 */
const estilos = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.7rem] font-semibold tracking-[-0.005em] transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duracao-media)] ease-[var(--ease-mecanico)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        acento:
          'botao-preenche [--b-fundo:var(--acento)] [--b-texto:var(--acento-texto)] [--b-fill:var(--tinta)] [--b-texto-hover:var(--tinta-inversa)] shadow-[0_10px_24px_-14px_rgb(var(--acento-rgb)/0.9)]',
        solido:
          'botao-preenche [--b-fundo:var(--superficie-inversa)] [--b-texto:var(--tinta-inversa)] [--b-fill:var(--acento)] [--b-texto-hover:var(--acento-texto)]',
        contorno:
          'botao-preenche border border-[var(--borda-forte)] [--b-fundo:transparent] [--b-texto:var(--tinta)] [--b-fill:var(--tinta)] [--b-texto-hover:var(--tinta-inversa)] hover:border-[var(--tinta)]',
        suave:
          'bg-[var(--superficie-2)] text-[var(--tinta)] border border-[var(--borda)] hover:bg-[var(--superficie-3)] hover:border-[var(--borda-forte)]',
        fantasma:
          'text-[var(--tinta-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--tinta)]',
        critico:
          'botao-preenche border border-[var(--critico)]/35 [--b-fundo:var(--critico-fraco)] [--b-texto:var(--critico)] [--b-fill:var(--critico)] [--b-texto-hover:#ffffff]',
        elo: 'text-[var(--acento-ativo)] underline-offset-4 hover:underline',
      },
      tamanho: {
        pequeno: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        medio: 'h-10 px-4 text-sm [&_svg]:size-4',
        grande: 'h-12 px-6 text-base [&_svg]:size-5',
        icone: 'size-10 [&_svg]:size-4',
        iconePequeno: 'size-8 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variante: 'suave', tamanho: 'medio' },
  },
);

const PREENCHE = new Set(['acento', 'solido', 'contorno', 'critico']);

function informarOrigem(evento: PointerEvent<HTMLElement>): void {
  if (evento.pointerType === 'touch') return;
  const alvo = evento.currentTarget;
  const limites = alvo.getBoundingClientRect();
  alvo.style.setProperty('--px', `${evento.clientX - limites.left}px`);
  alvo.style.setProperty('--py', `${evento.clientY - limites.top}px`);
}

export interface PropsBotao
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof estilos> {
  comoFilho?: boolean;
  carregando?: boolean;
}

export const Botao = forwardRef<HTMLButtonElement, PropsBotao>(function Botao(
  {
    className,
    variante,
    tamanho,
    comoFilho = false,
    carregando = false,
    children,
    disabled,
    onPointerEnter,
    onPointerMove,
    ...resto
  },
  ref,
) {
  const Componente = comoFilho ? Slot : 'button';
  const preenche = PREENCHE.has(variante ?? 'suave');

  return (
    <Componente
      ref={ref}
      className={cn(estilos({ variante, tamanho }), className)}
      disabled={disabled === true || carregando}
      onPointerEnter={(evento: PointerEvent<HTMLButtonElement>) => {
        if (preenche) informarOrigem(evento);
        onPointerEnter?.(evento);
      }}
      onPointerMove={(evento: PointerEvent<HTMLButtonElement>) => {
        if (preenche) informarOrigem(evento);
        onPointerMove?.(evento);
      }}
      {...resto}
    >
      {carregando ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Componente>
  );
});
