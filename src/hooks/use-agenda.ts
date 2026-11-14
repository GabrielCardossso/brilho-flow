'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { EtapaQuadro } from '@/domain/agendamento';
import { api, FalhaDaApi, mensagemDeErro, paramsLimpos } from '@/lib/api';
import { chaves } from '@/lib/chaves';
import type {
  AgendamentoPayload,
  ConcluirPayload,
  FiltroAgenda,
  PagamentoPayload,
} from '@/schemas';
import type { AgendamentoDaLista } from '@/server/agenda';

interface RespostaDaAgenda {
  itens: AgendamentoDaLista[];
  inicio: string;
  fim: string;
  referencia: string;
}

type DetalheAgendamento = AgendamentoDaLista & {
  receita: { valor: string; forma: string; data: string } | null;
};

export function useAgenda(filtro: FiltroAgenda) {
  return useQuery({
    queryKey: chaves.agenda.lista(filtro),
    queryFn: async (): Promise<RespostaDaAgenda> => {
      const resposta = await api.get<RespostaDaAgenda>('/agenda', {
        params: paramsLimpos({ ...filtro }),
      });
      return resposta.data;
    },
    placeholderData: (anterior) => anterior,
  });
}

export function useAgendamento(id: number) {
  return useQuery({
    queryKey: chaves.agenda.item(id),
    queryFn: async (): Promise<DetalheAgendamento> => {
      const resposta = await api.get<DetalheAgendamento>(`/agenda/${id}`);
      return resposta.data;
    },
    enabled: Number.isInteger(id) && id > 0,
  });
}

export function useProfissionais() {
  return useQuery({
    queryKey: chaves.agenda.profissionais,
    queryFn: async () => {
      const resposta = await api.get<Array<{ id: number; nome: string }>>('/agenda/profissionais');
      return resposta.data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Criação do atendimento. Quando o servidor devolve CONFIRMACAO_NECESSARIA,
 * a interface pergunta ao usuário em vez de falhar: a sobreposição pode ser
 * intencional se houver mais de um box livre.
 */
export function useCriarAgendamento() {
  const cache = useQueryClient();

  return useMutation({
    mutationFn: async (dados: AgendamentoPayload) => {
      const resposta = await api.post<{ id: number }>('/agenda', dados);
      return resposta.data;
    },
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: chaves.agenda.todos });
      void cache.invalidateQueries({ queryKey: chaves.painel });
      toast.success('Atendimento agendado.');
    },
    onError: (erro) => {
      if (erro instanceof FalhaDaApi && erro.exigeConfirmacao) return;
      toast.error(mensagemDeErro(erro));
    },
  });
}

function invalidarAgenda(cache: ReturnType<typeof useQueryClient>) {
  void cache.invalidateQueries({ queryKey: chaves.agenda.todos });
  void cache.invalidateQueries({ queryKey: chaves.painel });
  void cache.invalidateQueries({ queryKey: chaves.financeiro.todos });
  void cache.invalidateQueries({ queryKey: chaves.estoque.todos });
}

export function useAcaoDeAgendamento() {
  const cache = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, acao }: { id: number; acao: 'INICIAR' | 'CANCELAR' }) => {
      await api.post(`/agenda/${id}/acao`, { acao });
      return acao;
    },
    onSuccess: (acao) => {
      invalidarAgenda(cache);
      toast.success(acao === 'INICIAR' ? 'Atendimento iniciado.' : 'Agendamento cancelado.');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });
}

export function useConcluirAgendamento() {
  const cache = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dados }: { id: number; dados: ConcluirPayload }) => {
      await api.post(`/agenda/${id}/concluir`, dados);
    },
    onSuccess: () => {
      invalidarAgenda(cache);
      toast.success('Atendimento concluído.');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });
}

export function useRegistrarPagamento() {
  const cache = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dados }: { id: number; dados: PagamentoPayload }) => {
      await api.post(`/agenda/${id}/pagamento`, dados);
    },
    onSuccess: () => {
      invalidarAgenda(cache);
      toast.success('Pagamento registrado.');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });
}

export function useVeiculosDoCliente(clienteId: number | null) {
  return useQuery({
    queryKey: ['agenda', 'veiculos-do-cliente', clienteId],
    queryFn: async () => {
      const resposta = await api.get(`/clientes/${clienteId ?? 0}/veiculos`);
      return resposta.data as Array<{
        id: number;
        placa: string;
        marca: string;
        modelo: string;
        ativo: boolean;
      }>;
    },
    enabled: clienteId !== null && clienteId > 0,
  });
}

export function useFormasDePagamento() {
  return useQuery({
    queryKey: chaves.financeiro.formas(false),
    queryFn: async () => {
      const resposta =
        await api.get<
          Array<{ id: number; nome: string; ativo: boolean; permiteParcelamento: boolean }>
        >('/financeiro/formas');
      return resposta.data;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Move um cartão do quadro. A tela já muda na hora (atualização otimista) e
 * volta ao estado anterior se o servidor recusar, com a mensagem da regra.
 */
export function useMoverEtapa() {
  const cache = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, etapa }: { id: number; etapa: EtapaQuadro }) => {
      const resposta = await api.post<{ id: number; etapa: EtapaQuadro }>(`/agenda/${id}/etapa`, {
        etapa,
      });
      return resposta.data;
    },
    onMutate: async ({ id, etapa }) => {
      await cache.cancelQueries({ queryKey: chaves.agenda.todos });
      const anteriores = cache.getQueriesData<RespostaDaAgenda>({ queryKey: chaves.agenda.todos });
      cache.setQueriesData<RespostaDaAgenda>({ queryKey: chaves.agenda.todos }, (atual) =>
        atual === undefined || !('itens' in atual)
          ? atual
          : { ...atual, itens: atual.itens.map((item) => (item.id === id ? { ...item, etapa } : item)) },
      );
      return { anteriores };
    },
    onError: (erro, _variaveis, contexto) => {
      for (const [chave, dados] of contexto?.anteriores ?? []) cache.setQueryData(chave, dados);
      toast.error(mensagemDeErro(erro));
    },
    onSettled: () => {
      void cache.invalidateQueries({ queryKey: chaves.agenda.todos });
      void cache.invalidateQueries({ queryKey: chaves.painel });
    },
  });
}
