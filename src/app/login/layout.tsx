import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion | Cabinet de Kinésithérapie — Hassna El-Hmaidi',
  description: 'Connectez-vous à la plateforme sécurisée du Cabinet de Kinésithérapie de Hassna El-Hmaidi.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
