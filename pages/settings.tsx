import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { Button } from "@/components/Button";
import ProfileDropdown from "@/components/ProfileDropdown";
import SubscriptionModal from "@/components/SubscriptionCard";

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [password, setPassword] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);



  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          confirmEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Account deleted successfully, redirect to home
        router.push("/");
      } else {
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("An error occurred while deleting your account");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setPassword("");
    setConfirmEmail("");
    setDeleteError("");
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setPassword("");
    setConfirmEmail("");
    setDeleteError("");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
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
              <Button href="/dashboard" variant="tertiary" className="!bg-transparent !p-0 hover:underline hover:text-foreground-light">
                Back to Dashboard
              </Button>
            </li>
          </ul>

          <div className="flex gap-4 items-center">
            <SubscriptionModal onSubscriptionChange={() => {}} />
            <ProfileDropdown />
          </div>
        </nav>

        <div className="bg-background-light rounded-lg p-8 shadow-lg">
          <h1 className="text-2xl font-bold text-foreground mb-8">Account Settings</h1>



          <div className="space-y-8">
            {/* Profile Information */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Profile Information</h2>
              <div className="bg-background-light-light p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name
                    </label>
                    <p className="text-gray-400">{session.user?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email
                    </label>
                    <p className="text-gray-400">{session.user?.email}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Subscription</h2>
              <div className="bg-background-light-light p-4 rounded-lg">
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
                <button 
                  onClick={openDeleteModal}
                  className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200"
                >
                  Delete Account
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-foreground mb-4">Delete Account</h3>
              
              {deleteStep === 1 && (
                <div>
                  <div className="mb-6">
                    <p className="text-foreground mb-4">
                      Are you sure you want to delete your account? This action cannot be undone.
                    </p>
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
                      <p className="text-sm text-red-400">
                        <strong>This will permanently delete:</strong>
                      </p>
                      <ul className="text-sm text-red-400 mt-2 space-y-1">
                        <li>• All your chains and chain steps</li>
                        <li>• All your queued chains and results</li>
                        <li>• Your subscription and billing information</li>
                        <li>• Your account and all associated data</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200"
                    >
                      Yes, Delete My Account
                    </Button>
                    <Button
                      onClick={closeDeleteModal}
                      className="flex-1 py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <form onSubmit={handleDeleteAccount}>
                  <div className="mb-6">
                    <p className="text-gray-400 mb-4">
                      To confirm deletion, please enter your password and email address.
                    </p>
                    
                    <div className="space-y-4">
                      {/* Only show password field for email/password users */}
                      {session.user?.email && (
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Password
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg bg-background text-foreground"
                            placeholder="Enter your password to confirm"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            If you signed up with Google, you can leave this blank
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Confirm Email
                        </label>
                        <input
                          type="email"
                          value={confirmEmail}
                          onChange={(e) => setConfirmEmail(e.target.value)}
                          placeholder={session.user?.email || ""}
                          className="w-full p-2 border border-gray-300 rounded-lg bg-background text-foreground"
                          required
                        />
                      </div>
                    </div>

                    {deleteError && (
                      <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {deleteError}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={deleteLoading}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition duration-200 disabled:opacity-50"
                    >
                      {deleteLoading ? "Deleting..." : "Delete Account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteStep(1)}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition duration-200"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 
