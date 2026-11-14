import { describe, expect, it } from 'vitest';
import { versaoDaSenha } from '@/auth/senha';
import { excedeLimiteDeQuantidade, normalizarQuantidade } from '@/domain/estoque';
import { dinheiroOpcional, dinheiroPositivo, LIMITE_VALOR } from '@/schemas/comuns';

describe('versão da senha na sessão', () => {
  it('é estável para o mesmo hash', () => {
    expect(versaoDaSenha('$2a$10$abc')).toBe(versaoDaSenha('$2a$10$abc'));
  });

  it('muda quando a senha (hash) muda, invalidando sessões antigas', () => {
    expect(versaoDaSenha('$2a$10$abc')).not.toBe(versaoDaSenha('$2a$10$abd'));
  });

  it('não expõe o hash original', () => {
    expect(versaoDaSenha('$2a$10$abc')).not.toContain('abc');
    expect(versaoDaSenha('$2a$10$abc')).toHaveLength(16);
  });
});

describe('limites de quantidade do estoque', () => {
  it('aceita quantidades dentro do limite', () => {
    const resultado = normalizarQuantidade('5', 'L');
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.value.quantidade).toBe('5000.000');
  });

  it('recusa quantidade que estouraria numeric(12,3) depois de converter L para mL', () => {
    const resultado = normalizarQuantidade('99999999', 'L');
    expect(resultado.ok).toBe(false);
  });

  it('detecta saldo acima do limite', () => {
    expect(excedeLimiteDeQuantidade('999999999.999')).toBe(false);
    expect(excedeLimiteDeQuantidade('1000000000.000')).toBe(true);
  });
});

describe('limite de valores monetários', () => {
  it('aceita o maior valor que cabe na coluna', () => {
    expect(dinheiroPositivo('Valor').safeParse(String(LIMITE_VALOR)).success).toBe(true);
  });

  it('recusa valor que daria erro 500 no banco', () => {
    const resultado = dinheiroPositivo('Valor').safeParse('100000000');
    expect(resultado.success).toBe(false);
  });

  it('o valor opcional também respeita o limite', () => {
    expect(dinheiroOpcional('Valor pago').safeParse('100000000').success).toBe(false);
    expect(dinheiroOpcional('Valor pago').safeParse('').success).toBe(true);
  });
});
