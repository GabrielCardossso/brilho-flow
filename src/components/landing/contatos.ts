import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react';

export interface Contato {
  rotulo: string;
  href: string;
  icone: LucideIcon;
}

/** Contatos do rodapé da landing. Para incluir mais um, acrescente uma linha. */
export const CONTATOS: readonly Contato[] = [
  { rotulo: 'Instagram', href: 'https://www.instagram.com/gabrielcrdsss/', icone: Instagram },
  { rotulo: 'WhatsApp', href: 'https://wa.me/5548991746960', icone: MessageCircle },
  { rotulo: 'LinkedIn', href: 'https://www.linkedin.com/in/gabrielcardossso/', icone: Linkedin },
  { rotulo: 'GitHub', href: 'https://github.com/GabrielCardossso', icone: Github },
  { rotulo: 'E-mail', href: 'mailto:gabrielcardossso@gmail.com', icone: Mail },
];
