'use client';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useAuthSession() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) =>
      setSession(s),
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  return session;
}
