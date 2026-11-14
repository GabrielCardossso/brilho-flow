'use client';

import {
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
  type ThHTMLAttributes,
  type TdHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';

/** Altura da barra fixa do topo do painel: a tabela só conta como "inteira" abaixo dela. */
const ALTURA_DA_BARRA_DO_TOPO = 68;

/**
 * A rolagem de dentro da tabela só é liberada quando o card inteiro está à vista.
 * Antes disso a roda do mouse (ou o dedo) rola a página até a tabela aparecer por
 * completo; quando as linhas chegam ao fim, a rolagem segue para a página.
 */
export function Tabela({ className, ...resto }: HTMLAttributes<HTMLTableElement>) {
  const raiz = useRef<HTMLDivElement>(null);
  const [liberada, setLiberada] = useState(false);

  useEffect(() => {
    const elemento = raiz.current;
    if (elemento === null) return;
    let quadro = 0;

    const avaliar = () => {
      quadro = 0;
      const limites = elemento.getBoundingClientRect();
      setLiberada(
        limites.top >= ALTURA_DA_BARRA_DO_TOPO - 2 && limites.bottom <= window.innerHeight + 2,
      );
    };
    const agendar = () => {
      if (quadro === 0) quadro = requestAnimationFrame(avaliar);
    };

    avaliar();
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar);
    const observador = new ResizeObserver(agendar);
    observador.observe(elemento);
    return () => {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
      observador.disconnect();
      if (quadro !== 0) cancelAnimationFrame(quadro);
    };
  }, []);

  return (
    <div
      ref={raiz}
      data-rolagem-liberada={liberada}
      className={cn(
        'w-full overflow-x-auto lg:max-h-[calc(100dvh-13rem)] rounded-[inherit] overscroll-x-contain [-webkit-overflow-scrolling:touch]',
        liberada ? 'overflow-y-auto' : 'overflow-y-hidden',
      )}
    >
      <table className={cn('w-full border-collapse text-sm', className)} {...resto} />
    </div>
  );
}

export function Cabecalho({ className, ...resto }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('border-b border-[var(--borda)] bg-[var(--superficie-2)]', className)}
      {...resto}
    />
  );
}

export function Corpo({ className, ...resto }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-[var(--borda)]', className)} {...resto} />;
}

export function Linha({ className, ...resto }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-[var(--duracao-curta)] hover:bg-[var(--superficie-2)]',
        className,
      )}
      {...resto}
    />
  );
}

export function Coluna({
  className,
  numerica = false,
  ...resto
}: ThHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        // Cabeçalho fixo: os dados rolam por baixo e as colunas continuam à vista.
        'rotulo-tecnico sticky top-0 z-10 whitespace-nowrap border-r border-[var(--borda)] bg-[var(--superficie-2)] px-4 py-2.5 text-left shadow-[inset_0_-1px_0_var(--borda)] last:border-r-0',
        numerica ? 'text-right' : undefined,
        className,
      )}
      {...resto}
    />
  );
}

export function Celula({
  className,
  numerica = false,
  ...resto
}: TdHTMLAttributes<HTMLTableCellElement> & { numerica?: boolean }) {
  return (
    <td
      className={cn(
        'border-r border-[var(--borda)] px-4 py-3 align-middle text-[var(--tinta)] last:border-r-0',
        numerica ? 'numerico whitespace-nowrap text-right' : undefined,
        className,
      )}
      {...resto}
    />
  );
}

export function LinhaVazia({ colunas, children }: { colunas: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colunas} className="px-4 py-12 text-center text-sm text-[var(--tinta-suave)]">
        {children}
      </td>
    </tr>
  );
}
