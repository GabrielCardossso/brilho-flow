import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { FormularioDeLogin } from '@/components/autenticacao/formulario-de-login';
import { Marca } from '@/components/marca';
import { Esqueleto } from '@/components/ui/esqueleto';

export const metadata: Metadata = {
  title: 'Entrar',
  robots: { index: false, follow: false },
};

export default function PaginaDeLogin() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Painel lateral: contexto de marca, sem competir com o formulário. */}
      <aside className="feixes hidden lg:block">
        <div className="flex h-full flex-col justify-between p-12">
          <div className="hero-entrada">
            <Marca className="!text-[#eef0f4]" />
          </div>
          <div className="hero-painel max-w-md">
            <h1 className="text-balance text-4xl font-bold leading-[1.05] tracking-[-0.04em]">
              O painel da sua estética automotiva
            </h1>
            <p className="mt-4 text-lg leading-relaxed opacity-70">
              Agenda por profissional, estoque e financeiro conversando entre si, para você olhar o
              carro e não a planilha.
            </p>
            <ul className="mt-9 space-y-3 text-sm">
              {[
                'O preço do serviço fica congelado no atendimento',
                'Cada empresa enxerga só os próprios dados',
                'A baixa de estoque acontece ao concluir o serviço',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-1.5 h-0.5 w-5 shrink-0 rounded-full bg-[var(--acento)]"
                  />
                  <span className="opacity-85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs opacity-50">Brilhoflow · todos os direitos reservados</p>
        </div>
      </aside>

      <main
        id="conteudo"
        className="flex min-h-[100svh] items-start justify-center px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:items-center sm:px-8 sm:py-12"
      >
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tinta-suave)] transition-colors hover:text-[var(--acento-ativo)]"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar para o site
          </Link>
          <div className="mt-6 lg:hidden">
            <Marca />
          </div>

          <h2 className="mt-6 text-2xl font-bold tracking-tight text-[var(--tinta)] lg:mt-0">
            Entrar na sua conta
          </h2>
          <p className="mt-1.5 text-sm text-[var(--tinta-suave)]">
            Use o e-mail cadastrado pela sua empresa.
          </p>

          <Suspense fallback={<Esqueleto className="mt-8 h-64 w-full" />}>
            <FormularioDeLogin />
          </Suspense>

          <p className="mt-8 text-center text-sm text-[var(--tinta-suave)]">
            Não tem acesso?{' '}
            <Link
              href="/suporte"
              className="font-medium text-[var(--acento-ativo)] underline-offset-4 hover:underline"
            >
              Fale com o suporte
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
