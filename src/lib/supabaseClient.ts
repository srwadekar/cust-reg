// Lightweight typed Supabase Client wrapper
// Seamlessly delegates to browser global window.supabaseClient or window.supabase when available

export interface SupabaseQueryResponse<T = any> {
  data: T | null;
  error: any | null;
}

export const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.supabaseClient) return win.supabaseClient;
    if (win.supabase && typeof win.supabase.from === 'function') return win.supabase;
  }
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
  };
};

export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
};
