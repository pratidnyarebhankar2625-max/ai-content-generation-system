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
  byok_api_key?: string | null;
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

  async getProfile() {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', this.userId)
      .single();

    if (error) {
      throw new ApiError('Failed to fetch profile', 'DB_ERROR', 500);
    }
    return data;
  }

  async getUserSettings(): Promise<UserSettingsRecord | null> {
    const { data, error } = await this.supabase
      .from('user_settings')
      .select('*')
      .eq('id', this.userId)
      .single();

    if (error) {
      // Graceful fallback if settings row does not exist yet
      return null;
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

    // Filter by search query (across title and preview)
    if (params.search && params.search.trim()) {
      const sanitized = params.search.trim().replace(/[%_,()]/g, '');
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,preview.ilike.%${sanitized}%`);
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
}
