import { cn } from '@/lib/utils';

/**
 * Símbolo do Brilhoflow: um "m" deitado, sem a haste. As duas corcovas viram as
 * barrigas do B (a de baixo um pouco maior), ligadas pela barra do meio, e o
 * símbolo fica aberto à esquerda, como o G da Getel: arcos e barras com cortes
 * retos e espessura única. Usa o acento da empresa e funciona em qualquer fundo.
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
      <g fill="var(--acento)" transform="translate(8.95 2) scale(.078125)">
        <path d="M0 0H190A140 140 0 0 1 190 280H0V224H190A84 84 0 0 0 190 56H0Z" />
        <path d="M0 224H190A144 144 0 0 1 190 512H0V456H190A88 88 0 0 0 190 280H0Z" />
      </g>
    </svg>
  );
}

/**
 * Assinatura do Brilhoflow. Nunca junta o símbolo e o nome: ou aparece só o
 * nome (padrão) ou só o símbolo (`compacta`, para espaços pequenos e favicon).
 */
export function Marca({
  className,
  compacta = false,
}: {
  className?: string | undefined;
  compacta?: boolean | undefined;
}) {
  if (compacta) return <Simbolo className={cn('size-8', className)} />;
  return (
    <span
      className={cn(
        'font-[family-name:var(--font-marca)] text-[1.5rem] font-semibold leading-none tracking-[-0.03em] text-[var(--tinta)]',
        className,
      )}
    >
      Brilho<span className="text-[var(--acento-ativo)]">flow</span>
    </span>
  );
}
