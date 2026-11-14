import type { Metadata } from 'next';
import { Landing } from '@/components/landing/landing';

export const metadata: Metadata = {
  title: 'Brilhoflow — agenda, estoque e caixa para estética automotiva',
  description:
    'Agenda por box, estoque de produto e financeiro da sua estética automotiva em um painel só.',
};

export default function PaginaInicial() {
  return <Landing />;
}
