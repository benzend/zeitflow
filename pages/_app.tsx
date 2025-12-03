import '../app/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { VemetricScript } from '@vemetric/react';
import 'react-tippy/dist/tippy.css';
import { ThemeProvider } from '@/lib/theme-context';

export default function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <VemetricScript token={process.env.NEXT_PUBLIC_VEMETRIC_TOKEN!} />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
