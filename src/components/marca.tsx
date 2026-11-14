import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Símbolo do Brilhoflow: um painel de pintura preta atravessado por dois reflexos
 * de luz. É a imagem do trabalho da estética (o brilho sobre a pintura) e não
 * depende de desenhar um carro. Adapta-se ao modo claro/escuro e ao acento.
 */
export function Simbolo({ className }: { className?: string | undefined }) {
  const recorte = useId();
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn('size-8', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={recorte}>
          <rect x="1.5" y="1.5" width="29" height="29" rx="9" />
        </clipPath>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="var(--superficie-inversa)" />
      <g clipPath={`url(#${recorte})`}>
        <path d="M21.5 0h6.5L12.5 32H6Z" fill="var(--acento)" />
        <path d="M30 0h3L17.5 32h-3Z" fill="var(--tinta-inversa)" opacity="0.85" />
      </g>
    </svg>
  );
}

export function Marca({
  className,
  compacta = false,
}: {
  className?: string | undefined;
  compacta?: boolean | undefined;
}) {
  return (
    <span className={cn('flex items-center gap-2.5 text-[var(--tinta)]', className)}>
      <Simbolo className={compacta ? 'size-7' : 'size-8'} />
      {!compacta ? (
        <span className="font-[family-name:var(--font-display)] text-[1.35rem] font-bold leading-none tracking-[-0.04em]">
          Brilho<span className="text-[var(--acento-ativo)]">flow</span>
        </span>
      ) : null}
    </span>
  );
}
