import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
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
export async function carregarContexto(): Promise<Result<Contexto>> {
  const jar = await cookies();
  const conteudo = await lerSessao(jar.get(COOKIE_SESSAO)?.value);

  if (conteudo === null) {
    return falha(erro('NAO_AUTENTICADO', 'Sessão expirada. Entre novamente.'));
  }

  const [[registro], [conta], [revogada]] = await Promise.all([
    db.select().from(tabelaEmpresa).where(eq(tabelaEmpresa.id, conteudo.empresaId)).limit(1),
    db
      .select({
        empresaId: tabelaUsuario.empresaId,
        nome: tabelaUsuario.nome,
        email: tabelaUsuario.email,
        papel: tabelaUsuario.papel,
        ativo: tabelaUsuario.ativo,
        senhaHash: tabelaUsuario.senhaHash,
      })
      .from(tabelaUsuario)
      .where(eq(tabelaUsuario.id, conteudo.usuarioId))
      .limit(1),
    conteudo.jti === null
      ? Promise.resolve([] as Array<{ jti: string }>)
      : db
          .select({ jti: sessaoRevogada.jti })
          .from(sessaoRevogada)
          .where(eq(sessaoRevogada.jti, conteudo.jti))
          .limit(1),
  ]);

  if (registro === undefined) {
    return falha(erro('NAO_AUTENTICADO', 'Empresa da sessão não encontrada.'));
  }

  // O cookie so prova que houve um login. Quem manda e o banco: usuario
  // arquivado, movido de empresa ou com a senha trocada perde a sessao agora,
  // e o papel vigente (promocao ou rebaixamento) vale na proxima requisicao.
  if (
    revogada !== undefined ||
    conta === undefined ||
    !conta.ativo ||
    conta.empresaId !== conteudo.empresaId ||
    versaoDaSenha(conta.senhaHash) !== conteudo.versao
  ) {
    return falha(erro('NAO_AUTENTICADO', 'Sessão expirada. Entre novamente.'));
  }

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
