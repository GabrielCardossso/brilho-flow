import { beforeAll, describe, expect, it } from 'vitest';
import { versaoDaSenha } from '@/auth/senha';
import { assinarSessao, lerSessao } from '@/auth/sessao';
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

describe('token de sessão', () => {
  const conteudo = {
    usuarioId: 7,
    empresaId: 3,
    papel: 'ADMINISTRADOR' as const,
    nome: 'Ana',
    email: 'ana@exemplo.com.br',
    versao: 'abc123',
  };

  beforeAll(() => {
    process.env.SESSION_SECRET = 'segredo-de-teste-com-mais-de-trinta-e-dois-caracteres';
  });

  it('cada login recebe um identificador (jti) próprio, para poder ser revogado', async () => {
    const a = await assinarSessao(conteudo, false);
    const b = await assinarSessao(conteudo, false);
    const lidaA = await lerSessao(a.token);
    const lidaB = await lerSessao(b.token);
    expect(lidaA?.jti).toBeTruthy();
    expect(lidaA?.jti).not.toBe(lidaB?.jti);
  });

  it('devolve conteúdo, versão e expiração', async () => {
    const { token } = await assinarSessao(conteudo, true);
    const lida = await lerSessao(token);
    expect(lida?.usuarioId).toBe(7);
    expect(lida?.versao).toBe('abc123');
    expect(lida?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejeita token adulterado ou vazio', async () => {
    const { token } = await assinarSessao(conteudo, false);
    expect(await lerSessao(`${token}x`)).toBeNull();
    expect(await lerSessao('')).toBeNull();
    expect(await lerSessao(undefined)).toBeNull();
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
