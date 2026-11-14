import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Tabela({ className, ...resto }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full max-h-[calc(100dvh-13rem)] overflow-auto rounded-[inherit] overscroll-x-contain [-webkit-overflow-scrolling:touch]">
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
