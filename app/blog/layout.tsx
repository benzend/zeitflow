import ClientProviders from '../components/ClientProviders';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientProviders>{children}</ClientProviders>;
}