import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/auth';
import { DbService } from '@/lib/api/services/db';

export const GET = withAuth(async (req: Request, user: any, supabase: any) => {
  // We can optionally verify DB access here
  const db = new DbService(supabase, user.id);
  
  // Just fetching profile to ensure RLS and DB connections are working
  await db.getProfile();

  return NextResponse.json({
    success: true,
    message: "Backend connection successful",
    user: {
      id: user.id
    }
  });
});
