import '../app/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { VemetricScript } from '@vemetric/react';
import Script from 'next/script';
import 'react-tippy/dist/tippy.css';
import { ThemeProvider } from '@/lib/theme-context';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session} refetchOnWindowFocus={false}>
      <VemetricScript token={process.env.NEXT_PUBLIC_VEMETRIC_TOKEN!} />
      <Script
        src="//code.tidio.co/qfp6hlzegcbsjrwby6jjkdgmftsq71se.js"
        strategy="lazyOnload"
      />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}
