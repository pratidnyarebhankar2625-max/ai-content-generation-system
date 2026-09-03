import { ApiError } from '../errors';
import type { DbService } from './db';

function parseEnvInt(val: string | undefined, defaultVal: number): number {
  if (!val) return defaultVal;
  const parsed = parseInt(val, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 1000000) {
    return defaultVal;
  }
  return parsed;
}

export class RateLimiterService {
  public static get RATE_LIMIT_GENERATE_PER_MINUTE(): number {
    return parseEnvInt(process.env.RATE_LIMIT_GENERATE_PER_MINUTE, 5);
  }

  public static get RATE_LIMIT_SEO_PER_MINUTE(): number {
    return parseEnvInt(process.env.RATE_LIMIT_SEO_PER_MINUTE, 10);
  }

  public static get DAILY_AI_REQUEST_LIMIT(): number {
    return parseEnvInt(process.env.DAILY_AI_REQUEST_LIMIT, 50);
  }

  public static get MONTHLY_AI_REQUEST_LIMIT(): number {
    return parseEnvInt(process.env.MONTHLY_AI_REQUEST_LIMIT, 500);
  }

  public static get MAX_OUTPUT_TOKENS(): number {
    return parseEnvInt(process.env.MAX_OUTPUT_TOKENS, 4000);
  }

  /**
   * Enforces server-side max output token ceiling
   */
  public static getEffectiveMaxTokens(requestedMaxTokens?: number): number {
    const ceiling = RateLimiterService.MAX_OUTPUT_TOKENS;
    if (!requestedMaxTokens || requestedMaxTokens <= 0) {
      return ceiling;
    }
    return Math.min(requestedMaxTokens, ceiling);
  }

  /**
   * Database-backed atomic rate limit and quota check.
   * Throws HTTP 429 ApiError if burst, daily, or monthly quota is exceeded.
   * On approval, returns usageId for subsequent status and token accounting.
   */
  public static async checkAndReserveQuota(
    dbService: DbService,
    endpoint: string,
    model: string
  ): Promise<string> {
    let burstLimit = RateLimiterService.RATE_LIMIT_GENERATE_PER_MINUTE;
    if (endpoint.includes('seo')) {
      burstLimit = RateLimiterService.RATE_LIMIT_SEO_PER_MINUTE;
    }

    const dailyLimit = RateLimiterService.DAILY_AI_REQUEST_LIMIT;
    const monthlyLimit = RateLimiterService.MONTHLY_AI_REQUEST_LIMIT;

    const result = await dbService.reserveAiQuota({
      endpoint,
      model,
      burstLimit,
      dailyLimit,
      monthlyLimit,
    });

    if (!result.allowed) {
      let msg = 'Rate limit exceeded. Please wait a moment and try again.';
      if (result.reason === 'daily_exceeded') {
        msg = 'Daily AI request quota reached. Please try again tomorrow.';
      } else if (result.reason === 'monthly_exceeded') {
        msg = 'Monthly AI request quota reached. Please try again next month.';
      }

      throw new ApiError(msg, 'RATE_LIMIT_EXCEEDED', 429);
    }

    return result.usageId || `usage-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export class InFlightGenerationTracker {
  private static activeKeys = new Map<string, number>();

  public static createSignature(params: {
    userId: string;
    prompt: string;
    template?: string;
    category?: string;
    tone?: string;
    language?: string;
    isContinue?: boolean;
  }): string {
    const p = (params.prompt || '').trim().slice(0, 200);
    const t = (params.template || '').trim();
    const c = (params.category || '').trim();
    const tone = (params.tone || '').trim();
    const lang = (params.language || '').trim();
    const isCont = Boolean(params.isContinue);
    return `${params.userId}:${t}:${c}:${tone}:${lang}:${isCont}:${p}`;
  }

  /**
   * Attempts to acquire an in-flight execution lock for a request signature.
   * Throws HTTP 429 ApiError if an identical request is actively processing.
   */
  public static acquire(key: string, ttlMs = 15000): () => void {
    const now = Date.now();
    const existing = this.activeKeys.get(key);

    if (existing && now < existing) {
      throw new ApiError(
        'A generation request with identical parameters is currently in progress. Please wait a moment.',
        'DUPLICATE_REQUEST_IN_FLIGHT',
        429
      );
    }

    if (this.activeKeys.size > 100) {
      for (const [k, exp] of this.activeKeys.entries()) {
        if (now >= exp) this.activeKeys.delete(k);
      }
    }

    this.activeKeys.set(key, now + ttlMs);

    let released = false;
    return () => {
      if (!released) {
        released = true;
        this.activeKeys.delete(key);
      }
    };
  }
}
