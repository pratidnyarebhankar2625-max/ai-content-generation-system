import { ApiError } from '../errors';
import type { SupabaseClient } from '@supabase/supabase-js';

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

  async getGenerations(limit: number = 10) {
    const { data, error } = await this.supabase
      .from('generations')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new ApiError('Failed to fetch generations', 'DB_ERROR', 500);
    }
    return data;
  }
}
