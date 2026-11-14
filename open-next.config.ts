import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Sem cache incremental: o Brilhoflow é dinâmico (painel autenticado) e a landing é estática.
export default defineCloudflareConfig({});
