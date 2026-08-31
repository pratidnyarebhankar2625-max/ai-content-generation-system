-- ============================================
-- 03_seo_analyses.sql
-- ============================================
-- Table and security policies for user SEO analyses

CREATE TABLE IF NOT EXISTS public.seo_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  focus_keyword TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  content TEXT,
  score INTEGER NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for user-scoped queries and historical sorting
CREATE INDEX IF NOT EXISTS seo_analyses_user_id_idx ON public.seo_analyses(user_id);
CREATE INDEX IF NOT EXISTS seo_analyses_user_id_created_at_idx ON public.seo_analyses(user_id, created_at DESC);

-- Trigger for updated_at auto-update
DROP TRIGGER IF EXISTS update_seo_analyses_updated_at ON public.seo_analyses;
CREATE TRIGGER update_seo_analyses_updated_at
  BEFORE UPDATE ON public.seo_analyses
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.seo_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own seo analyses." ON public.seo_analyses;
CREATE POLICY "Users can view their own seo analyses."
  ON public.seo_analyses FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own seo analyses." ON public.seo_analyses;
CREATE POLICY "Users can insert their own seo analyses."
  ON public.seo_analyses FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own seo analyses." ON public.seo_analyses;
CREATE POLICY "Users can update their own seo analyses."
  ON public.seo_analyses FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own seo analyses." ON public.seo_analyses;
CREATE POLICY "Users can delete their own seo analyses."
  ON public.seo_analyses FOR DELETE
  USING ( auth.uid() = user_id );
