import type { Metadata } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FreightAudit AI',
  description: 'Intelligent freight invoice auditing & billing error detection powered by AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable} dark`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            /* Full custom color system for FreightAudit AI */
            --background: 10 15 30;          /* #0A0F1E (deep navy) */
            --surface: 17 24 39;             /* #111827 (dark surface) */
            --elevated: 28 37 55;            /* #1C2537 */
            --border: 31 45 69;              /* #1F2D45 */
            
            --primary: 45 212 191;           /* #2DD4BF (teal) */
            --primary-hover: 20 184 164;     /* #14B8A4 */
            --warning: 245 158 11;           /* #F59E0B (amber) */
            --danger: 239 68 68;             /* #EF4444 (red) */
            --success: 16 185 129;           /* #10B981 (green) */
            
            --text-primary: 241 245 249;     /* #F1F5F9 */
            --text-secondary: 148 163 184;   /* #94A3B8 */
            --text-muted: 71 85 105;         /* #475569 */
          }
          
          body {
            background-color: #0A0F1E;
            color: #F1F5F9;
            font-family: var(--font-body), sans-serif;
          }
          
          h1, h2, h3, h4, h5, h6, .font-display {
            font-family: var(--font-display), sans-serif;
          }
        ` }} />
      </head>
      <body className="bg-[#0A0F1E] text-[#F1F5F9] font-sans antialiased min-h-screen">
        <main className="min-h-screen w-full">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
