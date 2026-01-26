import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/dashboard?tab=workflows',
      permanent: true,
    },
  };
};

// This component will never be rendered due to the redirect,
// but Next.js requires a default export
export default function Workflows() {
  return null;
}
