import { Esqueleto } from '@/components/ui/esqueleto';

/**
 * Mostrado no mesmo instante do clique, enquanto a próxima tela chega.
 * Reserva o espaço do cabeçalho, dos indicadores e do conteúdo: sem salto de layout.
 */
export default function CarregandoPainel() {
  return (
    <div role="status" aria-label="Carregando a página" aria-live="polite">
      <div className="mb-7 space-y-3">
        <Esqueleto className="h-8 w-64 max-w-full" />
        <Esqueleto className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, indice) => (
          <Esqueleto key={indice} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Esqueleto className="h-80 rounded-2xl lg:col-span-2" />
        <Esqueleto className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
