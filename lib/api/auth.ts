import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ApiError } from './errors';

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  return { supabase, user };
}

import type { User, SupabaseClient } from '@supabase/supabase-js';

// Higher-order function to wrap API routes with auth
export function withAuth(handler: (req: Request, user: User, supabase: SupabaseClient) => Promise<Response>) {
  return async (req: Request) => {
    try {
      const { user, supabase } = await getAuthenticatedUser();
      return await handler(req, user, supabase);
    } catch (error) {
      const { handleApiError } = await import('./errors');
      return handleApiError(error);
    }
  };
}
