-- ============================================
-- GENERATIONS TABLE, INDEXES & RLS POLICIES
-- ============================================

CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'draft', 'failed')),
  preview TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient user-scoped queries and sorting
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_user_id_created_at_idx ON public.generations(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own generations." ON public.generations;
DROP POLICY IF EXISTS "Users can update their own generations." ON public.generations;
DROP POLICY IF EXISTS "Users can insert their own generations." ON public.generations;
DROP POLICY IF EXISTS "Users can delete their own generations." ON public.generations;

-- Generations RLS policies (Strict user data isolation)
CREATE POLICY "Users can view their own generations."
  ON public.generations FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can update their own generations."
  ON public.generations FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own generations."
  ON public.generations FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own generations."
  ON public.generations FOR DELETE
  USING ( auth.uid() = user_id );
