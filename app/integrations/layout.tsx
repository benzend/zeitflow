import ClientProviders from '../components/ClientProviders';

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientProviders>{children}</ClientProviders>;
}
