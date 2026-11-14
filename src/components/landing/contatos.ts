import { Github, type LucideIcon } from 'lucide-react';

export interface Contato {
  rotulo: string;
  href: string;
  icone: LucideIcon;
}

/**
 * Contatos do rodapé da landing. Para incluir mais um, importe o ícone do
 * lucide-react (Instagram, Linkedin, Mail, MessageCircle para WhatsApp) e
 * acrescente uma linha. Formatos de link:
 *   Instagram: https://instagram.com/usuario
 *   WhatsApp:  https://wa.me/55DDDNUMERO
 *   LinkedIn:  https://www.linkedin.com/in/usuario
 *   E-mail:    mailto:endereco@dominio.com
 */
export const CONTATOS: readonly Contato[] = [
  { rotulo: 'GitHub', href: 'https://github.com/GabrielCardossso', icone: Github },
];
