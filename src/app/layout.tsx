import './globals.css';
import { Toaster } from 'react-hot-toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PunchPilot — Attendance Made Simple',
  description: 'Modern attendance management for growing teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0e1525',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '10px',
            },
          }}
        />
      </body>
    </html>
  );
}
