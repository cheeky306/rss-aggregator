/**
 * Standalone digest script for GitHub Actions.
 * Replaces the Vercel cron API route.
 *
 * Usage: npx tsx scripts/run-digest.ts
 *
 * Required env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   GEMINI_API_KEY, RESEND_API_KEY, DIGEST_RECIPIENT_EMAIL
 */

import { processFeeds, extractFullText } from './lib/rss-fetcher';
import { generateBriefings, generateDigestIntro, ProcessedArticle } from './lib/ai-briefing';
import { saveArticles, saveArticlesWithoutAI, getArticleCountToday, articleExists, getDeletedUrls } from './lib/database';
import { sendDigestEmail } from './lib/email';

// Cost control settings
const DAILY_AI_LIMIT = 50;
const MAX_AI_PER_RUN = 20;
const PRIORITY_SOURCES = [
  'OpenAI Blog',
  'Anthropic News',
  'Google DeepMind Blog',
  'Google Gemini',
  'Google AI Blog',
  'LangChain Blog',
  'Artificial Analysis',
  'MIT Technology Review',
  'The Rundown AI',
];
const PRIORITY_CATEGORIES = ['agents', 'ai'];

function scoreArticle(article: { sourceName: string; category: string; title: string }): number {
  let score = 0;
  if (PRIORITY_SOURCES.some(s => article.sourceName.includes(s))) score += 100;
  if (PRIORITY_CATEGORIES.includes(article.category)) score += 50;
  const boostKeywords = ['launch', 'announce', 'release', 'new', 'breakthrough', 'gpt', 'claude', 'gemini', 'agent', 'llm'];
  const titleLower = article.title.toLowerCase();
  for (const keyword of boostKeywords) {
    if (titleLower.includes(keyword)) score += 10;
  }
  return score;
}

async function main() {
  const startTime = Date.now();
  const log: string[] = [];

  try {
    // Step 1: Fetch articles
    log.push('Fetching all RSS feeds...');
    const allArticles = await processFeeds();
    log.push(`Found ${allArticles.length} articles from last 24 hours`);

    if (allArticles.length === 0) {
      log.push('No new articles found');
      console.log(log.join('\n'));
      return;
    }

    // Step 2: Filter duplicates and deleted
    log.push('Checking for duplicates and deleted articles...');
    const deletedUrls = await getDeletedUrls();
    log.push(`Found ${deletedUrls.size} deleted URLs to skip`);

    const newArticles = [];
    let skippedDeleted = 0;
    for (const article of allArticles) {
      if (deletedUrls.has(article.url)) {
        skippedDeleted++;
        continue;
      }
      const exists = await articleExists(article.url);
      if (!exists) {
        newArticles.push(article);
      }
    }
    log.push(`${allArticles.length - newArticles.length - skippedDeleted} duplicates, ${skippedDeleted} deleted, ${newArticles.length} new`);

    if (newArticles.length === 0) {
      log.push('No new articles to save');
      console.log(log.join('\n'));
      return;
    }

    // Step 3: Check AI budget
    const todayCount = await getArticleCountToday();
    const remainingBudget = Math.max(0, DAILY_AI_LIMIT - todayCount);
    const maxAI = Math.min(remainingBudget, MAX_AI_PER_RUN);
    log.push(`AI budget: ${todayCount}/${DAILY_AI_LIMIT} used today, ${maxAI} available this run`);

    // Step 4: Score and sort
    const scoredArticles = newArticles.map(article => ({
      article,
      score: scoreArticle(article),
    }));
    scoredArticles.sort((a, b) => b.score - a.score);

    // Step 5: Split
    const aiArticles = scoredArticles.slice(0, maxAI).map(s => s.article);
    const nonAiArticles = scoredArticles.slice(maxAI).map(s => s.article);
    log.push(`Selected ${aiArticles.length} for AI, ${nonAiArticles.length} without AI`);

    // Step 6: Process AI articles
    let processedWithAI: ProcessedArticle[] = [];
    if (aiArticles.length > 0) {
      log.push('Extracting full text...');
      for (const article of aiArticles) {
        const fullText = await extractFullText(article.url);
        article.fullText = fullText;
      }

      log.push('Generating AI briefings...');
      processedWithAI = await generateBriefings(aiArticles);
      log.push(`Generated ${processedWithAI.length} AI briefings`);

      const { saved: aiSaved, errors: aiErrors } = await saveArticles(processedWithAI);
      log.push(`Saved ${aiSaved} AI articles (${aiErrors} errors)`);
    }

    // Step 7: Save non-AI articles
    if (nonAiArticles.length > 0) {
      const { saved: basicSaved, errors: basicErrors } = await saveArticlesWithoutAI(nonAiArticles);
      log.push(`Saved ${basicSaved} basic articles (${basicErrors} errors)`);
    }

    // Step 8: Generate digest intro
    let digestIntro = '';
    if (processedWithAI.length > 0) {
      log.push('Generating digest introduction...');
      digestIntro = await generateDigestIntro(processedWithAI);
    }

    // Step 9: Send email
    const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
    if (recipientEmail && processedWithAI.length > 0) {
      log.push(`Sending digest email to ${recipientEmail}...`);
      const emailResult = await sendDigestEmail(processedWithAI, digestIntro, recipientEmail);
      if (emailResult.success) {
        log.push('Email sent successfully');
      } else {
        log.push(`Email failed: ${emailResult.error}`);
      }
    } else if (processedWithAI.length === 0) {
      log.push('No AI articles to email');
    }

    const duration = Date.now() - startTime;
    log.push(`Completed in ${duration}ms`);
    console.log(log.join('\n'));
  } catch (error) {
    console.error('Digest failed:', error);
    log.push(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    console.log(log.join('\n'));
    process.exit(1);
  }
}

main();
