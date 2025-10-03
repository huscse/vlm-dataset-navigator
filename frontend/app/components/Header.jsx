'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/useAuthSession';

export default function Header() {
  const router = useRouter();
  const session = useAuthSession();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/land');
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#111827_0%,#000000_45%,#1F2937_95%)] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-black/20 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="text-xl text-white font-bold text-slate-300">
            Navis
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Only show Sign Out when session exists */}
            {session ? (
              <button
                onClick={handleSignOut}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-600"
              >
                Sign Out
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Hero / Title */}
      <header className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-10 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight">
          VLM-Driven{' '}
          <span className="text-slate-300 font-extrabold">Open Dataset</span>{' '}
          Navigator
        </h1>

        <p className="mt-4 text-slate-300 text-base sm:text-xl md:text-2xl">
          Search driving datasets with natural language
        </p>
      </header>

      {/* <SearchBar /> */}
    </div>
  );
}
