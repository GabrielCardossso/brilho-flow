import { cn } from '@/lib/utils';

/**
 * Símbolo do Brilhoflow: um B construído como as letras da Getel, em traço de
 * espessura única e curvas de círculo. A haste é reta; as duas barrigas são
 * semicírculos (a de baixo um pouco maior) e a barra do meio faz o papel da
 * barra do E. Usa o acento da empresa e funciona em qualquer fundo.
 */
export function Simbolo({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden
      className={cn('size-8', className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g stroke="var(--acento)" strokeWidth="5.2" transform="translate(5.2 0)">
        <path d="M5 .4V42.6" />
        <path d="M5 3H16A8.5 8.5 0 0 1 16 20H5" />
        <path d="M5 20H18.5A10 10 0 0 1 18.5 40H5" />
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
    <span className={cn('flex items-center gap-2 text-[var(--tinta)]', className)}>
      <Simbolo className={compacta ? 'size-7' : 'size-9'} />
      {!compacta ? (
        <span className="font-[family-name:var(--font-marca)] text-[1.4rem] font-semibold leading-none tracking-[-0.03em]">
          Brilho<span className="text-[var(--acento-ativo)]">flow</span>
        </span>
      ) : null}
    </span>
  );
}
