import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { Relatorio } from '@/server/relatorios';
import { CATALOGO_PLANOS } from '@/domain/plano';
import { formatarData } from '@/domain/shared/tempo';
import { formatarMoeda } from '@/domain/shared/texto';

/**
 * Relatório em PDF desenhado com pdf-lib, que é JavaScript puro. O renderizador
 * anterior (react-pdf) compilava WebAssembly em tempo de execução, o que a
 * Cloudflare Workers não permite.
 */

const PAGINA = { largura: 841.89, altura: 595.28 }; // A4 paisagem, em pontos
const MARGEM = 28;
const AREA_RODAPE = 24;
const LARGURA_UTIL = PAGINA.largura - MARGEM * 2;

const cor = {
  tinta: rgb(0x0f / 255, 0x17 / 255, 0x2a / 255),
  suave: rgb(0x64 / 255, 0x74 / 255, 0x8b / 255),
  borda: rgb(0xe2 / 255, 0xe8 / 255, 0xf0 / 255),
  faixa: rgb(0xf8 / 255, 0xfa / 255, 0xfc / 255),
  acento: rgb(0xb4 / 255, 0x53 / 255, 0x09 / 255),
  branco: rgb(1, 1, 1),
};

/** As fontes padrão do PDF só desenham caracteres Latin-1; o resto vira "?". */
function limpar(texto: string): string {
  return texto.replace(/[^ -~ -ÿ–—‘’“”•…€]/g, '?');
}

interface Fontes {
  normal: PDFFont;
  negrito: PDFFont;
}

interface Coluna {
  titulo: string;
  largura: number;
  direita?: boolean;
}

/** Quebra o texto em linhas que caibam na largura dada. */
function quebrar(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
  const palavras = limpar(texto).split(/\s+/).filter((p) => p !== '');
  if (palavras.length === 0) return [''];
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of palavras) {
    const tentativa = atual === '' ? palavra : `${atual} ${palavra}`;
    if (fonte.widthOfTextAtSize(tentativa, tamanho) <= largura) {
      atual = tentativa;
      continue;
    }
    if (atual !== '') linhas.push(atual);
    // Palavra maior que a coluna: corta no limite.
    let resto = palavra;
    while (fonte.widthOfTextAtSize(resto, tamanho) > largura && resto.length > 1) {
      let corte = resto.length - 1;
      while (corte > 1 && fonte.widthOfTextAtSize(resto.slice(0, corte), tamanho) > largura) corte -= 1;
      linhas.push(resto.slice(0, corte));
      resto = resto.slice(corte);
    }
    atual = resto;
  }
  linhas.push(atual);
  return linhas;
}

class Desenho {
  private pagina: PDFPage;
  /** Distância do topo da página até o próximo elemento. */
  private topo = MARGEM;

  constructor(
    private readonly documento: PDFDocument,
    private readonly fontes: Fontes,
  ) {
    this.pagina = documento.addPage([PAGINA.largura, PAGINA.altura]);
  }

  private y(distanciaDoTopo: number): number {
    return PAGINA.altura - distanciaDoTopo;
  }

  private novaPagina(): void {
    this.pagina = this.documento.addPage([PAGINA.largura, PAGINA.altura]);
    this.topo = MARGEM;
  }

  private garantirEspaco(altura: number): boolean {
    if (this.topo + altura <= PAGINA.altura - MARGEM - AREA_RODAPE) return false;
    this.novaPagina();
    return true;
  }

  cabecalho(titulo: string, subtitulo: string): void {
    this.pagina.drawText(limpar(titulo), {
      x: MARGEM,
      y: this.y(this.topo + 14),
      size: 16,
      font: this.fontes.negrito,
      color: cor.tinta,
    });
    this.pagina.drawText(limpar(subtitulo), {
      x: MARGEM,
      y: this.y(this.topo + 28),
      size: 9,
      font: this.fontes.normal,
      color: cor.suave,
    });
    this.pagina.drawRectangle({
      x: MARGEM,
      y: this.y(this.topo + 38),
      width: LARGURA_UTIL,
      height: 2,
      color: cor.acento,
    });
    this.topo += 52;
  }

  indicadores(itens: Array<{ rotulo: string; valor: string }>): void {
    const espaco = 8;
    const largura = (LARGURA_UTIL - espaco * (itens.length - 1)) / itens.length;
    const altura = 38;
    itens.forEach((item, indice) => {
      const x = MARGEM + indice * (largura + espaco);
      this.pagina.drawRectangle({
        x,
        y: this.y(this.topo + altura),
        width: largura,
        height: altura,
        borderColor: cor.borda,
        borderWidth: 1,
      });
      this.pagina.drawText(limpar(item.rotulo.toUpperCase()), {
        x: x + 8,
        y: this.y(this.topo + 14),
        size: 7,
        font: this.fontes.normal,
        color: cor.suave,
      });
      this.pagina.drawText(limpar(item.valor), {
        x: x + 8,
        y: this.y(this.topo + 30),
        size: 13,
        font: this.fontes.negrito,
        color: cor.tinta,
      });
    });
    this.topo += altura + 6;
  }

  aviso(texto: string): void {
    this.topo += 10;
    this.pagina.drawText(limpar(texto), {
      x: MARGEM,
      y: this.y(this.topo + 8),
      size: 8,
      font: this.fontes.normal,
      color: cor.suave,
    });
    this.topo += 14;
  }

  secao(titulo: string, colunas: Coluna[], linhas: string[][]): void {
    this.topo += 16;
    this.garantirEspaco(40);
    this.pagina.drawText(limpar(titulo), {
      x: MARGEM,
      y: this.y(this.topo + 11),
      size: 11,
      font: this.fontes.negrito,
      color: cor.tinta,
    });
    this.topo += 20;
    this.cabecalhoDaTabela(colunas);

    linhas.forEach((linha, indice) => {
      const quebradas = colunas.map((coluna, posicao) =>
        quebrar(linha[posicao] ?? '', this.fontes.normal, 8, (LARGURA_UTIL * coluna.largura) / 100 - 10),
      );
      const altura = Math.max(...quebradas.map((q) => q.length)) * 10 + 10;
      if (this.garantirEspaco(altura)) this.cabecalhoDaTabela(colunas);
      this.linhaDaTabela(colunas, quebradas, altura, indice % 2 === 1);
    });
  }

  private cabecalhoDaTabela(colunas: Coluna[]): void {
    const altura = 20;
    if (this.garantirEspaco(altura + 20)) {
      // Nova página: o título da seção ficou para trás, mas o cabeçalho acompanha as linhas.
    }
    this.pagina.drawRectangle({
      x: MARGEM,
      y: this.y(this.topo + altura),
      width: LARGURA_UTIL,
      height: altura,
      color: cor.tinta,
    });
    let x = MARGEM;
    for (const coluna of colunas) {
      const larguraColuna = (LARGURA_UTIL * coluna.largura) / 100;
      const texto = limpar(coluna.titulo);
      const larguraTexto = this.fontes.negrito.widthOfTextAtSize(texto, 8);
      this.pagina.drawText(texto, {
        x: coluna.direita === true ? x + larguraColuna - 5 - larguraTexto : x + 5,
        y: this.y(this.topo + 13),
        size: 8,
        font: this.fontes.negrito,
        color: cor.branco,
      });
      x += larguraColuna;
    }
    this.topo += altura;
  }

  private linhaDaTabela(colunas: Coluna[], quebradas: string[][], altura: number, alternada: boolean): void {
    if (alternada) {
      this.pagina.drawRectangle({
        x: MARGEM,
        y: this.y(this.topo + altura),
        width: LARGURA_UTIL,
        height: altura,
        color: cor.faixa,
      });
    }
    this.pagina.drawRectangle({
      x: MARGEM,
      y: this.y(this.topo + altura),
      width: LARGURA_UTIL,
      height: 1,
      color: cor.borda,
    });
    let x = MARGEM;
    colunas.forEach((coluna, posicao) => {
      const larguraColuna = (LARGURA_UTIL * coluna.largura) / 100;
      (quebradas[posicao] ?? []).forEach((texto, numero) => {
        const larguraTexto = this.fontes.normal.widthOfTextAtSize(texto, 8);
        this.pagina.drawText(texto, {
          x: coluna.direita === true ? x + larguraColuna - 5 - larguraTexto : x + 5,
          y: this.y(this.topo + 12 + numero * 10),
          size: 8,
          font: this.fontes.normal,
          color: cor.tinta,
        });
      });
      x += larguraColuna;
    });
    this.topo += altura;
  }

  /** Rodapé em todas as páginas, com a numeração (só se sabe o total no fim). */
  rodapes(): void {
    const paginas = this.documento.getPages();
    const geradoEm = formatarData(new Date());
    paginas.forEach((pagina, indice) => {
      const texto = limpar(`Brilhoflow · gerado em ${geradoEm} · página ${indice + 1} de ${paginas.length}`);
      const largura = this.fontes.normal.widthOfTextAtSize(texto, 7);
      pagina.drawText(texto, {
        x: (PAGINA.largura - largura) / 2,
        y: 16,
        size: 7,
        font: this.fontes.normal,
        color: cor.suave,
      });
    });
  }
}

export async function gerarPdf(relatorio: Relatorio): Promise<Buffer> {
  const documento = await PDFDocument.create();
  documento.setTitle(limpar(`Relatório Brilhoflow: ${relatorio.empresa}`));
  documento.setAuthor('Brilhoflow');
  documento.setLanguage('pt-BR');

  const fontes: Fontes = {
    normal: await documento.embedFont(StandardFonts.Helvetica),
    negrito: await documento.embedFont(StandardFonts.HelveticaBold),
  };
  const desenho = new Desenho(documento, fontes);

  const periodo = `${formatarData(relatorio.periodo.inicio)} a ${formatarData(relatorio.periodo.fim)}`;
  desenho.cabecalho(
    'Brilhoflow · Relatório gerencial',
    `${relatorio.empresa} · Plano ${CATALOGO_PLANOS[relatorio.plano].nome} · ${relatorio.filtroRotulo} · ${periodo}`,
  );

  desenho.indicadores([
    { rotulo: 'Receita', valor: formatarMoeda(relatorio.resumo.receita) },
    { rotulo: 'Despesa', valor: formatarMoeda(relatorio.resumo.despesa) },
    { rotulo: 'Saldo', valor: formatarMoeda(relatorio.resumo.saldo) },
    { rotulo: 'Ticket médio', valor: formatarMoeda(relatorio.resumo.ticketMedio) },
    { rotulo: 'Atendimentos recebidos', valor: String(relatorio.resumo.atendimentosRecebidos) },
    { rotulo: 'Margem', valor: relatorio.resumo.margem === null ? '-' : `${relatorio.resumo.margem}%` },
  ]);

  if (!relatorio.detalhado) {
    desenho.aviso('O detalhamento por lançamento está disponível no plano Pro.');
  } else {
    if (relatorio.rankingServicos.length > 0) {
      desenho.secao(
        'Serviços mais executados',
        [
          { titulo: 'Serviço', largura: 60 },
          { titulo: 'Quantidade', largura: 20, direita: true },
          { titulo: 'Valor', largura: 20, direita: true },
        ],
        relatorio.rankingServicos.map((item) => [item.nome, String(item.quantidade), formatarMoeda(item.valor)]),
      );
    }
    if (relatorio.atendimentos.length > 0) {
      desenho.secao(
        'Atendimentos do período',
        [
          { titulo: 'Data', largura: 12 },
          { titulo: 'Cliente', largura: 22 },
          { titulo: 'Veículo', largura: 20 },
          { titulo: 'Serviços', largura: 26 },
          { titulo: 'Status', largura: 10 },
          { titulo: 'Total', largura: 10, direita: true },
        ],
        relatorio.atendimentos.map((item) => [
          formatarData(item.dataHora),
          item.cliente,
          item.veiculo,
          item.servicos,
          item.status,
          formatarMoeda(item.total),
        ]),
      );
    }
  }

  desenho.rodapes();
  return Buffer.from(await documento.save());
}
