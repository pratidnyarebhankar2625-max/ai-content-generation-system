import { ApiError } from '../errors';

export type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenRouterStreamOptions = {
  messages: OpenRouterMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  signal?: AbortSignal;
};

export class OpenRouterService {
  private static readonly BASE_URL = 'https://openrouter.ai/api/v1';
  // Reliable and active models on OpenRouter
  public static readonly DEFAULT_MODEL = 'google/gemini-3.7-flash';
  public static readonly FALLBACK_MODELS = [
    'google/gemini-3.7-flash',
    'google/gemini-3.6-flash',
    'google/gemini-3.5-flash-lite',
    'anthropic/claude-sonnet-5',
    'openrouter/auto',
  ];

  public static normalizeModel(modelName?: string): string {
    if (!modelName) return OpenRouterService.DEFAULT_MODEL;
    const lower = modelName.toLowerCase().trim();
    if (lower.includes('/') && !lower.startsWith('gemini')) return modelName;

    if (lower.includes('3.7') || lower.includes('flash')) return 'google/gemini-3.7-flash';
    if (lower.includes('3.6')) return 'google/gemini-3.6-flash';
    if (lower.includes('3.5') || lower.includes('lite')) return 'google/gemini-3.5-flash-lite';
    if (lower.includes('claude') || lower.includes('sonnet')) return 'anthropic/claude-sonnet-5';
    if (lower.includes('auto')) return 'openrouter/auto';

    return OpenRouterService.DEFAULT_MODEL;
  }

  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new ApiError(
        'OpenRouter API key is not configured on the server. Please set OPENROUTER_API_KEY in your environment variables.',
        'OPENROUTER_KEY_MISSING',
        500
      );
    }
    this.apiKey = key;
  }

  /**
   * Streams content from OpenRouter chat completions API using Server-Sent Events (SSE)
   */
  public async streamCompletion(options: OpenRouterStreamOptions): Promise<ReadableStream<Uint8Array>> {
    const model = OpenRouterService.normalizeModel(options.model);
    const maxTokens = options.maxTokens || 4000;
    const temperature = options.temperature ?? 0.7;

    const requestBody = {
      model,
      messages: options.messages,
      stream: true,
      max_tokens: maxTokens,
      temperature,
      top_p: options.topP ?? 0.95,
      frequency_penalty: options.frequencyPenalty ?? 0,
      presence_penalty: options.presencePenalty ?? 0,
    };

    // 60-second timeout controller combined with external signal if provided
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new Error('OpenRouter request timed out after 60 seconds'));
    }, 60000);

    // Link external abort signal if provided
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        timeoutController.abort(options.signal?.reason);
      });
    }

    let response: Response;
    try {
      response = await fetch(`${OpenRouterService.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://writeora.ai',
          'X-Title': 'Writeora AI Content Generation System',
        },
        body: JSON.stringify(requestBody),
        signal: timeoutController.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || timeoutController.signal.aborted) {
        throw new ApiError('Generation request timed out or was cancelled by user.', 'REQUEST_TIMEOUT', 504);
      }
      throw new ApiError(`Network error connecting to OpenRouter: ${err.message}`, 'AI_NETWORK_ERROR', 502);
    }

    if (!response.ok) {
      clearTimeout(timeoutId);
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = errorJson.error?.message || JSON.stringify(errorJson);
      } catch {
        errorDetails = await response.text().catch(() => '');
      }

      if (response.status === 401) {
        throw new ApiError('Authentication failed with OpenRouter. Please check server API key.', 'AI_AUTH_ERROR', 401);
      }
      if (response.status === 429) {
        throw new ApiError('OpenRouter rate limit reached. Please wait a moment and try again.', 'RATE_LIMIT_EXCEEDED', 429);
      }
      if (response.status === 502 || response.status === 503) {
        throw new ApiError('AI provider is currently unavailable. Please try again shortly.', 'AI_UNAVAILABLE', 503);
      }

      throw new ApiError(`OpenRouter generation error (${response.status}): ${errorDetails || 'Unknown error'}`, 'AI_GENERATION_FAILED', response.status >= 500 ? 502 : 400);
    }

    if (!response.body) {
      clearTimeout(timeoutId);
      throw new ApiError('Empty response body returned from OpenRouter.', 'EMPTY_RESPONSE', 502);
    }

    const rawStreamReader = response.body.getReader();
    const utf8Decoder = new TextDecoder('utf-8');
    const utf8Encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let buffer = '';
        let isTruncated = false;

        try {
          while (true) {
            const { done, value } = await rawStreamReader.read();
            if (done) break;

            buffer += utf8Decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // keep trailing incomplete line

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue; // SSE comment or ping

              if (trimmed === 'data: [DONE]') {
                continue;
              }

              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const choice = parsed.choices?.[0];

                  if (choice?.finish_reason === 'length') {
                    isTruncated = true;
                  }

                  const delta = choice?.delta?.content;
                  if (delta) {
                    controller.enqueue(utf8Encoder.encode(delta));
                  }
                } catch {
                  // Skip invalid JSON lines silently in SSE
                }
              }
            }
          }

          // If stream ended with truncation marker, notify frontend
          if (isTruncated) {
            controller.enqueue(
              utf8Encoder.encode('\n\n[__TRUNCATED__]\n[Response reached length limit — click Continue to finish.]')
            );
          }
        } catch (streamErr: any) {
          if (!timeoutController.signal.aborted) {
            controller.error(streamErr);
          }
        } finally {
          clearTimeout(timeoutId);
          controller.close();
        }
      },
      cancel() {
        clearTimeout(timeoutId);
        timeoutController.abort();
      },
    });
  }

  /**
   * Non-streaming completion method for full text generation
   */
  public async generateCompletion(options: OpenRouterStreamOptions): Promise<string> {
    const stream = await this.streamCompletion(options);
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    if (!fullText.trim()) {
      throw new ApiError('AI returned an empty response. Please retry with more specific instructions.', 'EMPTY_AI_RESPONSE', 502);
    }

    return fullText.trim();
  }
}
