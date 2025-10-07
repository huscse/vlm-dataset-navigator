'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/useAuthSession';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import { searchDatasets } from '../lib/api';
import { User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  const router = useRouter();
  const session = useAuthSession();

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);

  // Open profile panel and fetch user info
  const handleProfile = async () => {
    setProfileError(null);
    setProfileLoading(true);
    setProfileOpen(true);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;
      if (user) {
        setProfile(user);

        const fullName =
          (user.user_metadata &&
            (user.user_metadata.full_name || user.user_metadata.name)) ||
          '';
        setName(fullName);
        setEmail(user.email || '');
      }
    } catch (err) {
      console.error('Failed to load profile', err);
      setProfileError(err?.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Update user metadata (display name)
  const handleUpdateProfile = async () => {
    setSaving(true);
    setProfileError(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (error) throw error;

      // update local profile object so UI updates immediately
      setProfile((p) =>
        p
          ? {
              ...p,
              user_metadata: { ...(p.user_metadata || {}), full_name: name },
            }
          : p,
      );
      setProfileOpen(false);
    } catch (err) {
      console.error('Update failed', err);
      setProfileError(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  // Search state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/land');
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  // Handle search
  const handleSearch = async (query) => {
    setError(null);
    setLoading(true);
    try {
      const res = await searchDatasets(query);
      setResults(res || []);
    } catch (err) {
      console.error('Search failed', err);
      setError(err.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111827_0%,#000000_45%,#1F2937_95%)] text-white">
      {/* Top navigation bar */}
      <div className="sticky top-2 bottom-2 z-10 bg-black/20 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/images/navislogodraft.png"
              alt="Navis Logo"
              width={100}
              height={40}
              priority
              className="object-contain text-white cursor-pointer"
            />
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {session && (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                Sign Out
              </button>
            )}
            <button
              onClick={handleProfile}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20 flex items-center justify-center"
              title="Profile"
              aria-label="Open profile"
            >
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center"
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !profileLoading && setProfileOpen(false)}
          />

          {/* panel */}
          <div className="relative z-10 w-full max-w-md mx-4 rounded-xl bg-[#0b1220]/80 border border-white/10 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-3">
              Your profile
            </h3>

            {profileLoading ? (
              <p className="text-slate-300">Loading…</p>
            ) : (
              <>
                <label className="block text-sm text-slate-300 mb-1">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-md bg-slate-800 text-white placeholder-slate-400 border border-white/5 mb-3 focus:outline-none focus:ring-2 focus:ring-slate-600"
                  placeholder="Full name"
                />

                <label className="block text-sm text-slate-300 mb-1">
                  Email
                </label>
                <input
                  value={email}
                  readOnly
                  className="w-full px-4 py-2 rounded-md bg-slate-900 text-slate-300 border border-white/5 mb-3 cursor-not-allowed"
                />

                {profileError && (
                  <p className="text-red-400 text-sm mb-2">{profileError}</p>
                )}

                <div className="mt-3 flex items-center justify-end gap-3">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="px-4 py-2 rounded-md bg-transparent border border-white/10 text-slate-300 hover:bg-white/5 transition"
                    type="button"
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdateProfile}
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                    type="button"
                    disabled={saving}
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero section with title and search */}
      <header className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          VLM-Driven{' '}
          <span className="text-slate-300 font-extrabold">Open Dataset</span>{' '}
          <br />
          Navigator
        </h1>

        <p className="mt-8 mb-19 text-slate-300 text-base sm:text-xl md:text-2xl">
          Search driving datasets with natural language
        </p>

        {/* Search bar */}
        <div className="mt-8">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search scenes, objects, or events…"
            loading={loading}
            className="max-w-3xl mx-auto"
          />
        </div>
      </header>

      {/* Search results */}
      <SearchResults results={results} loading={loading} error={error} />
    </div>
  );
}
