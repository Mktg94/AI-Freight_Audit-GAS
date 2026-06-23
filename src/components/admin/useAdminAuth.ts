import { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) { setIsAdmin(false); setIsLoading(false); }
          return;
        }

        setUser(session.user);

        const res = await fetch('/api/admin/check', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();

        if (!cancelled) {
          setIsAdmin(!!data.isAdmin);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) { setIsAdmin(false); setIsLoading(false); }
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return { isAdmin, isLoading, user };
}
