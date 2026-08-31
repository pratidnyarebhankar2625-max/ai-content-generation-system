/**
 * AI Semantic Assistant for SEO
 * 
 * Reuses OpenRouterService to provide AI-powered semantic content analysis,
 * keyword discovery, and meta tag optimization.
 * 
 * IMPORTANT: AI is NOT used to generate or modify the numerical SEO score.
 * Deterministic analysis remains fully functional even if AI enrichment fails.
 */

import { OpenRouterService } from '@/lib/api/services/openrouter';

export type KeywordItem = {
  word: string;
  searchVolume: string; // Labeled clearly as estimated, e.g. "Est. 12K"
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
};

export type CategorizedKeywords = {
  primary: KeywordItem[];
  secondary: KeywordItem[];
  longTail: KeywordItem[];
  related: KeywordItem[];
};

export type AiAnalysisResult = {
  keywords: CategorizedKeywords;
  semanticRecommendations: { type: 'success' | 'warning' | 'error'; text: string }[];
  suggestedTitle?: string;
  suggestedDescription?: string;
};

export class SeoAiAssistant {
  private openRouter: OpenRouterService;

  constructor(apiKey?: string) {
    this.openRouter = new OpenRouterService(apiKey);
  }

  /**
   * Generates AI-assisted keyword suggestions and semantic insights.
   * If AI service is unavailable, returns a fallback structure so deterministic analysis succeeds.
   */
  public async analyzeSemantics(params: {
    focusKeyword: string;
    metaTitle?: string;
    metaDescription?: string;
    content?: string;
  }): Promise<AiAnalysisResult> {
    try {
      const promptText = `You are an expert SEO Strategist. Analyze the following content parameters and return ONLY valid JSON matching the exact specified schema. Do not include markdown code blocks, preambles, or postscripts.

INPUT:
Focus Keyword: "${params.focusKeyword}"
Meta Title: "${params.metaTitle || ''}"
Meta Description: "${params.metaDescription || ''}"
Content Snippet: "${(params.content || '').slice(0, 500)}"

REQUIREMENTS:
1. Generate relevant keyword suggestions in 4 categories: primary, secondary, longTail, related.
2. For searchVolume, provide estimated labels like "Est. 12K", "Est. 2.5K", "Est. 800".
3. For difficulty, choose exactly one of: "Easy", "Medium", "Hard", "Very Hard".
4. Provide 2-3 semantic content optimization recommendations in semanticRecommendations as objects with type ("success" | "warning" | "error") and text (string).

JSON SCHEMA:
{
  "keywords": {
    "primary": [{ "word": "string", "searchVolume": "string", "difficulty": "Medium" }],
    "secondary": [{ "word": "string", "searchVolume": "string", "difficulty": "Medium" }],
    "longTail": [{ "word": "string", "searchVolume": "string", "difficulty": "Easy" }],
    "related": [{ "word": "string", "searchVolume": "string", "difficulty": "Hard" }]
  },
  "semanticRecommendations": [
    { "type": "warning", "text": "string" }
  ]
}`;

      const rawResponse = await this.openRouter.generateCompletion({
        messages: [
          { role: 'system', content: 'You are a JSON-only API assistant. Output strictly valid JSON without markdown tags.' },
          { role: 'user', content: promptText },
        ],
        temperature: 0.5,
        maxTokens: 1200,
      });

      // Clean markdown fencing if model returns ```json ... ```
      const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        keywords: {
          primary: Array.isArray(parsed.keywords?.primary) ? parsed.keywords.primary : this.getFallbackKeywords(params.focusKeyword).primary,
          secondary: Array.isArray(parsed.keywords?.secondary) ? parsed.keywords.secondary : this.getFallbackKeywords(params.focusKeyword).secondary,
          longTail: Array.isArray(parsed.keywords?.longTail) ? parsed.keywords.longTail : this.getFallbackKeywords(params.focusKeyword).longTail,
          related: Array.isArray(parsed.keywords?.related) ? parsed.keywords.related : this.getFallbackKeywords(params.focusKeyword).related,
        },
        semanticRecommendations: Array.isArray(parsed.semanticRecommendations) ? parsed.semanticRecommendations : [],
      };
    } catch (error) {
      console.warn('AI Semantic Assistant notice: AI enrichment failed or skipped, using fallback. Error:', error);
      return {
        keywords: this.getFallbackKeywords(params.focusKeyword),
        semanticRecommendations: [
          { type: 'warning', text: 'AI semantic enrichment offline. Deterministic analysis complete.' }
        ],
      };
    }
  }

  /**
   * Generates optimized Meta Title and Meta Description for the focus keyword.
   */
  public async optimizeMetaTags(params: {
    focusKeyword: string;
    existingTitle?: string;
    existingDescription?: string;
    content?: string;
  }): Promise<{ metaTitle: string; metaDescription: string }> {
    try {
      const promptText = `You are a professional SEO Copywriter. Generate an optimized meta title (40-60 chars) and meta description (120-160 chars) targeting the focus keyword "${params.focusKeyword}".

Existing Title: "${params.existingTitle || ''}"
Existing Description: "${params.existingDescription || ''}"

Return ONLY valid JSON matching this schema:
{
  "metaTitle": "string",
  "metaDescription": "string"
}`;

      const rawResponse = await this.openRouter.generateCompletion({
        messages: [
          { role: 'system', content: 'You are a JSON-only API assistant. Output strictly valid JSON without markdown tags.' },
          { role: 'user', content: promptText },
        ],
        temperature: 0.6,
        maxTokens: 500,
      });

      const cleanedJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson);

      return {
        metaTitle: parsed.metaTitle || `${params.focusKeyword}: Complete Optimization Guide`,
        metaDescription: parsed.metaDescription || `Discover effective strategies for ${params.focusKeyword}. Optimize your content to boost search visibility and drive targeted traffic.`,
      };
    } catch (error) {
      return {
        metaTitle: `${params.focusKeyword} - Proven Tips & Complete Guide`,
        metaDescription: `Learn how to master ${params.focusKeyword} with actionable insights, best practices, and expert advice to rank higher on search engines.`,
      };
    }
  }

  private getFallbackKeywords(focusKeyword: string): CategorizedKeywords {
    const kw = focusKeyword || 'SEO Content';
    return {
      primary: [
        { word: `${kw}`, searchVolume: 'Est. 12K', difficulty: 'Hard' },
        { word: `${kw} optimization`, searchVolume: 'Est. 8.5K', difficulty: 'Medium' },
      ],
      secondary: [
        { word: `Best ${kw} strategies`, searchVolume: 'Est. 4.2K', difficulty: 'Medium' },
        { word: `${kw} tools`, searchVolume: 'Est. 3.8K', difficulty: 'Easy' },
      ],
      longTail: [
        { word: `How to optimize ${kw} step by step`, searchVolume: 'Est. 950', difficulty: 'Easy' },
        { word: `Best practices for ${kw} in 2026`, searchVolume: 'Est. 1.1K', difficulty: 'Medium' },
      ],
      related: [
        { word: `Digital marketing content`, searchVolume: 'Est. 25K', difficulty: 'Very Hard' },
        { word: `Search engine visibility`, searchVolume: 'Est. 15K', difficulty: 'Hard' },
      ],
    };
  }
}
