import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'SkillSwap — Peer-to-Peer Skill Exchange',
  description: 'Peer-to-peer skill exchange platform with pgvector semantic matching, double-entry credit ledger, and Spring AI skill extraction.',
  openGraph: {
    title: 'SkillSwap — Peer-to-Peer Skill Exchange',
    description: 'Peer-to-peer skill exchange platform with pgvector semantic matching, double-entry credit ledger, and Spring AI skill extraction.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SkillSwap — Peer-to-Peer Skill Exchange',
    description: 'Peer-to-peer skill exchange platform with pgvector semantic matching, double-entry credit ledger, and Spring AI skill extraction.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
