import { ApiError } from '../errors';
import type { SupabaseClient } from '@supabase/supabase-js';

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

  async getGenerationById(id: string): Promise<GenerationRecord | null> {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error) {
      return null;
    }
    return data as GenerationRecord;
  }

  async createGeneration(params: {
    id?: string;
    title: string;
    template: string;
    category: string;
    status: 'completed' | 'draft' | 'failed';
    preview: string;
    word_count?: number;
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
    }
  ): Promise<GenerationRecord> {
    const updatePayload: Record<string, any> = {};
    if (updates.title !== undefined) updatePayload.title = updates.title;
    if (updates.template !== undefined) updatePayload.template = updates.template;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.status !== undefined) updatePayload.status = updates.status;
    if (updates.preview !== undefined) updatePayload.preview = updates.preview;
    if (updates.word_count !== undefined) updatePayload.word_count = updates.word_count;

    const { data, error } = await this.supabase
      .from('generations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) {
      throw new ApiError(`Failed to update generation: ${error.message}`, 'DB_ERROR', 500);
    }

    return data as GenerationRecord;
  }
}
