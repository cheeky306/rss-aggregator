import { NextResponse } from 'next/server';
import { processFeeds, extractFullText } from '@/lib/rss-fetcher';
import { generateBriefings, generateDigestIntro, ProcessedArticle } from '@/lib/ai-briefing';
import { saveArticles, saveArticlesWithoutAI, getArticleCountToday, articleExists } from '@/lib/database';
import { sendDigestEmail } from '@/lib/email';

// ============================================
// COST CONTROL SETTINGS
// ============================================
const DAILY_AI_LIMIT = 50;           // Max articles to process with AI per day
const MAX_AI_PER_RUN = 20;           // Max articles to AI-summarize per run
const PRIORITY_SOURCES = [           // Sources that always get AI summaries
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
const PRIORITY_CATEGORIES = ['agents', 'ai']; // Categories prioritized for AI
// ============================================

// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// Verify cron secret
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');

  if (!cronSecret) {
    console.warn('CRON_SECRET not set, skipping verification');
    return true;
  }

  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
}

// Score articles for AI priority
function scoreArticle(article: { sourceName: string; category: string; title: string }): number {
  let score = 0;
  
  // Priority sources get highest score
  if (PRIORITY_SOURCES.some(s => article.sourceName.includes(s))) {
    score += 100;
  }
  
  // Priority categories
  if (PRIORITY_CATEGORIES.includes(article.category)) {
    score += 50;
  }
  
  // Boost for certain keywords in title
  const boostKeywords = ['launch', 'announce', 'release', 'new', 'breakthrough', 'gpt', 'claude', 'gemini', 'agent', 'llm'];
  const titleLower = article.title.toLowerCase();
  for (const keyword of boostKeywords) {
    if (titleLower.includes(keyword)) {
      score += 10;
    }
  }
  
  return score;
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    // Step 1: Fetch ALL articles from RSS feeds
    log.push('Fetching all RSS feeds...');
    const allArticles = await processFeeds();
    log.push(`Found ${allArticles.length} articles from last 24 hours`);

    if (allArticles.length === 0) {
      log.push('No new articles found');
      return NextResponse.json({
        success: true,
        message: 'No new articles',
        log,
        duration: Date.now() - startTime,
      });
    }

    // Step 2: Filter out duplicates
    log.push('Checking for duplicates...');
    const newArticles = [];
    for (const article of allArticles) {
      const exists = await articleExists(article.url);
      if (!exists) {
        newArticles.push(article);
      }
    }
    log.push(`${allArticles.length - newArticles.length} duplicates skipped, ${newArticles.length} new articles`);

    if (newArticles.length === 0) {
      log.push('No new articles to save');
      return NextResponse.json({
        success: true,
        message: 'No new articles (all duplicates)',
        log,
        duration: Date.now() - startTime,
      });
    }

    // Step 3: Check AI budget
    const todayCount = await getArticleCountToday();
    const remainingBudget = Math.max(0, DAILY_AI_LIMIT - todayCount);
    const maxAI = Math.min(remainingBudget, MAX_AI_PER_RUN);
    log.push(`AI budget: ${todayCount}/${DAILY_AI_LIMIT} used today, ${maxAI} available this run`);

    // Step 4: Score and sort articles for AI priority
    const scoredArticles = newArticles.map(article => ({
      article,
      score: scoreArticle(article),
    }));
    scoredArticles.sort((a, b) => b.score - a.score);

    // Step 5: Split into AI-worthy and non-AI articles
    const aiArticles = scoredArticles.slice(0, maxAI).map(s => s.article);
    const nonAiArticles = scoredArticles.slice(maxAI).map(s => s.article);

    log.push(`Selected ${aiArticles.length} articles for AI summaries`);
    log.push(`${nonAiArticles.length} articles will be saved without AI`);

    // Step 6: Process AI articles (extract text + generate briefings)
    let processedWithAI: ProcessedArticle[] = [];
    if (aiArticles.length > 0) {
      log.push('Extracting full text for AI articles...');
      for (const article of aiArticles) {
        const fullText = await extractFullText(article.url);
        article.fullText = fullText;
      }

      log.push('Generating AI briefings...');
      processedWithAI = await generateBriefings(aiArticles);
      log.push(`Generated ${processedWithAI.length} AI briefings`);

      // Save AI-processed articles
      const { saved: aiSaved, errors: aiErrors } = await saveArticles(processedWithAI);
      log.push(`Saved ${aiSaved} AI articles (${aiErrors} errors)`);
    }

    // Step 7: Save non-AI articles (just basic info, no summaries)
    if (nonAiArticles.length > 0) {
      const { saved: basicSaved, errors: basicErrors } = await saveArticlesWithoutAI(nonAiArticles);
      log.push(`Saved ${basicSaved} basic articles without AI (${basicErrors} errors)`);
    }

    // Step 8: Generate digest intro (only if we have AI articles)
    let digestIntro = '';
    if (processedWithAI.length > 0) {
      log.push('Generating digest introduction...');
      digestIntro = await generateDigestIntro(processedWithAI);
    }

    // Step 9: Send email (only AI-processed articles)
    const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
    if (recipientEmail && processedWithAI.length > 0) {
      log.push(`Sending digest email to ${recipientEmail}...`);
      const emailResult = await sendDigestEmail(
        processedWithAI,
        digestIntro,
        recipientEmail
      );

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

    return NextResponse.json({
      success: true,
      totalNewArticles: newArticles.length,
      aiProcessed: processedWithAI.length,
      savedWithoutAI: nonAiArticles.length,
      dailyUsage: {
        used: todayCount + processedWithAI.length,
        limit: DAILY_AI_LIMIT,
        remaining: DAILY_AI_LIMIT - todayCount - processedWithAI.length,
      },
      duration,
      log,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    log.push(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        log,
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}
