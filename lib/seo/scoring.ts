/**
 * Deterministic SEO Scorer & Rule Generator
 * 
 * Computes an exact, 100% reproducible numerical score (0-100) based on
 * explicit rule weighting. Generates deterministic recommendations.
 * 
 * NO random numbers, NO LLM hallucinations, NO arbitrary weights.
 */

import type { DeterministicAnalysisResult } from './analyzer';

export type SeoRecommendation = {
  type: 'success' | 'warning' | 'error';
  category: 'title' | 'description' | 'readability' | 'keyword' | 'headings' | 'content';
  message: string;
  priority: 'low' | 'medium' | 'high';
};

export type ScoreCategoryDetails = {
  score: number;
  max: number;
};

export type ScoreBreakdown = {
  titlePlacement: ScoreCategoryDetails;
  titleLength: ScoreCategoryDetails;
  descriptionPlacement: ScoreCategoryDetails;
  descriptionLength: ScoreCategoryDetails;
  readability: ScoreCategoryDetails;
  keywordDensity: ScoreCategoryDetails;
};

export type ScoringResult = {
  overallScore: number;
  breakdown: ScoreBreakdown;
  recommendations: SeoRecommendation[];
};

export function scoreSeoDeterministically(analysis: DeterministicAnalysisResult): ScoringResult {
  const recommendations: SeoRecommendation[] = [];

  // ─── 1. Title Keyword Placement (Max 20) ──────────────────────────────────
  let titlePlacementScore = 0;
  if (analysis.metaTitle.keywordPosition === 'start') {
    titlePlacementScore = 20;
    recommendations.push({
      type: 'success',
      category: 'title',
      message: 'Focus keyword is placed at the start of the meta title.',
      priority: 'low',
    });
  } else if (analysis.metaTitle.keywordPresent) {
    titlePlacementScore = 15;
    recommendations.push({
      type: 'success',
      category: 'title',
      message: 'Focus keyword found in the meta title.',
      priority: 'low',
    });
  } else {
    titlePlacementScore = 0;
    recommendations.push({
      type: 'error',
      category: 'title',
      message: 'Focus keyword not found in the meta title.',
      priority: 'high',
    });
  }

  // ─── 2. Title Length (Max 15) ─────────────────────────────────────────────
  let titleLengthScore = 0;
  const tLen = analysis.metaTitle.characterCount;

  if (tLen === 0) {
    titleLengthScore = 0;
    recommendations.push({
      type: 'error',
      category: 'title',
      message: 'Meta title is missing.',
      priority: 'high',
    });
  } else if (tLen >= 40 && tLen <= 60) {
    titleLengthScore = 15;
    recommendations.push({
      type: 'success',
      category: 'title',
      message: `Meta title length is optimal (${tLen} characters).`,
      priority: 'low',
    });
  } else if ((tLen >= 30 && tLen <= 39) || (tLen >= 61 && tLen <= 70)) {
    titleLengthScore = 10;
    recommendations.push({
      type: 'warning',
      category: 'title',
      message: tLen < 40 ? `Meta title is slightly short (${tLen}/60 characters).` : `Meta title may truncate on Google search (${tLen}/60 characters).`,
      priority: 'medium',
    });
  } else {
    titleLengthScore = 0;
    recommendations.push({
      type: 'error',
      category: 'title',
      message: tLen < 30 ? `Meta title is too short (${tLen} characters, aim for 40-60).` : `Meta title exceeds 70 characters (${tLen} chars) and will truncate.`,
      priority: 'high',
    });
  }

  // ─── 3. Description Keyword Placement (Max 20) ───────────────────────────
  let descPlacementScore = 0;
  if (analysis.metaDescription.keywordPresent) {
    descPlacementScore = 20;
    recommendations.push({
      type: 'success',
      category: 'description',
      message: 'Focus keyword found in the meta description.',
      priority: 'low',
    });
  } else {
    descPlacementScore = 0;
    recommendations.push({
      type: 'error',
      category: 'description',
      message: 'Focus keyword not found in the meta description.',
      priority: 'high',
    });
  }

  // ─── 4. Description Length (Max 15) ───────────────────────────────────────
  let descLengthScore = 0;
  const dLen = analysis.metaDescription.characterCount;

  if (dLen === 0) {
    descLengthScore = 0;
    recommendations.push({
      type: 'error',
      category: 'description',
      message: 'Meta description is missing.',
      priority: 'high',
    });
  } else if (dLen >= 120 && dLen <= 160) {
    descLengthScore = 15;
    recommendations.push({
      type: 'success',
      category: 'description',
      message: `Meta description length is optimal (${dLen} characters).`,
      priority: 'low',
    });
  } else if ((dLen >= 100 && dLen <= 119) || (dLen >= 161 && dLen <= 175)) {
    descLengthScore = 10;
    recommendations.push({
      type: 'warning',
      category: 'description',
      message: dLen < 120 ? `Meta description is slightly short (${dLen}/160 characters).` : `Meta description exceeds 160 characters (${dLen} chars).`,
      priority: 'medium',
    });
  } else {
    descLengthScore = 0;
    recommendations.push({
      type: 'error',
      category: 'description',
      message: dLen < 100 ? `Meta description is under 100 characters (${dLen} chars, aim for 120-160).` : `Meta description exceeds 175 characters (${dLen} chars).`,
      priority: 'high',
    });
  }

  // ─── 5. Readability (Max 15) ──────────────────────────────────────────────
  let readabilityScore = 0;
  const flesch = analysis.content.fleschReadingEase;

  if (flesch >= 60) {
    readabilityScore = 15;
    recommendations.push({
      type: 'success',
      category: 'readability',
      message: `Readability score is excellent (Flesch Ease: ${flesch}).`,
      priority: 'low',
    });
  } else if (flesch >= 40) {
    readabilityScore = 10;
    recommendations.push({
      type: 'warning',
      category: 'readability',
      message: `Readability is moderately complex (Flesch Ease: ${flesch}). Consider shorter sentences.`,
      priority: 'medium',
    });
  } else {
    readabilityScore = 5;
    recommendations.push({
      type: 'error',
      category: 'readability',
      message: `Readability score is difficult (Flesch Ease: ${flesch}). Simplify complex vocabulary and sentences.`,
      priority: 'high',
    });
  }

  // ─── 6. Keyword Density / Structure (Max 15) ──────────────────────────────
  let densityScore = 0;
  const density = analysis.keyword.densityPercentage;
  const wordCount = analysis.content.wordCount;

  if (wordCount < 30) {
    // Limited content text
    densityScore = 8;
    recommendations.push({
      type: 'warning',
      category: 'content',
      message: 'Content length is very short. Add more detailed paragraphs for accurate keyword density evaluation.',
      priority: 'medium',
    });
  } else if (density >= 1.0 && density <= 3.0) {
    densityScore = 15;
    recommendations.push({
      type: 'success',
      category: 'keyword',
      message: `Keyword density is optimal (${density}%).`,
      priority: 'low',
    });
  } else if ((density >= 0.5 && density < 1.0) || (density > 3.0 && density <= 4.5)) {
    densityScore = 8;
    recommendations.push({
      type: 'warning',
      category: 'keyword',
      message: density < 1.0 ? `Keyword density is slightly low (${density}%).` : `Keyword density is getting high (${density}%). Avoid keyword stuffing.`,
      priority: 'medium',
    });
  } else {
    densityScore = 0;
    recommendations.push({
      type: 'error',
      category: 'keyword',
      message: density < 0.5 ? `Keyword density is too low (${density}%). Include "${analysis.focusKeyword}" naturally in body paragraphs.` : `Keyword density is too high (${density}%). Reduce keyword repetitions to avoid search penalty.`,
      priority: 'high',
    });
  }

  // Headings Rule Checks
  if (analysis.headings.h1Count > 1) {
    recommendations.push({
      type: 'warning',
      category: 'headings',
      message: `Multiple H1 tags found (${analysis.headings.h1Count}). Use only one H1 per page.`,
      priority: 'medium',
    });
  }

  if (analysis.content.longParagraphsCount > 0) {
    recommendations.push({
      type: 'warning',
      category: 'content',
      message: `${analysis.content.longParagraphsCount} paragraph(s) exceed 150 words. Break them into smaller sections for better scannability.`,
      priority: 'low',
    });
  }

  // Compute Overall Sum
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      titlePlacementScore +
        titleLengthScore +
        descPlacementScore +
        descLengthScore +
        readabilityScore +
        densityScore
    )
  );

  const breakdown: ScoreBreakdown = {
    titlePlacement: { score: titlePlacementScore, max: 20 },
    titleLength: { score: titleLengthScore, max: 15 },
    descriptionPlacement: { score: descPlacementScore, max: 20 },
    descriptionLength: { score: descLengthScore, max: 15 },
    readability: { score: readabilityScore, max: 15 },
    keywordDensity: { score: densityScore, max: 15 },
  };

  return {
    overallScore,
    breakdown,
    recommendations,
  };
}
