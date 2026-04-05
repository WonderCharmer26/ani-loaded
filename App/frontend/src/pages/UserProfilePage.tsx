import React, { useEffect, useState } from "react";
import {
  signOutUser,
  updateUserMetadata,
  updateUserPassword,
} from "../services/supabase/supabaseAuth";

// supabases built in user class
import { useAuthContext } from "../services/supabase/hooks/AuthProvider";

export default function UserProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [updatingUsername, setUpdatingUsername] = useState(false);

  // Read shared auth state from provider so every page uses the same source.
  const { user, loading, refreshUser } = useAuthContext();

  // Keep form field in sync when auth user metadata updates.
  useEffect(() => {
    setUsername(user?.user_metadata?.username || "");
  }, [user]);

  // Predefined anime avatars
  const avatarOptions = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=anime1",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=anime2",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=anime3",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=anime4",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=anime5",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=anime6",
  ];

  //TODO: might make a function that can be reused
  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (error) {
      console.error("Error signing out:", error);
    } else {
      window.location.href = "/"; // Redirect to home after sign out
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsSuccess("");

    if (newPassword !== confirmPassword) {
      setSettingsError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setSettingsError("Password must be at least 6 characters");
      return;
    }

    const { error } = await updateUserPassword(newPassword);
    if (error) {
      setSettingsError(error.message);
    } else {
      setSettingsSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      await refreshUser();
    }
  };

  const handleAvatarSelect = async () => {
    if (!selectedAvatar || !user) return;

    setUpdatingAvatar(true);
    setSettingsError("");
    setSettingsSuccess("");

    const { error } = await updateUserMetadata({ avatar_url: selectedAvatar });

    if (error) {
      console.error("Error updating avatar:", error);
      setSettingsError("Error updating avatar");
    } else {
      setSettingsSuccess("Avatar updated successfully!");
      // Refresh user data
      await refreshUser();
      // reset
      setSelectedAvatar(null);
      setAvatarModalOpen(false); // Close modal
    }
    setUpdatingAvatar(false);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError("");
    setSettingsSuccess("");

    if (username.trim().length < 3) {
      setSettingsError("Username must be at least 3 characters");
      return;
    }

    setUpdatingUsername(true);
    const { error } = await updateUserMetadata({ username: username.trim() });

    if (error) {
      setSettingsError(error.message);
    } else {
      setSettingsSuccess("Username updated successfully!");
      // Refresh user data
      await refreshUser();
    }
    // loading state
    setUpdatingUsername(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="border border-slate-700 p-8 rounded-xl w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Not Logged In</h1>
          <p className="text-slate-400">
            Please log in to view your profile.
          </p>
          <a
            href="/auth/login"
            className="inline-block rounded-xl bg-[#0066a5] px-6 py-2.5 font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.username || user.email;
  const avatarUrl =
    user.user_metadata?.avatar_url ||
    "https://api.dicebear.com/7.x/avataaars/svg?seed=default";

  return (
    <div className="px-6 py-10 space-y-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Header Banner */}
        <section className="relative rounded-xl border border-slate-700 overflow-hidden">
          {/* Banner background */}
          <div className="h-32 bg-gradient-to-r from-[#0d3853] to-[#3CB4FF]" />

          {/* Profile info overlapping the banner */}
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-slate-900 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setAvatarModalOpen(true)}
              />
              <div className="text-center sm:text-left sm:pb-1">
                <h1 className="text-2xl font-bold text-white">{displayName}</h1>
                <p className="text-sm text-slate-400">
                  Member since{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="sm:ml-auto flex gap-2 sm:pb-1">
                <button
                  type="button"
                  onClick={() => setAvatarModalOpen(true)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Change Avatar
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-700">
          {["overview", "settings"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? "text-[#3CB4FF] border-b-2 border-[#3CB4FF]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Account Information */}
            <div className="rounded-xl border border-slate-700 p-6 space-y-5">
              <h2 className="text-lg font-bold text-white">Account Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="Username" value={user.user_metadata?.username || "Not set"} />
                <InfoField label="Email" value={user.email || "N/A"} />
                <InfoField label="Account Created" value={new Date(user.created_at).toLocaleDateString()} />
                <InfoField
                  label="Last Sign In"
                  value={
                    user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : "N/A"
                  }
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Status messages */}
            {settingsError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {settingsSuccess}
              </div>
            )}

            {/* Update Username */}
            <div className="rounded-xl border border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Update Username</h2>
              <form onSubmit={handleUpdateUsername} className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-slate-200 mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                    placeholder="Enter your username"
                  />
                </div>
                <button
                  type="submit"
                  disabled={updatingUsername}
                  className="rounded-lg bg-[#0066a5] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {updatingUsername ? "Updating..." : "Update Username"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border border-slate-700 p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-semibold text-slate-200 mb-1"
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-slate-200 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                    placeholder="Confirm new password"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0066a5] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Avatar Selection Modal */}
      {avatarModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="border border-slate-700 bg-slate-900 p-6 rounded-xl shadow-2xl max-w-md w-full mx-4 space-y-5">
            <h3 className="text-xl font-bold text-white text-center">
              Choose Your Avatar
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {avatarOptions.map((avatar, index) => (
                <img
                  key={index}
                  src={avatar}
                  alt={`Avatar ${index + 1}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-20 h-20 rounded-full object-cover cursor-pointer border-2 mx-auto transition-colors ${
                    selectedAvatar === avatar
                      ? "border-[#3CB4FF]"
                      : "border-slate-600 hover:border-slate-400"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setAvatarModalOpen(false);
                  setSelectedAvatar(null);
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              {selectedAvatar && (
                <button
                  type="button"
                  onClick={handleAvatarSelect}
                  disabled={updatingAvatar}
                  className="rounded-lg bg-[#0066a5] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {updatingAvatar ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// small helper component for displaying read-only info fields
function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}
