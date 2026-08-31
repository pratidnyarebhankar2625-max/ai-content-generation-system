/**
 * Deterministic SEO Analyzer
 * 
 * Pure, deterministic text analysis algorithms for SEO metrics, readability,
 * keyword frequency, placement classification, and heading structure.
 * 
 * NO AI calls are made from this file. The same input will ALWAYS return the exact same metrics.
 */

export type MetaTagAnalysis = {
  text: string;
  characterCount: number;
  keywordPresent: boolean;
  keywordPosition: 'start' | 'middle' | 'missing';
  isOptimalLength: boolean;
};

export type HeadingAnalysis = {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  totalHeadings: number;
  isValidHierarchy: boolean;
  h1ContainsKeyword: boolean;
};

export type ContentMetrics = {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  syllableCount: number;
  fleschReadingEase: number;
  paragraphCount: number;
  avgParagraphLength: number;
  longParagraphsCount: number; // Paragraphs > 150 words
};

export type KeywordAnalysis = {
  focusKeyword: string;
  frequency: number;
  densityPercentage: number;
  inTitle: boolean;
  inTitlePosition: 'start' | 'middle' | 'missing';
  inDescription: boolean;
  inFirstParagraph: boolean;
  inHeadings: boolean;
};

export type DeterministicAnalysisResult = {
  focusKeyword: string;
  metaTitle: MetaTagAnalysis;
  metaDescription: MetaTagAnalysis;
  headings: HeadingAnalysis;
  content: ContentMetrics;
  keyword: KeywordAnalysis;
};

// ─── Syllable Estimation ───────────────────────────────────────────────────

export function estimateSyllablesInWord(word: string): number {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!clean) return 0;
  if (clean.length <= 3) return 1;

  // Syllable regex matching vowel groups
  let formatted = clean.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  formatted = formatted.replace(/^y/, '');
  const matches = formatted.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

export function estimateTotalSyllables(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.reduce((acc, word) => acc + estimateSyllablesInWord(word), 0);
}

// ─── Readability Calculation ───────────────────────────────────────────────

export function calculateFleschReadingEase(wordsCount: number, sentencesCount: number, syllablesCount: number): number {
  if (wordsCount === 0 || sentencesCount === 0) return 0;
  const wordsPerSentence = wordsCount / sentencesCount;
  const syllablesPerWord = syllablesCount / wordsCount;
  const rawScore = 206.835 - (1.015 * wordsPerSentence) - (84.6 * syllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(rawScore * 10) / 10));
}

// ─── Keyword Helper ───────────────────────────────────────────────────────

export function countKeywordOccurrences(text: string, keyword: string): number {
  if (!text || !keyword.trim()) return 0;
  const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function getKeywordPosition(text: string, keyword: string): 'start' | 'middle' | 'missing' {
  if (!text || !keyword.trim()) return 'missing';
  const lowerText = text.toLowerCase();
  const lowerKw = keyword.trim().toLowerCase();
  const index = lowerText.indexOf(lowerKw);
  
  if (index === -1) return 'missing';
  if (index <= Math.max(15, Math.floor(text.length * 0.2))) return 'start';
  return 'middle';
}

// ─── Main Deterministic Analyzer ──────────────────────────────────────────

export function analyzeSeoDeterministically(params: {
  focusKeyword: string;
  metaTitle?: string;
  metaDescription?: string;
  content?: string;
}): DeterministicAnalysisResult {
  const focusKeyword = (params.focusKeyword || '').trim();
  const titleText = (params.metaTitle || '').trim();
  const descText = (params.metaDescription || '').trim();
  const bodyText = (params.content || '').trim();

  // Combine title, description, and body for combined metrics if body is empty
  const fullText = bodyText || [titleText, descText].filter(Boolean).join(' ');

  // 1. Meta Title Analysis
  const titleLen = titleText.length;
  const titleKwPos = getKeywordPosition(titleText, focusKeyword);
  const metaTitle: MetaTagAnalysis = {
    text: titleText,
    characterCount: titleLen,
    keywordPresent: titleKwPos !== 'missing',
    keywordPosition: titleKwPos,
    isOptimalLength: titleLen >= 40 && titleLen <= 60,
  };

  // 2. Meta Description Analysis
  const descLen = descText.length;
  const descKwPos = getKeywordPosition(descText, focusKeyword);
  const metaDescription: MetaTagAnalysis = {
    text: descText,
    characterCount: descLen,
    keywordPresent: descKwPos !== 'missing',
    keywordPosition: descKwPos,
    isOptimalLength: descLen >= 120 && descLen <= 160,
  };

  // 3. Content Metrics
  const cleanWords = fullText.split(/\s+/).filter((w) => w.replace(/[^a-zA-Z0-9]/g, '').length > 0);
  const wordCount = cleanWords.length;

  const rawSentences = fullText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(1, rawSentences.length);
  const avgSentenceLength = wordCount === 0 ? 0 : Math.round((wordCount / sentenceCount) * 10) / 10;

  const syllableCount = estimateTotalSyllables(fullText);
  const fleschReadingEase = calculateFleschReadingEase(wordCount, sentenceCount, syllableCount);

  // Paragraph Analysis
  const paragraphs = (bodyText || fullText).split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);
  const paragraphLengths = paragraphs.map((p) => p.trim().split(/\s+/).filter(Boolean).length);
  const avgParagraphLength = wordCount === 0 ? 0 : Math.round((wordCount / paragraphCount) * 10) / 10;
  const longParagraphsCount = paragraphLengths.filter((len) => len > 150).length;

  const contentMetrics: ContentMetrics = {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    syllableCount,
    fleschReadingEase,
    paragraphCount,
    avgParagraphLength,
    longParagraphsCount,
  };

  // 4. Headings Analysis (Parse HTML tags or markdown headers if present)
  let h1Count = 0;
  let h2Count = 0;
  let h3Count = 0;
  let h1ContainsKeyword = false;

  const h1Matches = bodyText.match(/<h1[^>]*>(.*?)<\/h1>|^#\s+(.*$)/gim);
  if (h1Matches) {
    h1Count = h1Matches.length;
    h1ContainsKeyword = h1Matches.some((h) => countKeywordOccurrences(h, focusKeyword) > 0);
  }

  const h2Matches = bodyText.match(/<h2[^>]*>(.*?)<\/h2>|^##\s+(.*$)/gim);
  if (h2Matches) h2Count = h2Matches.length;

  const h3Matches = bodyText.match(/<h3[^>]*>(.*?)<\/h3>|^###\s+(.*$)/gim);
  if (h3Matches) h3Count = h3Matches.length;

  const totalHeadings = h1Count + h2Count + h3Count;
  // Hierarchy valid if h1 is at most 1, and if h3 is present, h2 is also present
  const isValidHierarchy = h1Count <= 1 && (h3Count === 0 || h2Count > 0);

  const headingAnalysis: HeadingAnalysis = {
    h1Count,
    h2Count,
    h3Count,
    totalHeadings,
    isValidHierarchy,
    h1ContainsKeyword,
  };

  // 5. Keyword Frequency & Density
  const keywordFreq = countKeywordOccurrences(fullText, focusKeyword);
  const kwWords = focusKeyword.split(/\s+/).filter(Boolean).length || 1;
  const densityRaw = wordCount === 0 ? 0 : ((keywordFreq * kwWords) / wordCount) * 100;
  const densityPercentage = Math.round(densityRaw * 100) / 100;

  // Check first paragraph (first 100 words)
  const first100Words = cleanWords.slice(0, 100).join(' ');
  const inFirstParagraph = countKeywordOccurrences(first100Words, focusKeyword) > 0;

  // Check headings
  const allHeadingsText = (bodyText.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>|^#{1,6}\s+(.*$)/gim) || []).join(' ');
  const inHeadings = countKeywordOccurrences(allHeadingsText, focusKeyword) > 0;

  const keywordAnalysis: KeywordAnalysis = {
    focusKeyword,
    frequency: keywordFreq,
    densityPercentage,
    inTitle: metaTitle.keywordPresent,
    inTitlePosition: titleKwPos,
    inDescription: metaDescription.keywordPresent,
    inFirstParagraph,
    inHeadings,
  };

  return {
    focusKeyword,
    metaTitle,
    metaDescription,
    headings: headingAnalysis,
    content: contentMetrics,
    keyword: keywordAnalysis,
  };
}
