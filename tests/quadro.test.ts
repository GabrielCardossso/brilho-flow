import { describe, expect, it } from 'vitest';
import {
  avaliarMovimento,
  ETAPAS_QUADRO,
  etapaEfetiva,
  STATUS_DA_ETAPA,
} from '@/domain/agendamento';

describe('quadro do dia: etapa efetiva', () => {
  it('usa a etapa gravada quando ela combina com o status', () => {
    expect(etapaEfetiva('AGENDADO', 'NA_FILA')).toBe('NA_FILA');
    expect(etapaEfetiva('EM_ANDAMENTO', 'REVISAO')).toBe('REVISAO');
    expect(etapaEfetiva('CONCLUIDO', 'ENTREGUE')).toBe('ENTREGUE');
  });

  it('cai na etapa inicial quando o status mudou por outro caminho', () => {
    // "Iniciar" na agenda: a etapa gravada (na fila) já não vale para em andamento.
    expect(etapaEfetiva('EM_ANDAMENTO', 'NA_FILA')).toBe('EM_ANDAMENTO');
    expect(etapaEfetiva('CONCLUIDO', 'REVISAO')).toBe('AVISAR_CLIENTE');
    expect(etapaEfetiva('AGENDADO', null)).toBe('AGUARDANDO_CARRO');
    expect(etapaEfetiva('AGENDADO', 'valor-estranho')).toBe('AGUARDANDO_CARRO');
  });

  it('cancelado não aparece no quadro', () => {
    expect(etapaEfetiva('CANCELADO', 'NA_FILA')).toBeNull();
  });

  it('toda etapa pertence a um status do fluxo', () => {
    for (const etapa of ETAPAS_QUADRO) {
      expect(['AGENDADO', 'EM_ANDAMENTO', 'CONCLUIDO']).toContain(STATUS_DA_ETAPA[etapa]);
    }
  });
});

describe('quadro do dia: movimento entre etapas', () => {
  it('é livre dentro do mesmo status, para frente e para trás', () => {
    expect(avaliarMovimento('AGENDADO', 'NA_FILA')).toEqual({ ok: true, value: { iniciar: false } });
    expect(avaliarMovimento('AGENDADO', 'AGUARDANDO_CARRO')).toEqual({ ok: true, value: { iniciar: false } });
    expect(avaliarMovimento('EM_ANDAMENTO', 'REVISAO')).toEqual({ ok: true, value: { iniciar: false } });
    expect(avaliarMovimento('EM_ANDAMENTO', 'EM_ANDAMENTO')).toEqual({ ok: true, value: { iniciar: false } });
    expect(avaliarMovimento('CONCLUIDO', 'ENTREGUE')).toEqual({ ok: true, value: { iniciar: false } });
  });

  it('inicia o atendimento ao sair de agendado para uma etapa de andamento', () => {
    expect(avaliarMovimento('AGENDADO', 'EM_ANDAMENTO')).toEqual({ ok: true, value: { iniciar: true } });
    expect(avaliarMovimento('AGENDADO', 'REVISAO')).toEqual({ ok: true, value: { iniciar: true } });
  });

  it('não conclui pelo quadro: a conclusão exige consumo e pagamento', () => {
    const resultado = avaliarMovimento('EM_ANDAMENTO', 'AVISAR_CLIENTE');
    expect(resultado.ok).toBe(false);
    expect(avaliarMovimento('AGENDADO', 'ENTREGUE').ok).toBe(false);
  });

  it('não volta de status', () => {
    expect(avaliarMovimento('EM_ANDAMENTO', 'NA_FILA').ok).toBe(false);
    expect(avaliarMovimento('CONCLUIDO', 'REVISAO').ok).toBe(false);
    expect(avaliarMovimento('CONCLUIDO', 'AGUARDANDO_CARRO').ok).toBe(false);
  });

  it('recusa mover atendimento cancelado', () => {
    expect(avaliarMovimento('CANCELADO', 'NA_FILA').ok).toBe(false);
  });
});
