-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Create user_settings table
CREATE TABLE public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' NOT NULL,
  language TEXT DEFAULT 'en-US' NOT NULL,
  writing_tone TEXT DEFAULT 'professional' NOT NULL,
  default_ai_model TEXT DEFAULT 'gemini-2.5-pro' NOT NULL,
  byok_api_key TEXT, -- Bring Your Own Key
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  generation_alerts BOOLEAN DEFAULT true
);

-- Enable RLS for user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User Settings RLS policies
CREATE POLICY "Users can view their own settings."
  ON public.user_settings FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own settings."
  ON public.user_settings FOR UPDATE
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert their own settings."
  ON public.user_settings FOR INSERT
  WITH CHECK ( auth.uid() = id );


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
  );

  -- Insert into user_settings
  INSERT INTO public.user_settings (id)
  VALUES (new.id);

  RETURN new;
END;
$$;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
