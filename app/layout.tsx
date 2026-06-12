import React from 'react';
import './globals.css';

const Toaster = () => null;

export const metadata = {
  title: 'FreightAudit AI',
  description: 'Intelligent freight invoice auditing & billing error detection powered by AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            background-color: #F9FAFB;
            color: #111827;
            font-family: ui-sans-serif, system-ui, sans-serif;
          }

          h1, h2, h3, h4, h5, h6, .font-display {
            font-family: ui-monospace, SFMono-Regular, monospace;
          }
        `,
          }}
        />
      </head>
      <body className="bg-gray-50 text-gray-900 font-sans antialiased min-h-screen">
        <main className="min-h-screen w-full">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
