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
        typeGuidelines = `
- STRUCTURE: Compelling H1 Title, Engaging Introduction with Hook, Clear Subheadings (H2, H3), Actionable Takeaway Sections, Bullet Points/Numbered Lists, Summary/Conclusion, and a Strong Call to Action (CTA).
- LENGTH & DEPTH: Thorough, educational, and engaging. Never cut sections short.
- SEO & READABILITY: Clear paragraph breaks, scannable format, bolding for emphasis on key phrases.`;
        break;

      case "email":
        typeGuidelines = `
- STRUCTURE:
  1. Subject Line options (3 catchy, high-open-rate subject lines)
  2. Preview Text / Preheader
  3. Personalized Greeting
  4. Engaging Opening & Core Message
  5. Value Proposition & Key Points (bulleted)
  6. Compelling Call to Action (CTA)
  7. Professional Sign-off & Signature Block
- STYLE: Direct, relationship-building, clear value delivery with zero fluff.`;
        break;

      case "social":
        typeGuidelines = `
- STRUCTURE:
  1. Attention-grabbing opening hook (first 2 lines must stop scrolling).
  2. Core narrative / value nuggets with strategic spacing and whitespace.
  3. Punchy bullet points or insights.
  4. Engaging closing question / discussion prompt.
  5. 3-5 relevant, high-traffic hashtags.
- STYLE: Highly readable, authentic, social-native tone with appropriate emoji accents.`;
        break;

      case "ad":
        typeGuidelines = `
- STRUCTURE:
  1. 3 Powerful Headline Variations (Hook-based, Benefit-based, Urgency-based).
  2. Primary Ad Body Copy (short & long variations).
  3. Core Value Proposition & Pain Point Solution.
  4. Bulleted Key Features / Benefits.
  5. High-Converting Call to Action (CTA button copy + prompt).
- STYLE: Persuasive, psychology-backed, conversion-focused copywriting.`;
        break;

      case "product":
        typeGuidelines = `
- STRUCTURE:
  1. Catchy, SEO-optimized Product Title.
  2. Compelling Elevator Pitch / Product Overview.
  3. Key Features & Specifications (structured bullet list).
  4. Concrete Customer Benefits & Transformation.
  5. Best For / Target User Callout.
  6. Strong Purchase Call to Action.
- STYLE: Descriptive, sensory-rich, benefit-driven and commercially persuasive.`;
        break;

      default:
        typeGuidelines = `
- STRUCTURE: Well-organized with clear Markdown headings, subheadings, structured bullet lists, and concluding thoughts.
- STYLE: Informative, polished, and structured specifically for the requested format: ${options.template || "Standard"}.`;
        break;
    }

    let prompt = `You are Writeora AI, an elite AI copywriting and content generation assistant.
Your goal is to produce exceptional, high-converting, publication-ready content.

GLOBAL RULES:
1. OUTPUT QUALITY: Deliver 100% complete, polished, and original content. Never leave placeholders like "[Insert text here]" unless specific personalization variables (like [Name]) are standard for email/ad templates.
2. CONTINUITY: Complete every sentence and section properly. Never truncate or abruptly stop mid-thought.
3. FORMATTING: Use clean, standard Markdown (H1 #, H2 ##, H3 ###, bold **text**, bullet lists -, numbered lists 1., blockquotes >).
4. TONE OF VOICE: Write strictly in a "${tone}" tone.
5. LANGUAGE: Respond strictly in "${language}".

CONTENT TYPE SPECIFIC INSTRUCTIONS (${options.template || contentType.toUpperCase()}):
${typeGuidelines.trim()}
`;

    if (options.isContinue) {
      prompt += `\n\nIMPORTANT CONTINUATION INSTRUCTION:\nThe user has requested to CONTINUE generating content from where the previous output left off.
Do NOT repeat headings or paragraphs already generated. Start immediately and seamlessly from the exact continuation point.`;
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
