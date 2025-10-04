'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/useAuthSession';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import { searchDatasets } from '../lib/api';

export default function Header() {
  const router = useRouter();
  const session = useAuthSession();

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
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="text-xl font-bold text-white">Navis.</div>

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
          </div>
        </div>
      </div>

      {/* Hero section with title and search */}
      <header className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-16 pb-8 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight">
          VLM-Driven{' '}
          <span className="text-slate-300 font-extrabold">Open Dataset</span>{' '}
          Navigator
        </h1>

        <p className="mt-4 text-slate-300 text-base sm:text-xl md:text-2xl">
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
