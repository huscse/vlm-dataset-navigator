'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { useAuthSession } from '../lib/useAuthSession';
import SearchResults from './SearchResults';
import { semanticSearch } from '../lib/api';
import TopNavBar from './TopNavBarHeader';
import HeroSection from './HeroSection';
import ProfileModal from './ProfileModal';
import Footer from './Footer';

export default function Header({ initialQuery }) {
  const router = useRouter();
  const session = useAuthSession();

  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Run search on mount if URL has query
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, false); // false = don't update URL
    }
  }, [initialQuery]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/land');
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const handleSearch = async (query, updateUrl = true) => {
    setError(null);
    setLoading(true);

    // Update URL with query (client-side)
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.pushState({}, '', url);
    }

    try {
      const data = await semanticSearch({ text: query, k: 12 });
      setResults(data.hits || []);
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

      <HeroSection onSearch={(q) => handleSearch(q, true)} loading={loading} />

      <SearchResults
        results={results}
        loading={loading}
        error={error}
        className="bg-[linear-gradient(180deg,#111827_0%,#000000_45%,#1F2937_95%)]"
      />

      <Footer />
    </div>
  );
}
