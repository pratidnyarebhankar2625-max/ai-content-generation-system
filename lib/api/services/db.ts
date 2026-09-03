import { ApiError } from '../errors';
import type { SupabaseClient } from '@supabase/supabase-js';

export type ProfileRecord = {
  id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  joined_date: string;
  updated_at?: string;
};

export type GenerationRecord = {
  id: string;
  user_id: string;
  title: string;
  template: string;
  category: string;
  status: 'completed' | 'draft' | 'failed';
  preview: string;
  word_count: number;
  created_at: string;
  updated_at?: string;
};

export type UserSettingsRecord = {
  id: string;
  theme: string;
  language: string;
  writing_tone: string;
  default_ai_model: string;
  email_notifications: boolean;
  push_notifications: boolean;
  generation_alerts: boolean;
  updated_at?: string;
};

export type UserTemplateRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  is_favorite: boolean;
  created_at: string;
  updated_at?: string;
};

export type SeoAnalysisRecord = {
  id: string;
  user_id: string;
  focus_keyword: string;
  meta_title?: string | null;
  meta_description?: string | null;
  content?: string | null;
  score: number;
  analysis_result: Record<string, any>;
  created_at: string;
  updated_at?: string;
};

export type AiUsageRecord = {
  id: string;
  user_id: string;
  endpoint: string;
  model: string;
  status: 'attempt' | 'completed' | 'failed';
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
};


export type QueryTemplatesParams = {
  search?: string;
  category?: string;
  favorite?: boolean;
  sortBy?: 'newest' | 'oldest' | 'title' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type QueryTemplatesResult = {
  items: UserTemplateRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type QueryGenerationsParams = {
  search?: string;
  category?: string;
  status?: 'completed' | 'draft' | 'failed' | 'all';
  sortBy?: 'newest' | 'oldest' | 'words' | 'title' | 'created_at' | 'word_count';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type QueryGenerationsResult = {
  items: GenerationRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export class DbService {
  constructor(private supabase: SupabaseClient, private userId: string) {}

  // ─── Profile Operations ───────────────────────────────────────────────────

  async getProfile(): Promise<ProfileRecord> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.userId)
      .maybeSingle();

    if (error) {
      throw new ApiError(`Failed to fetch profile: ${error.message}`, 'DB_ERROR', 500);
    }
    if (!data) {
      throw new ApiError('Profile not found', 'NOT_FOUND', 404);
    }
    return data as ProfileRecord;
  }

  async updateProfile(updates: {
    name?: string;
    avatar?: string | null;
    bio?: string | null;
  }): Promise<ProfileRecord> {
    const updatePayload: Record<string, any> = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.avatar !== undefined) updatePayload.avatar = updates.avatar;
    if (updates.bio !== undefined) updatePayload.bio = updates.bio;

    const { data, error } = await this.supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', this.userId)
      .select()
      .maybeSingle();

    if (error) {
      throw new ApiError(`Failed to update profile: ${error.message}`, 'DB_ERROR', 500);
    }
    if (!data) {
      throw new ApiError('Profile not found or unauthorized', 'NOT_FOUND', 404);
    }
    return data as ProfileRecord;
  }

  // ─── User Settings Operations ─────────────────────────────────────────────

  async getUserSettings(): Promise<UserSettingsRecord> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('id, theme, language, writing_tone, default_ai_model, email_notifications, push_notifications, generation_alerts, updated_at')
      .eq('id', this.userId)
      .maybeSingle();

    if (error) {
      throw new ApiError(`Failed to fetch settings: ${error.message}`, 'DB_ERROR', 500);
    }
    if (!data) {
      throw new ApiError('User settings not found', 'NOT_FOUND', 404);
    }
    return data as UserSettingsRecord;
  }

  async getGenerationSettings(): Promise<Pick<UserSettingsRecord, 'writing_tone' | 'language' | 'default_ai_model'>> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('writing_tone, language, default_ai_model')
      .eq('id', this.userId)
      .maybeSingle();

    if (error || !data) {
      return {
        writing_tone: 'professional',
        language: 'en-US',
        default_ai_model: 'gemini-2.5-pro',
      };
    }
    return data as Pick<UserSettingsRecord, 'writing_tone' | 'language' | 'default_ai_model'>;
  }

  async updateSettings(updates: {
    theme?: string;
    language?: string;
    writing_tone?: string;
    default_ai_model?: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    generation_alerts?: boolean;
  }): Promise<UserSettingsRecord> {
    const updatePayload: Record<string, any> = {};
    if (updates.theme !== undefined) updatePayload.theme = updates.theme;
    if (updates.language !== undefined) updatePayload.language = updates.language;
    if (updates.writing_tone !== undefined) updatePayload.writing_tone = updates.writing_tone;
    if (updates.default_ai_model !== undefined) updatePayload.default_ai_model = updates.default_ai_model;
    if (updates.email_notifications !== undefined) updatePayload.email_notifications = updates.email_notifications;
    if (updates.push_notifications !== undefined) updatePayload.push_notifications = updates.push_notifications;
    if (updates.generation_alerts !== undefined) updatePayload.generation_alerts = updates.generation_alerts;

    const { data, error } = await this.supabase
      .from('user_settings')
      .update(updatePayload)
      .eq('id', this.userId)
      .select('id, theme, language, writing_tone, default_ai_model, email_notifications, push_notifications, generation_alerts, updated_at')
      .maybeSingle();

    if (error) {
      throw new ApiError(`Failed to update settings: ${error.message}`, 'DB_ERROR', 500);
    }
    if (!data) {
      throw new ApiError('User settings not found or unauthorized', 'NOT_FOUND', 404);
    }
    return data as UserSettingsRecord;
  }

  async getGenerations(limit: number = 10): Promise<GenerationRecord[]> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new ApiError('Failed to fetch generations', 'DB_ERROR', 500);
    }
    return data as GenerationRecord[];
  }

  async queryGenerations(params: QueryGenerationsParams = {}): Promise<QueryGenerationsResult> {
    let query = this.supabase
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', this.userId);

    // Filter by status if provided and not 'all'
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    // Filter by category if provided and not 'all'
    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }

    // Filter by search query (across title, template, and preview)
    if (params.search && params.search.trim()) {
      const sanitized = params.search.trim().replace(/[%_,()]/g, '');
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,template.ilike.%${sanitized}%,preview.ilike.%${sanitized}%`);
      }
    }

    // Sorting
    let sortColumn = 'created_at';
    let ascending = false;

    if (params.sortBy === 'oldest') {
      sortColumn = 'created_at';
      ascending = true;
    } else if (params.sortBy === 'words' || params.sortBy === 'word_count') {
      sortColumn = 'word_count';
      ascending = params.sortOrder === 'asc';
    } else if (params.sortBy === 'title') {
      sortColumn = 'title';
      ascending = params.sortOrder !== 'desc';
    } else if (params.sortBy === 'newest' || params.sortBy === 'created_at') {
      sortColumn = 'created_at';
      ascending = params.sortOrder === 'asc';
    }

    query = query.order(sortColumn, { ascending });

    // Pagination
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(`Failed to query generations: ${error.message}`, 'DB_ERROR', 500);
    }

    const total = count ?? (data?.length || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: (data || []) as GenerationRecord[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getGenerationById(id: string): Promise<GenerationRecord | null> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') {
        return null;
      }
      throw new ApiError(`Failed to fetch generation: ${error.message}`, 'DB_ERROR', 500);
    }
    return data as GenerationRecord | null;
  }

  async createGeneration(params: {
    id?: string;
    title: string;
    template: string;
    category: string;
    status: 'completed' | 'draft' | 'failed';
    preview: string;
    word_count?: number;
    created_at?: string;
  }): Promise<GenerationRecord> {
    const insertPayload: Record<string, any> = {
      user_id: this.userId,
      title: params.title,
      template: params.template,
      category: params.category,
      status: params.status,
      preview: params.preview,
      word_count: params.word_count ?? 0,
    };

    if (params.id) {
      insertPayload.id = params.id;
    }
    if (params.created_at) {
      insertPayload.created_at = params.created_at;
    }

    const { data, error } = await this.supabase
      .from('generations')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new ApiError(`Failed to save generation: ${error.message}`, 'DB_ERROR', 500);
    }

    return data as GenerationRecord;
  }

  async updateGeneration(
    id: string,
    updates: {
      title?: string;
      template?: string;
      category?: string;
      status?: 'completed' | 'draft' | 'failed';
      preview?: string;
      word_count?: number;
      created_at?: string;
    }
  ): Promise<GenerationRecord> {
    const updatePayload: Record<string, any> = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.template !== undefined) updatePayload.template = updates.template;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.preview !== undefined) updatePayload.preview = updates.preview;
    if (updates.word_count !== undefined) updatePayload.word_count = updates.word_count;
    if (updates.created_at !== undefined) updatePayload.created_at = updates.created_at;

    const { data, error } = await this.supabase
      .from('generations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '22P02') {
        throw new ApiError('Invalid generation ID format', 'VALIDATION_ERROR', 400);
      }
      throw new ApiError(`Failed to update generation: ${error.message}`, 'DB_ERROR', 500);
    }

    if (!data) {
      throw new ApiError('Generation not found or unauthorized', 'NOT_FOUND', 404);
    }

    return data as GenerationRecord;
  }

  async deleteGeneration(id: string): Promise<GenerationRecord> {
    const { data, error } = await this.supabase
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '22P02') {
        throw new ApiError('Invalid generation ID format', 'VALIDATION_ERROR', 400);
      }
      throw new ApiError(`Failed to delete generation: ${error.message}`, 'DB_ERROR', 500);
    }

    if (!data) {
      throw new ApiError('Generation not found or unauthorized', 'NOT_FOUND', 404);
    }

    return data as GenerationRecord;
  }

  // ─── User Templates Operations ──────────────────────────────────────────────

  async getTemplates(params: QueryTemplatesParams = {}): Promise<QueryTemplatesResult> {
    let query = this.supabase
      .from('user_templates')
      .select('*', { count: 'exact' })
      .eq('user_id', this.userId);

    // Filter by favorite
    if (params.favorite === true) {
      query = query.eq('is_favorite', true);
    }

    // Filter by category if provided and not 'all' or 'Favorites'
    if (
      params.category &&
      params.category.toLowerCase() !== 'all' &&
      params.category.toLowerCase() !== 'favorites'
    ) {
      query = query.eq('category', params.category);
    }

    // Filter by search query (across title, description, content)
    if (params.search && params.search.trim()) {
      const sanitized = params.search.trim().replace(/[%_,()]/g, '');
      if (sanitized) {
        query = query.or(
          `title.ilike.%${sanitized}%,description.ilike.%${sanitized}%,content.ilike.%${sanitized}%`
        );
      }
    }

    // Sorting
    let sortColumn = 'created_at';
    let ascending = false;

    if (params.sortBy === 'oldest') {
      sortColumn = 'created_at';
      ascending = true;
    } else if (params.sortBy === 'title') {
      sortColumn = 'title';
      ascending = params.sortOrder !== 'desc';
    } else if (params.sortBy === 'updated_at') {
      sortColumn = 'updated_at';
      ascending = params.sortOrder === 'asc';
    } else if (params.sortBy === 'newest' || params.sortBy === 'created_at') {
      sortColumn = 'created_at';
      ascending = params.sortOrder === 'asc';
    }

    query = query.order(sortColumn, { ascending });

    // Pagination
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(`Failed to query templates: ${error.message}`, 'DB_ERROR', 500);
    }

    const total = count ?? (data?.length || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: (data || []) as UserTemplateRecord[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getTemplateById(id: string): Promise<UserTemplateRecord | null> {
    const { data, error } = await this.supabase
      .from('user_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') {
        return null;
      }
      throw new ApiError(`Failed to fetch template: ${error.message}`, 'DB_ERROR', 500);
    }
    return data as UserTemplateRecord | null;
  }

  async createTemplate(params: {
    id?: string;
    title: string;
    description: string;
    category: string;
    content?: string;
    is_favorite?: boolean;
  }): Promise<UserTemplateRecord> {
    const insertPayload: Record<string, any> = {
      user_id: this.userId,
      title: params.title,
      description: params.description,
      category: params.category,
      content: params.content ?? '',
      is_favorite: params.is_favorite ?? false,
    };

    if (params.id) {
      insertPayload.id = params.id;
    }

    const { data, error } = await this.supabase
      .from('user_templates')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new ApiError(`Failed to save template: ${error.message}`, 'DB_ERROR', 500);
    }

    return data as UserTemplateRecord;
  }

  async updateTemplate(
    id: string,
    updates: {
      title?: string;
      description?: string;
      category?: string;
      content?: string;
      is_favorite?: boolean;
    }
  ): Promise<UserTemplateRecord> {
    const updatePayload: Record<string, any> = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.description !== undefined) updatePayload.description = updates.description;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.content !== undefined) updatePayload.content = updates.content;
    if (updates.is_favorite !== undefined) updatePayload.is_favorite = updates.is_favorite;

    const { data, error } = await this.supabase
      .from('user_templates')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '22P02') {
        throw new ApiError('Invalid template ID format', 'VALIDATION_ERROR', 400);
      }
      throw new ApiError(`Failed to update template: ${error.message}`, 'DB_ERROR', 500);
    }

    if (!data) {
      throw new ApiError('Template not found or unauthorized', 'NOT_FOUND', 404);
    }

    return data as UserTemplateRecord;
  }

  async deleteTemplate(id: string): Promise<UserTemplateRecord> {
    const { data, error } = await this.supabase
      .from('user_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '22P02') {
        throw new ApiError('Invalid template ID format', 'VALIDATION_ERROR', 400);
      }
      throw new ApiError(`Failed to delete template: ${error.message}`, 'DB_ERROR', 500);
    }

    if (!data) {
      throw new ApiError('Template not found or unauthorized', 'NOT_FOUND', 404);
    }

    return data as UserTemplateRecord;
  }

  // ─── SEO Analysis Operations ──────────────────────────────────────────────

  async createSeoAnalysis(params: {
    id?: string;
    focus_keyword: string;
    meta_title?: string;
    meta_description?: string;
    content?: string;
    score: number;
    analysis_result: Record<string, any>;
  }): Promise<SeoAnalysisRecord> {
    const insertPayload: Record<string, any> = {
      user_id: this.userId,
      focus_keyword: params.focus_keyword,
      meta_title: params.meta_title ?? null,
      meta_description: params.meta_description ?? null,
      content: params.content ?? null,
      score: params.score,
      analysis_result: params.analysis_result,
    };

    if (params.id) {
      insertPayload.id = params.id;
    }

    const { data, error } = await this.supabase
      .from('seo_analyses')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw new ApiError(`Failed to save SEO analysis: ${error.message}`, 'DB_ERROR', 500);
    }

    return data as SeoAnalysisRecord;
  }

  async getSeoAnalyses(limit: number = 10): Promise<SeoAnalysisRecord[]> {
    const { data, error } = await this.supabase
      .from('seo_analyses')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new ApiError(`Failed to fetch SEO analyses: ${error.message}`, 'DB_ERROR', 500);
    }

    return (data || []) as SeoAnalysisRecord[];
  }

  async getSeoAnalysisById(id: string): Promise<SeoAnalysisRecord | null> {
    const { data, error } = await this.supabase
      .from('seo_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '22P02') {
        return null;
      }
      throw new ApiError(`Failed to fetch SEO analysis: ${error.message}`, 'DB_ERROR', 500);
    }

    return data as SeoAnalysisRecord | null;
  }

  async reserveAiQuota(params: {
    endpoint: string;
    model: string;
    burstLimit: number;
    dailyLimit: number;
    monthlyLimit: number;
  }): Promise<{ allowed: boolean; reason?: string; usageId?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('check_and_reserve_ai_quota', {
        p_user_id: this.userId,
        p_endpoint: params.endpoint,
        p_model: params.model,
        p_burst_limit: params.burstLimit,
        p_daily_limit: params.dailyLimit,
        p_monthly_limit: params.monthlyLimit,
      });

      if (!error && data) {
        return {
          allowed: Boolean(data.allowed),
          reason: data.reason || undefined,
          usageId: data.usage_id || undefined,
        };
      }
    } catch {
      // Fall back to direct table query if RPC is not installed in environment
    }

    const now = new Date();
    const sixtySecsAgo = new Date(now.getTime() - 60000).toISOString();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

    const [burstRes, dailyRes, monthlyRes] = await Promise.all([
      this.supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', this.userId)
        .eq('endpoint', params.endpoint)
        .gte('created_at', sixtySecsAgo),
      this.supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', this.userId)
        .gte('created_at', startOfDay),
      this.supabase
        .from('ai_usage_logs')
        .select('id', { count: 'exact' })
        .eq('user_id', this.userId)
        .gte('created_at', startOfMonth),
    ]);

    if ((burstRes.count || 0) >= params.burstLimit) {
      return { allowed: false, reason: 'burst_exceeded' };
    }

    if ((dailyRes.count || 0) >= params.dailyLimit) {
      return { allowed: false, reason: 'daily_exceeded' };
    }

    if ((monthlyRes.count || 0) >= params.monthlyLimit) {
      return { allowed: false, reason: 'monthly_exceeded' };
    }

    const usageId = `usage-${Math.random().toString(36).substring(2, 9)}`;
    const { data: newRow } = await this.supabase
      .from('ai_usage_logs')
      .insert({
        id: usageId,
        user_id: this.userId,
        endpoint: params.endpoint,
        model: params.model,
        status: 'attempt',
      })
      .select()
      .single();

    return {
      allowed: true,
      usageId: newRow?.id || usageId,
    };
  }

  async markAiUsageCompleted(params: {
    usageId?: string;
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
  }): Promise<void> {
    if (!params.usageId) return;

    try {
      const { error } = await this.supabase.rpc('update_ai_usage_status', {
        p_usage_id: params.usageId,
        p_user_id: this.userId,
        p_status: 'completed',
        p_prompt_tokens: params.promptTokens ?? null,
        p_completion_tokens: params.completionTokens ?? null,
        p_total_tokens: params.totalTokens ?? null,
      });
      if (!error) return;
    } catch {}

    await this.supabase
      .from('ai_usage_logs')
      .update({
        status: 'completed',
        prompt_tokens: params.promptTokens ?? null,
        completion_tokens: params.completionTokens ?? null,
        total_tokens: params.totalTokens ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.usageId)
      .eq('user_id', this.userId);
  }

  async markAiUsageFailed(params: {
    usageId?: string;
    errorMessage: string;
  }): Promise<void> {
    if (!params.usageId) return;

    try {
      const { error } = await this.supabase.rpc('update_ai_usage_status', {
        p_usage_id: params.usageId,
        p_user_id: this.userId,
        p_status: 'failed',
        p_error_message: params.errorMessage,
      });
      if (!error) return;
    } catch {}

    await this.supabase
      .from('ai_usage_logs')
      .update({
        status: 'failed',
        error_message: params.errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.usageId)
      .eq('user_id', this.userId);
  }
}

