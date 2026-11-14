import type { QueryClient } from '@tanstack/react-query';
import { api, paramsLimpos } from './api';
import { chaves } from './chaves';

/**
 * Pré-carga dos dados de cada aba. Ao passar o mouse (ou focar) no item do
 * menu, o dado da tela de destino já começa a vir: quando o clique acontece, a
 * tela aparece pronta em vez de montar vazia e só então buscar.
 *
 * As chaves e os filtros espelham exatamente os usados pelas telas. Se algum
 * deles mudar lá, a pré-carga só deixa de aproveitar o cache (nunca quebra).
 */
const buscar = <T>(caminho: string, params?: Record<string, unknown>) => async (): Promise<T> => {
  const resposta = await api.get<T>(caminho, {
    params: params === undefined ? undefined : paramsLimpos(params as Record<string, never>),
  });
  return resposta.data;
};

const CONSULTAS: Record<string, (cliente: QueryClient) => Array<Promise<void>>> = {
  '/painel': (c) => [c.prefetchQuery({ queryKey: chaves.painel, queryFn: buscar('/painel') })],
  '/painel/agenda': (c) => {
    const filtro = { periodo: 'DIA', pago: 'todos', busca: '' };
    return [
      c.prefetchQuery({ queryKey: chaves.agenda.lista(filtro), queryFn: buscar('/agenda', filtro) }),
    ];
  },
  '/painel/clientes': (c) => {
    const filtro = { busca: '', situacao: 'ativos', relacionamento: 'todos', ordenacao: 'nome' };
    return [
      c.prefetchQuery({
        queryKey: chaves.clientes.lista(filtro),
        queryFn: buscar('/clientes', filtro),
      }),
    ];
  },
  '/painel/servicos': (c) => {
    const filtro = { busca: '', situacao: 'ativos', ordenacao: 'nome' };
    return [
      c.prefetchQuery({
        queryKey: chaves.servicos.lista(filtro),
        queryFn: buscar('/servicos', filtro),
      }),
    ];
  },
  '/painel/estoque': (c) => {
    const filtro = { busca: '', situacao: 'ativos', somenteBaixo: false, ordenacao: 'nome' };
    return [
      c.prefetchQuery({
        queryKey: chaves.estoque.lista(filtro),
        queryFn: buscar('/estoque', filtro),
      }),
    ];
  },
  '/painel/notificacoes': (c) => [
    c.prefetchQuery({ queryKey: chaves.notificacoes, queryFn: buscar('/notificacoes') }),
  ],
  '/painel/configuracoes': (c) => [
    c.prefetchQuery({ queryKey: chaves.configuracoes, queryFn: buscar('/configuracoes') }),
  ],
};

export function prefetchDaRota(cliente: QueryClient, href: string): void {
  const consultas = CONSULTAS[href];
  if (consultas === undefined) return;
  // Falha de pré-carga é silenciosa: a tela busca de novo ao montar.
  for (const promessa of consultas(cliente)) void promessa.catch(() => undefined);
}
