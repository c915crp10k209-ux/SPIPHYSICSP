import { createClient } from '@supabase/supabase-js';

// Project Ref inferred from the publishable key ID
const SUPABASE_URL = 'https://h-0QKZ6dYN9gNa7ya67NuQ.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_h-0QKZ6dYN9gNa7ya67NuQ_xTvsYIWf';

// Using the service key for full synchronization of study data
const SUPABASE_SERVICE_KEY = 'sk_e54a1c9a3dc603b1607f47a7e007b88742ef14a0b2308625';

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Helper to check connection
export const checkCloudStatus = async () => {
  try {
    // Check if the user_sync table is reachable
    const { error } = await supabase.from('user_sync').select('user_id').limit(1);
    if (error && error.message === 'Failed to fetch') return false;
    return !error;
  } catch (e) {
    return false;
  }
};