import { cn } from '@/lib/utils';

/**
 * Símbolo do Brilhoflow: um B no estilo do "G cortado" da Getel. Peças de anel
 * com cortes retos e espessura única, separadas por frestas: a haste e dois
 * "D" (o de baixo um pouco maior, como num B de verdade). Usa o acento da
 * empresa e funciona em qualquer fundo.
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
      <g fill="var(--acento)" transform="translate(8.5 0) scale(.1)">
        <path d="M0 0H56V440H0Z" />
        <path d="M72 0H142A98 98 0 0 1 142 196H72V140H142A42 42 0 0 0 142 56H72Z" />
        <path d="M72 212H156A114 114 0 0 1 156 440H72V384H156A58 58 0 0 0 156 268H72Z" />
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
    <span className={cn('flex items-center gap-2', className)}>
      <Simbolo className={compacta ? 'size-7' : 'size-9'} />
      {!compacta ? (
        <span className="font-[family-name:var(--font-marca)] text-[1.4rem] font-semibold leading-none tracking-[-0.03em] text-[var(--tinta)]">
          Brilho<span className="text-[var(--acento-ativo)]">flow</span>
        </span>
      ) : null}
    </span>
  );
}
