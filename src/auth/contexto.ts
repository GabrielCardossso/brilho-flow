import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { db } from '@/db/client';
import { empresa as tabelaEmpresa, sessaoRevogada, usuario as tabelaUsuario } from '@/db/schema';
import {
  motivoDoBloqueio,
  permiteRecurso,
  podeAcessar,
  recalcularStatus,
  recursosDisponiveis,
  type Papel,
  type Plano,
  type Recurso,
  type StatusAssinatura,
} from '@/domain/plano';
import { falha, naoAutorizado, ok, erro, type Result } from '@/domain/result';
import { hojeISO } from '@/domain/shared/tempo';
import { versaoDaSenha } from './senha';
import { COOKIE_SESSAO, enriquecer, lerSessao, type UsuarioDaSessao } from './sessao';

export interface EmpresaDoContexto {
  readonly id: number;
  readonly nomeFantasia: string;
  readonly razaoSocial: string;
  readonly cnpj: string;
  readonly telefone: string | null;
  readonly email: string | null;
  readonly ativo: boolean;
  readonly plano: Plano;
  readonly statusAssinatura: StatusAssinatura;
  readonly valorMensalidade: string;
  readonly proximoVencimento: string;
  readonly motivoBloqueio: string | null;
}

export interface Contexto {
  readonly usuario: UsuarioDaSessao;
  readonly empresa: EmpresaDoContexto;
  readonly papel: Papel;
  readonly empresaId: number;
  readonly recursos: readonly Recurso[];
  permite(recurso: Recurso): boolean;
}

/**
 * Le a sessao do cookie, recarrega a empresa e recalcula a situacao da
 * assinatura. Feito a cada requisicao: um bloqueio aplicado pela plataforma
 * derruba o acesso na proxima acao do usuario, sem esperar expirar o cookie.
 */
async function carregarContextoSemCache(): Promise<Result<Contexto>> {
  const jar = await cookies();
  const conteudo = await lerSessao(jar.get(COOKIE_SESSAO)?.value);

  if (conteudo === null) {
    return falha(erro('NAO_AUTENTICADO', 'Sessão expirada. Entre novamente.'));
  }

  // Uma unica ida ao banco (usuario + empresa + revogacao). Eram tres consultas
  // por requisicao, e em producao elas rodavam em fila: cada uma pesa o RTT.
  const [linha] = await db
    .select({
      empresa: tabelaEmpresa,
      nome: tabelaUsuario.nome,
      email: tabelaUsuario.email,
      papel: tabelaUsuario.papel,
      ativo: tabelaUsuario.ativo,
      senhaHash: tabelaUsuario.senhaHash,
      revogada: sessaoRevogada.jti,
    })
    .from(tabelaUsuario)
    .innerJoin(tabelaEmpresa, eq(tabelaEmpresa.id, tabelaUsuario.empresaId))
    .leftJoin(sessaoRevogada, eq(sessaoRevogada.jti, conteudo.jti ?? ''))
    .where(eq(tabelaUsuario.id, conteudo.usuarioId))
    .limit(1);

  // O cookie so prova que houve um login. Quem manda e o banco: usuario
  // arquivado, movido de empresa ou com a senha trocada perde a sessao agora,
  // e o papel vigente (promocao ou rebaixamento) vale na proxima requisicao.
  if (
    linha === undefined ||
    linha.revogada !== null ||
    !linha.ativo ||
    linha.empresa.id !== conteudo.empresaId ||
    versaoDaSenha(linha.senhaHash) !== conteudo.versao
  ) {
    return falha(erro('NAO_AUTENTICADO', 'Sessão expirada. Entre novamente.'));
  }

  const registro = linha.empresa;
  const conta = linha;

  const statusAtual = recalcularStatus(
    {
      ativo: registro.ativo,
      status: registro.statusAssinatura,
      proximoVencimento: registro.proximoVencimento,
    },
    hojeISO(),
  );

  if (statusAtual !== registro.statusAssinatura) {
    await db
      .update(tabelaEmpresa)
      .set({ statusAssinatura: statusAtual })
      .where(eq(tabelaEmpresa.id, registro.id));
  }

  const situacao = {
    ativo: registro.ativo,
    status: statusAtual,
    proximoVencimento: registro.proximoVencimento,
  };

  const usuario = enriquecer({
    ...conteudo,
    nome: conta.nome,
    email: conta.email,
    papel: conta.papel,
  });

  if (!usuario.ehSuperAdmin && !podeAcessar(situacao)) {
    return falha(
      erro(
        'NAO_AUTORIZADO',
        motivoDoBloqueio(situacao) ?? 'Acesso indisponível para esta empresa.',
      ),
    );
  }

  const empresa: EmpresaDoContexto = {
    id: registro.id,
    nomeFantasia: registro.nomeFantasia,
    razaoSocial: registro.razaoSocial,
    cnpj: registro.cnpj,
    telefone: registro.telefone,
    email: registro.email,
    ativo: registro.ativo,
    plano: registro.plano,
    statusAssinatura: statusAtual,
    valorMensalidade: registro.valorMensalidade,
    proximoVencimento: registro.proximoVencimento,
    motivoBloqueio: registro.motivoBloqueio,
  };

  return ok({
    usuario,
    empresa,
    papel: usuario.papel,
    empresaId: empresa.id,
    recursos: recursosDisponiveis(empresa.plano, usuario.papel),
    permite: (recurso: Recurso) => permiteRecurso(empresa.plano, usuario.papel, recurso),
  });
}

/**
 * Cache por renderizacao: layout e pagina do mesmo pedido compartilham o
 * resultado, sem repetir a consulta. Fora de uma renderizacao (rotas de API)
 * cada chamada executa normalmente.
 */
export const carregarContexto = cache(carregarContextoSemCache);

export function exigirRecurso(contexto: Contexto, recurso: Recurso): Result<true> {
  if (contexto.permite(recurso)) return ok(true);
  return falha(
    erro('RECURSO_DO_PLANO', 'Este recurso está disponível no plano Pro.', {
      detalhes: { recurso },
    }),
  );
}

export function exigirAdministrador(contexto: Contexto): Result<true> {
  if (contexto.usuario.ehAdministrador) return ok(true);
  return falha(naoAutorizado('Apenas administradores podem executar esta ação.'));
}

export function exigirAdministradorDaEmpresa(contexto: Contexto): Result<true> {
  if (contexto.papel === 'ADMINISTRADOR') return ok(true);
  return falha(
    naoAutorizado('Apenas o administrador da empresa pode gerenciar usuários.'),
  );
}

export function exigirSuperAdmin(contexto: Contexto): Result<true> {
  if (contexto.usuario.ehSuperAdmin) return ok(true);
  return falha(naoAutorizado('Ação restrita ao administrador da plataforma.'));
}
