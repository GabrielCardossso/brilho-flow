'use client';

import { TrendingUp } from 'lucide-react';
import { useId } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Vazio } from '@/components/ui/vazio';
import { formatarMoeda } from '@/domain/shared/texto';

export interface PontoMensal {
  mes: string;
  receita: number;
  despesa: number;
}

const COMPACTO = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface PropsTooltip {
  active?: boolean;
  payload?: Array<{ payload: PontoMensal }>;
}

/** Tooltip com a conta inteira do mês: receita, despesa e o que sobrou. */
function DicaDoMes({ active, payload }: PropsTooltip) {
  const ponto = payload?.[0]?.payload;
  if (active !== true || ponto === undefined) return null;
  const resultado = ponto.receita - ponto.despesa;
  return (
    <div className="min-w-44 rounded-xl border border-[var(--borda-forte)] bg-[var(--superficie-2)] px-3.5 py-3 text-xs shadow-xl">
      <p className="mb-2 font-semibold text-[var(--tinta)]">{ponto.mes}</p>
      <dl className="space-y-1.5">
        <div className="flex justify-between gap-6">
          <dt className="text-[var(--tinta-suave)]">Receita</dt>
          <dd className="numerico font-medium text-[var(--tinta)]">{formatarMoeda(ponto.receita)}</dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-[var(--tinta-suave)]">Despesa</dt>
          <dd className="numerico font-medium text-[var(--tinta)]">{formatarMoeda(ponto.despesa)}</dd>
        </div>
        <div className="flex justify-between gap-6 border-t border-[var(--borda)] pt-1.5">
          <dt className="text-[var(--tinta-suave)]">Resultado</dt>
          <dd
            className={`numerico font-semibold ${resultado >= 0 ? 'text-[var(--positivo)]' : 'text-[var(--critico)]'}`}
          >
            {formatarMoeda(resultado)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/**
 * Receita contra despesa nos últimos meses. A área azul é o que entrou, a linha
 * cinza é o que saiu: quando a área está acima da linha, o mês deu lucro. Os
 * três números do topo resumem o que o desenho mostra.
 */
export function GraficoFaturamento({ serie }: { serie: PontoMensal[] }) {
  const idGradiente = useId();
  const totalReceita = serie.reduce((soma, ponto) => soma + ponto.receita, 0);
  const totalDespesa = serie.reduce((soma, ponto) => soma + ponto.despesa, 0);
  const resultado = totalReceita - totalDespesa;
  const melhor = serie.reduce<PontoMensal | null>(
    (atual, ponto) => (atual === null || ponto.receita > atual.receita ? ponto : atual),
    null,
  );

  if (serie.length === 0 || (totalReceita === 0 && totalDespesa === 0)) {
    return (
      <Vazio
        icone={TrendingUp}
        titulo="Sem movimentação ainda"
        descricao="Quando houver atendimentos recebidos e despesas lançadas, a evolução aparece aqui."
      />
    );
  }

  return (
    <div>
      <dl className="grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-[var(--tinta-suave)]">Receita no período</dt>
          <dd className="numerico mt-1 text-2xl font-semibold text-[var(--acento-ativo)]">
            {formatarMoeda(totalReceita)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--tinta-suave)]">Despesa no período</dt>
          <dd className="numerico mt-1 text-2xl font-semibold text-[var(--tinta)]">
            {formatarMoeda(totalDespesa)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--tinta-suave)]">Resultado</dt>
          <dd
            className={`numerico mt-1 text-2xl font-semibold ${resultado >= 0 ? 'text-[var(--positivo)]' : 'text-[var(--critico)]'}`}
          >
            {formatarMoeda(resultado)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[var(--tinta-suave)]">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-4 rounded-sm bg-[var(--acento-ativo)] opacity-70" aria-hidden />
          Receita
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded bg-[var(--tinta-suave)]" aria-hidden />
          Despesa
        </span>
        {melhor !== null ? (
          <span className="ml-auto">
            Melhor mês: <b className="font-semibold text-[var(--tinta)]">{melhor.mes}</b>
          </span>
        ) : null}
      </div>

      <div className="mt-2 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" style={{ stopColor: 'var(--acento-ativo)', stopOpacity: 0.5 }} />
                <stop offset="100%" style={{ stopColor: 'var(--acento-ativo)', stopOpacity: 0.02 }} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--borda)" strokeDasharray="2 6" vertical={false} />
            <XAxis
              dataKey="mes"
              tick={{ fill: 'var(--tinta-suave)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              width={64}
              tick={{ fill: 'var(--tinta-tenue)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(valor: number) => COMPACTO.format(valor)}
            />
            <Tooltip
              content={<DicaDoMes />}
              cursor={{ stroke: 'var(--borda-forte)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="receita"
              stroke="var(--acento-ativo)"
              strokeWidth={2.5}
              fill={`url(#${idGradiente})`}
              dot={{ r: 3.5, fill: 'var(--superficie-1)', stroke: 'var(--acento-ativo)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'var(--acento-ativo)', stroke: 'var(--superficie-1)', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="despesa"
              stroke="var(--tinta-suave)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--tinta-suave)', stroke: 'var(--superficie-1)', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
