-- ============================================
-- WRITEORA COMPLETE DATABASE SCHEMA
-- ============================================
-- Complete, hardened schema for profiles, user_settings,
-- generations, and user_templates with RLS, triggers & indexes.

-- ============================================
-- EXTENSIONS
-- ============================================
-- Rely on standard PostgreSQL UUID generator gen_random_uuid() available in PG 13+.

-- ============================================
-- REUSABLE TRIGGER FUNCTIONS
-- ============================================

-- Function to auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

-- Function to automatically create profile and settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into user_settings
  INSERT INTO public.user_settings (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

-- ============================================
-- TABLES
-- ============================================

-- --------------------------------------------
-- 1. profiles
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------
-- 2. user_settings
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' NOT NULL,
  language TEXT DEFAULT 'en-US' NOT NULL,
  writing_tone TEXT DEFAULT 'professional' NOT NULL,
  default_ai_model TEXT DEFAULT 'gemini-2.5-pro' NOT NULL,
  byok_api_key TEXT, -- Bring Your Own Key (Protected server-side)
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  generation_alerts BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------
-- 3. generations
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'draft', 'failed')),
  preview TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------
-- 5. seo_analyses
-- --------------------------------------------
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

-- ============================================
-- INDEXES
-- ============================================

-- Generations indexes for fast user-scoped querying, filtering, and sorting
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_user_id_created_at_idx ON public.generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generations_user_id_category_idx ON public.generations(user_id, category);
CREATE INDEX IF NOT EXISTS generations_user_id_status_idx ON public.generations(user_id, status);

-- User Templates indexes
CREATE INDEX IF NOT EXISTS user_templates_user_id_idx ON public.user_templates(user_id);

-- SEO Analyses indexes
CREATE INDEX IF NOT EXISTS seo_analyses_user_id_idx ON public.seo_analyses(user_id);
CREATE INDEX IF NOT EXISTS seo_analyses_user_id_created_at_idx ON public.seo_analyses(user_id, created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger on auth.users for profile/settings auto-creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Triggers for updated_at auto-update
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_generations_updated_at ON public.generations;
CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_templates_updated_at ON public.user_templates;
CREATE TRIGGER update_user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_analyses_updated_at ON public.seo_analyses;
CREATE TRIGGER update_seo_analyses_updated_at
  BEFORE UPDATE ON public.seo_analyses
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_analyses ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- Profiles RLS policies
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- --------------------------------------------
-- User Settings RLS policies
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view their own settings." ON public.user_settings;
CREATE POLICY "Users can view their own settings."
  ON public.user_settings FOR SELECT
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update their own settings." ON public.user_settings;
CREATE POLICY "Users can update their own settings."
  ON public.user_settings FOR UPDATE
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert their own settings." ON public.user_settings;
CREATE POLICY "Users can insert their own settings."
  ON public.user_settings FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- --------------------------------------------
-- Generations RLS policies
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view their own generations." ON public.generations;
CREATE POLICY "Users can view their own generations."
  ON public.generations FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own generations." ON public.generations;
CREATE POLICY "Users can update their own generations."
  ON public.generations FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own generations." ON public.generations;
CREATE POLICY "Users can insert their own generations."
  ON public.generations FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own generations." ON public.generations;
CREATE POLICY "Users can delete their own generations."
  ON public.generations FOR DELETE
  USING ( auth.uid() = user_id );

-- --------------------------------------------
-- User Templates RLS policies
-- --------------------------------------------
DROP POLICY IF EXISTS "Users can view their own templates." ON public.user_templates;
CREATE POLICY "Users can view their own templates."
  ON public.user_templates FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own templates." ON public.user_templates;
CREATE POLICY "Users can update their own templates."
  ON public.user_templates FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own templates." ON public.user_templates;
CREATE POLICY "Users can insert their own templates."
  ON public.user_templates FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own templates." ON public.user_templates;
CREATE POLICY "Users can delete their own templates."
  ON public.user_templates FOR DELETE
  USING ( auth.uid() = user_id );

-- --------------------------------------------
-- SEO Analyses RLS policies
-- --------------------------------------------
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

-- --------------------------------------------
-- 6. ai_usage_logs
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attempt', 'completed', 'failed')),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Usage Indexes for fast quota checking and reporting
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_created_at_idx ON public.ai_usage_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_endpoint_idx ON public.ai_usage_logs(user_id, endpoint, created_at DESC);

-- Trigger for updated_at auto-update
DROP TRIGGER IF EXISTS update_ai_usage_logs_updated_at ON public.ai_usage_logs;
CREATE TRIGGER update_ai_usage_logs_updated_at
  BEFORE UPDATE ON public.ai_usage_logs
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- --------------------------------------------
-- AI Usage Logs RLS policies
-- --------------------------------------------
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own usage logs." ON public.ai_usage_logs;
CREATE POLICY "Users can view their own usage logs."
  ON public.ai_usage_logs FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own usage logs." ON public.ai_usage_logs;
CREATE POLICY "Users can insert their own usage logs."
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own usage logs." ON public.ai_usage_logs;
CREATE POLICY "Users can update their own usage logs."
  ON public.ai_usage_logs FOR UPDATE
  USING ( auth.uid() = user_id );

-- ============================================
-- ATOMIC RATE LIMITING & USAGE RPC FUNCTIONS
-- ============================================

-- Function to check quotas and atomically reserve an AI request slot
CREATE OR REPLACE FUNCTION public.check_and_reserve_ai_quota(
  p_user_id UUID,
  p_endpoint TEXT,
  p_model TEXT,
  p_burst_limit INT,
  p_daily_limit INT,
  p_monthly_limit INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_burst_count INT;
  v_daily_count INT;
  v_monthly_count INT;
  v_new_usage_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
BEGIN
  -- 1. Lock user's usage entries for current check timeframe to prevent race conditions
  PERFORM id FROM public.ai_usage_logs WHERE user_id = p_user_id AND created_at >= (v_now - interval '60 seconds') FOR UPDATE;

  -- 2. Count per-minute endpoint burst attempts
  SELECT COUNT(*) INTO v_burst_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at >= (v_now - interval '60 seconds');

  IF v_burst_count >= p_burst_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'burst_exceeded', 'usage_id', NULL);
  END IF;

  -- 3. Count global daily attempts across all AI endpoints in current UTC day
  SELECT COUNT(*) INTO v_daily_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('day', v_now);

  IF v_daily_count >= p_daily_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_exceeded', 'usage_id', NULL);
  END IF;

  -- 4. Count global monthly attempts across all AI endpoints in current UTC month
  SELECT COUNT(*) INTO v_monthly_count
  FROM public.ai_usage_logs
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', v_now);

  IF v_monthly_count >= p_monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_exceeded', 'usage_id', NULL);
  END IF;

  -- 5. All quota checks passed: Reserve request slot atomically
  INSERT INTO public.ai_usage_logs (user_id, endpoint, model, status, created_at, updated_at)
  VALUES (p_user_id, p_endpoint, p_model, 'attempt', v_now, v_now)
  RETURNING id INTO v_new_usage_id;

  RETURN jsonb_build_object('allowed', true, 'usage_id', v_new_usage_id);
END;
$$;

-- Function to update status and token usage of an existing AI request log
CREATE OR REPLACE FUNCTION public.update_ai_usage_status(
  p_usage_id UUID,
  p_user_id UUID,
  p_status TEXT,
  p_prompt_tokens INT DEFAULT NULL,
  p_completion_tokens INT DEFAULT NULL,
  p_total_tokens INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.ai_usage_logs
  SET
    status = p_status,
    prompt_tokens = p_prompt_tokens,
    completion_tokens = p_completion_tokens,
    total_tokens = p_total_tokens,
    error_message = p_error_message,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_usage_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$;


