-- Migration: 04_performance_indexes.sql
-- Add composite performance indexes for history filtering, template query speed, and sorting

CREATE INDEX IF NOT EXISTS generations_user_id_word_count_idx ON public.generations(user_id, word_count DESC);
CREATE INDEX IF NOT EXISTS generations_user_id_category_created_at_idx ON public.generations(user_id, category, created_at DESC);
CREATE INDEX IF NOT EXISTS generations_user_id_status_created_at_idx ON public.generations(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS user_templates_user_id_is_favorite_idx ON public.user_templates(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS user_templates_user_id_category_idx ON public.user_templates(user_id, category);
CREATE INDEX IF NOT EXISTS user_templates_user_id_created_at_idx ON public.user_templates(user_id, created_at DESC);
