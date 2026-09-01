import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ApiError } from './errors';

export async function getAuthenticatedUser() {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch {
    throw new ApiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

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
export function withAuth<T = any>(
  handler: (req: Request, user: User, supabase: SupabaseClient, context?: T) => Promise<Response>
) {
  return async (req: Request, context?: T) => {
    try {
      const { user, supabase } = await getAuthenticatedUser();
      return await handler(req, user, supabase, context);
    } catch (error) {
      const { handleApiError } = await import('./errors');
      return handleApiError(error);
    }
  };
}

