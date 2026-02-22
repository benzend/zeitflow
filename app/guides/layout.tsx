import ClientProviders from '../components/ClientProviders';

export default function GuidesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientProviders>{children}</ClientProviders>;
}
