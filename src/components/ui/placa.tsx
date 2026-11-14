import { cn } from '@/lib/utils';

/**
 * Placa Mercosul. O identificador do veículo aparece como ele é na rua, o que
 * dá ao sistema uma assinatura própria e ajuda a achar o carro na lista.
 */
export function Placa({
  valor,
  grande = false,
  className,
}: {
  valor: string;
  grande?: boolean | undefined;
  className?: string | undefined;
}) {
  const placa = valor.trim().toUpperCase();
  return (
    <span
      role="img"
      aria-label={`Placa ${placa}`}
      className={cn('placa', grande && 'placa-grande', className)}
    >
      <span className="placa-faixa" aria-hidden>
        BRASIL
      </span>
      <span className="placa-texto" aria-hidden>
        {placa}
      </span>
    </span>
  );
}
