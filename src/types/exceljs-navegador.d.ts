/**
 * Versão "navegador" do ExcelJS: o mesmo gerador de planilhas, sem as partes de
 * leitura em disco (unzipper/fstream) que não funcionam em Cloudflare Workers.
 */
declare module 'exceljs/dist/exceljs.min.js' {
  import ExcelJS from 'exceljs';
  export default ExcelJS;
}
