'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/useAuthSession';
import SearchResults from './SearchResults';
import { searchDatasets } from '../lib/api';
import TopNavBar from './TopNavBarHeader';
import HeroSection from './HeroSection';
import ProfileModal from './ProfileModal';

export default function Header() {
  const router = useRouter();
  const session = useAuthSession();

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);

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
      <TopNavBar
        session={session}
        onSignOut={handleSignOut}
        onProfileClick={() => setProfileOpen(true)}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />

      <HeroSection onSearch={handleSearch} loading={loading} />

      <SearchResults results={results} loading={loading} error={error} />
    </div>
  );
}
