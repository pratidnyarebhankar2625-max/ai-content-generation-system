export type ContentType = 
  | "blog" 
  | "email" 
  | "social" 
  | "ad" 
  | "product" 
  | "custom";

export type PromptBuildOptions = {
  prompt: string;
  template?: string;
  category?: string;
  tone?: string;
  language?: string;
  length?: string;
  keywords?: string | string[];
  context?: Record<string, any>;
  isContinue?: boolean;
  previousContent?: string;
};

export class PromptService {
  /**
   * Identifies the primary content category from template title or category string
   */
  public static detectContentType(template?: string, category?: string): ContentType {
    const combined = `${template || ""} ${category || ""}`.toLowerCase();

    if (combined.includes("blog") || combined.includes("article") || combined.includes("essay") || combined.includes("guide")) {
      return "blog";
    }
    if (combined.includes("email") || combined.includes("newsletter") || combined.includes("outreach") || combined.includes("sales")) {
      return "email";
    }
    if (combined.includes("social") || combined.includes("tweet") || combined.includes("twitter") || combined.includes("linkedin") || combined.includes("instagram") || combined.includes("thread")) {
      return "social";
    }
    if (combined.includes("ad") || combined.includes("advertising") || combined.includes("campaign") || combined.includes("commercial") || combined.includes("headline")) {
      return "ad";
    }
    if (combined.includes("product") || combined.includes("ecommerce") || combined.includes("listing") || combined.includes("description") || combined.includes("shopify")) {
      return "product";
    }
    return "custom";
  }

  /**
   * Generates specialized system prompt based on content type, tone, language, and guidelines
   */
  public static buildSystemPrompt(options: PromptBuildOptions): string {
    const contentType = this.detectContentType(options.template, options.category);
    const tone = options.tone || "Professional";
    const language = options.language || "English (US)";

    let typeGuidelines = "";

    switch (contentType) {
      case "blog":
        typeGuidelines = `- STRUCTURE: H1 Title, Hook Intro, H2/H3 Subheadings, Key Takeaways, Bullet Lists, Conclusion, Call to Action (CTA).
- STYLE: Educational, engaging, clear paragraph breaks, bold key phrases for readability.`;
        break;

      case "email":
        typeGuidelines = `- STRUCTURE: 3 Subject Line options, Preheader, Greeting, Core Message, Bulleted Value Points, CTA, Signature Block.
- STYLE: Direct, relationship-building, clear value delivery.`;
        break;

      case "social":
        typeGuidelines = `- STRUCTURE: Scroll-stopping Hook (first 2 lines), Core Narrative with whitespace, Bullet Insights, Closing Question, 3-5 Hashtags.
- STYLE: Highly readable, authentic, social-native tone.`;
        break;

      case "ad":
        typeGuidelines = `- STRUCTURE: 3 Headlines (Hook/Benefit/Urgency), Body Copy (short & long), Value Proposition, Key Features, High-Converting CTA.
- STYLE: Persuasive, conversion-focused copywriting.`;
        break;

      case "product":
        typeGuidelines = `- STRUCTURE: SEO Product Title, Elevator Pitch, Key Features & Specifications, Customer Benefits, Target User Callout, Purchase CTA.
- STYLE: Descriptive, benefit-driven, commercially persuasive.`;
        break;

      default:
        typeGuidelines = `- STRUCTURE: Markdown headings, subheadings, bullet lists, conclusion.
- STYLE: Polished and structured for: ${options.template || "Standard"}.`;
        break;
    }

    let prompt = `You are Writeora AI, an expert content generation assistant.
RULES:
1. QUALITY & COMPLETENESS: Output 100% complete, publication-ready content without placeholders or abrupt truncation.
2. FORMATTING: Use clean standard Markdown (H1 #, H2 ##, H3 ###, bold **text**, bullet lists -, numbered lists 1.).
3. TONE & LANGUAGE: Write strictly in "${tone}" tone and "${language}".

INSTRUCTIONS (${options.template || contentType.toUpperCase()}):
${typeGuidelines.trim()}
`;

    if (options.isContinue) {
      prompt += `\nCONTINUATION INSTRUCTION:\nContinue generating seamlessly from where the previous output left off without repeating headings or paragraphs already generated.`;
    }

    return prompt.trim();
  }

  /**
   * Generates the structured user prompt combining topic, keywords, and extra context
   */
  public static buildUserPrompt(options: PromptBuildOptions): string {
    let userPrompt = `Topic / Request:\n${options.prompt.trim()}\n\n`;

    if (options.template) {
      userPrompt += `Template: ${options.template}\n`;
    }

    if (options.category) {
      userPrompt += `Category: ${options.category}\n`;
    }

    if (options.tone) {
      userPrompt += `Tone: ${options.tone}\n`;
    }

    if (options.language) {
      userPrompt += `Target Language: ${options.language}\n`;
    }

    if (options.length) {
      userPrompt += `Target Length: ${options.length}\n`;
    }

    // Process keywords
    if (options.keywords) {
      const kwString = Array.isArray(options.keywords)
        ? options.keywords.join(", ")
        : options.keywords;

      if (kwString.trim()) {
        userPrompt += `Required Keywords (integrate naturally): ${kwString.trim()}\n`;
      }
    }

    // Process additional context
    if (options.context && Object.keys(options.context).length > 0) {
      userPrompt += `\nAdditional Context:\n`;
      for (const [key, value] of Object.entries(options.context)) {
        if (value && typeof value === "string" && value.trim()) {
          userPrompt += `- ${key}: ${value.trim()}\n`;
        }
      }
    }

    if (options.isContinue && options.previousContent) {
      userPrompt += `\nPreviously Generated Content up to this point:\n"""\n${options.previousContent.slice(-1500)}\n"""\n\nPlease continue directly from the next sentence.`;
    }

    return userPrompt.trim();
  }
}
