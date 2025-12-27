import React, { useState } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import Navigation from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AssetLibrary } from '@/components/AssetLibrary';
import { AssetUpload } from '@/components/AssetUpload';
import Head from 'next/head';

interface AssetLibraryPageProps {}

const AssetLibraryPage: React.FC<AssetLibraryPageProps> = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = (assets: any[]) => {
    // Refresh the asset library
    setRefreshKey(prev => prev + 1);
    setShowUpload(false);
  };

  return (
    <>
      <Head>
        <title>Asset Library | ZeitFlow</title>
        <meta name="description" content="Manage your media assets and images" />
      </Head>
      
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-4 py-8 mt-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">Asset Library</h1>
            <p className="text-text-muted">
              Upload and manage your media assets for use in blog posts and workflows.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-border">
              <div className="flex space-x-8">
                <button
                  onClick={() => setShowUpload(false)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    !showUpload
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  Browse Assets
                </button>
                <button
                  onClick={() => setShowUpload(true)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    showUpload
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-muted hover:text-text'
                  }`}
                >
                  Upload New
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {showUpload ? (
            <AssetUpload onUploadComplete={handleUploadComplete} />
          ) : (
            <AssetLibrary 
              key={refreshKey}
              onAssetSelect={(asset) => {
                // Handle asset selection - could open modal with options
                console.log('Selected asset:', asset);
              }}
              allowMultiple={true}
            />
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AssetLibraryPage;

// Protect the page - only authenticated users can access
export async function getServerSideProps(context: any) {
  const session = await getServerSession(context.req, context.res, authOptions);
  
  if (!session?.user?.email) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  return {
    props: {
      session,
    },
  };
}
