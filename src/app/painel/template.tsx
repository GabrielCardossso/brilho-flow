import type { ReactNode } from 'react';

/**
 * O template remonta a cada navegação (o layout não). É o ponto certo para a
 * transição entre abas: uma entrada curta, sem segurar a navegação.
 */
export default function TemplateDoPainel({ children }: { children: ReactNode }) {
  return <div className="pagina-entra">{children}</div>;
}
