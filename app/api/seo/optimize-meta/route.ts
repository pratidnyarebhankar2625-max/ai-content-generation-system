import { withAuth } from '@/lib/api/auth';
import { validateRequest, type Schema } from '@/lib/api/validator';
import { ApiError } from '@/lib/api/errors';
import { DbService } from '@/lib/api/services/db';
import { RateLimiterService } from '@/lib/api/services/rate-limiter';
import { SeoAiAssistant } from '@/lib/seo/ai-assistant';
import type { User, SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// Validation schema for Meta Optimization request
const optimizeMetaSchema: Schema = {
  focus_keyword: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  existing_title: {
    required: false,
    type: 'string',
    maxLength: 300,
  },
  existing_description: {
    required: false,
    type: 'string',
    maxLength: 1000,
  },
  content: {
    required: false,
    type: 'string',
    maxLength: 50000,
  },
};

export const POST = withAuth(async (req: Request, user: User, supabase: SupabaseClient) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError('Invalid JSON request body', 'VALIDATION_ERROR', 400);
  }

  validateRequest(body, optimizeMetaSchema, {
    allowUnknown: false,
    requireAtLeastOne: false,
  });

  const payload = body as {
    focus_keyword: string;
    existing_title?: string;
    existing_description?: string;
    content?: string;
  };

  const dbService = new DbService(supabase, user.id);
  const usageId = await RateLimiterService.checkAndReserveQuota(
    dbService,
    'seo-optimize-meta',
    'google/gemini-3.7-flash'
  );

  let optimized;
  try {
    const aiAssistant = new SeoAiAssistant();
    optimized = await aiAssistant.optimizeMetaTags({
      focusKeyword: payload.focus_keyword,
      existingTitle: payload.existing_title,
      existingDescription: payload.existing_description,
      content: payload.content,
    });
    await dbService.markAiUsageCompleted({ usageId });
  } catch (err: any) {
    await dbService.markAiUsageFailed({
      usageId,
      errorMessage: err?.message || 'Meta optimization failed',
    });
    throw err;
  }

  return Response.json({
    success: true,
    data: optimized,
  });
});

