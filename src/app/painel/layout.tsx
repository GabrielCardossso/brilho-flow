import { after } from 'next/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { carregarContexto } from '@/auth/contexto';
import { Casca } from '@/components/painel/casca';
import { tokensDeAcento } from '@/domain/tema';
import { lerParametros, lerPreferencias } from '@/server/configuracoes';
import { contarNaoLidas, sincronizarAlertasSeNecessario } from '@/server/notificacoes';

export const dynamic = 'force-dynamic';

export default async function LayoutDoPainel({ children }: { children: ReactNode }) {
  const contexto = await carregarContexto();

  if (!contexto.ok) {
    const motivo = contexto.error.codigo === 'NAO_AUTENTICADO' ? 'sessao' : 'bloqueio';
    redirect(`/login?motivo=${motivo}`);
  }

  // Parametros da empresa: lidos uma vez e repartidos entre quem precisa.
  const parametros = await lerParametros(contexto.value.empresaId);

  // A sincronizacao de alertas roda DEPOIS da resposta: o usuario ve a tela
  // sem esperar um calculo que so atualiza o contador do proximo acesso.
  after(() => sincronizarAlertasSeNecessario(contexto.value, parametros));

  const [preferencias, notificacoesNaoLidas] = await Promise.all([
    lerPreferencias(contexto.value, parametros),
    contarNaoLidas(contexto.value),
  ]);

  // O acento do tenant entra como variável CSS: um único ponto de verdade
  // para toda a interface, já ajustado para contraste AA nos dois modos.
  const tokens = tokensDeAcento(preferencias.hex);

  return (
    <div data-tema-tenant style={tokens as React.CSSProperties} className="min-h-dvh">
      <Casca
        modoInicial={preferencias.modo}
        empresa={contexto.value.empresa.nomeFantasia}
        usuario={contexto.value.usuario.nome}
        papel={contexto.value.papel}
        recursos={[...contexto.value.recursos]}
        statusAssinatura={contexto.value.empresa.statusAssinatura}
        proximoVencimento={contexto.value.empresa.proximoVencimento}
        inatividadeAtiva={preferencias.inatividadeAtiva}
        inatividadeMinutos={preferencias.inatividadeMinutos}
        sessaoInicial={{
          usuario: {
            id: contexto.value.usuario.usuarioId,
            nome: contexto.value.usuario.nome,
            email: contexto.value.usuario.email,
            papel: contexto.value.papel,
            ehSuperAdmin: contexto.value.usuario.ehSuperAdmin,
            ehAdministrador: contexto.value.usuario.ehAdministrador,
          },
          empresa: contexto.value.empresa,
          recursos: [...contexto.value.recursos],
          preferencias,
          notificacoesNaoLidas,
        }}
      >
        {children}
      </Casca>
    </div>
  );
}
