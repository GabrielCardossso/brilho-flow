import type { Metadata } from 'next';
import { QuadroDoDia } from '@/components/agenda/quadro-do-dia';

export const metadata: Metadata = { title: 'Quadro do dia' };

export default function PaginaDoQuadro() {
  return <QuadroDoDia />;
}
