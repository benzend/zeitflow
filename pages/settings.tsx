import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProfileDropdown from "@/components/ProfileDropdown";
import SubscriptionModal from "@/components/SubscriptionCard";

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Simulate saving settings
    setTimeout(() => {
      setMessage("Settings saved successfully!");
      setLoading(false);
    }, 1000);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <Head>
        <title>Account Settings - jjoist</title>
        <meta name="description" content="Manage your account settings" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-10 max-w-4xl min-h-[90vh]">
        <nav className="mb-10 flex justify-between items-center">
          <ul className="flex gap-4">
            <li>
              <Link href="/dashboard">
                <span className="text-primary hover:underline hover:text-primary-light transition duration-200">
                  Back to Dashboard
                </span>
              </Link>
            </li>
          </ul>

          <div className="flex gap-4 items-center">
            <SubscriptionModal onSubscriptionChange={() => {}} />
            <ProfileDropdown />
          </div>
        </nav>

        <div className="bg-foreground rounded-lg p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-primary mb-8">Account Settings</h1>

          {message && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {message}
            </div>
          )}

          <div className="space-y-8">
            {/* Profile Information */}
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">Profile Information</h2>
              <div className="bg-foreground-light p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Name
                    </label>
                    <p className="text-gray-400">{session.user?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">
                      Email
                    </label>
                    <p className="text-gray-400">{session.user?.email}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section>
              <h2 className="text-xl font-semibold text-primary mb-4">Subscription</h2>
              <div className="bg-foreground-light p-4 rounded-lg">
                <p className="text-gray-400 mb-4">
                  Manage your subscription and billing information.
                </p>
                <SubscriptionModal onSubscriptionChange={() => {}} />
              </div>
            </section>

            {/* Danger Zone */}
            <section>
              <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                <p className="text-gray-400 mb-4">
                  These actions cannot be undone. Please be careful.
                </p>
                <button className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200">
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
} 