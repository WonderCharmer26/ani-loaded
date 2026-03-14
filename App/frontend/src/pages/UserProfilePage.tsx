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
  const [currentPassword, setCurrentPassword] = useState("");
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
      setCurrentPassword("");
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
      <div className="flex items-center justify-center min-h-screen bg-[#101114]">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#101114]">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-gray-400 mb-6">
            Please log in to view your profile.
          </p>
          <a
            href="/auth/login"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101114] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Your Profile</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium ${activeTab === "overview" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-white"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 font-medium ${activeTab === "settings" ? "text-blue-400 border-b-2 border-blue-400" : "text-gray-400 hover:text-white"}`}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Profile Overview */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Profile Overview</h2>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <img
                    src={
                      user.user_metadata?.avatar_url ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
                    }
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-600 cursor-pointer hover:border-gray-400"
                    onClick={() => setAvatarModalOpen(true)}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-white">
                    {user.user_metadata?.username || user.email}
                  </h3>
                  <p className="text-gray-400">
                    Member since{" "}
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                  <p
                    className="text-sm text-gray-500 mt-2 cursor-pointer hover:text-gray-400"
                    onClick={() => setAvatarModalOpen(true)}
                  >
                    Change Avatar
                  </p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Username
                  </label>
                  <p className="mt-1 text-white">
                    {user.user_metadata?.username || "Not set"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-white">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Account Created
                  </label>
                  <p className="mt-1 text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300">
                    Last Sign In
                  </label>
                  <p className="mt-1 text-white">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

            {/* Update Username Form */}
            <form onSubmit={handleUpdateUsername} className="space-y-4 mb-6">
              <h3 className="text-lg font-medium">Update Username</h3>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-300"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your username"
                />
              </div>

              <button
                type="submit"
                disabled={updatingUsername}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {updatingUsername ? "Updating..." : "Update Username"}
              </button>
            </form>

            {/* Change Password Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-lg font-medium">Change Password</h3>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-300"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-300"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>

              {settingsError && (
                <p className="text-red-500 text-sm">{settingsError}</p>
              )}
              {settingsSuccess && (
                <p className="text-green-500 text-sm">{settingsSuccess}</p>
              )}

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Update Password
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Avatar Selection Modal */}
      {avatarModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">
              Choose Your Avatar
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {avatarOptions.map((avatar, index) => (
                <img
                  key={index}
                  src={avatar}
                  alt={`Avatar ${index + 1}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-20 h-20 rounded-full object-cover cursor-pointer border-2 mx-auto ${
                    selectedAvatar === avatar
                      ? "border-blue-500"
                      : "border-gray-600 hover:border-gray-400"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setAvatarModalOpen(false);
                  setSelectedAvatar(null);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              {selectedAvatar && (
                <button
                  onClick={handleAvatarSelect}
                  disabled={updatingAvatar}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
