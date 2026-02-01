import { NextResponse } from 'next/server';
import { processFeeds, extractFullText } from '@/lib/rss-fetcher';
import { generateBriefings, generateDigestIntro } from '@/lib/ai-briefing';
import { saveArticles } from '@/lib/database';
import { sendDigestEmail } from '@/lib/email';

// Vercel Cron configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// Verify cron secret to prevent unauthorized access
// Allows: Vercel cron (with secret), or manual trigger with ?secret= param
function verifyCronSecret(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');

  if (!cronSecret) {
    console.warn('CRON_SECRET not set, skipping verification');
    return true;
  }

  // Allow either header auth (Vercel cron) or query param (manual trigger)
  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;
}

export async function GET(request: Request) {
  // Verify this is a legitimate cron call
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const log: string[] = [];

  try {
    // Step 1: Fetch and process RSS feeds
    log.push('Starting RSS aggregation...');
    const articles = await processFeeds();
    log.push(`Found ${articles.length} articles from last 24 hours`);

    if (articles.length === 0) {
      log.push('No new articles found, skipping processing');
      return NextResponse.json({
        success: true,
        message: 'No new articles',
        log,
        duration: Date.now() - startTime,
      });
    }

    // Step 2: Extract full text for top articles (limit to save time/costs)
    log.push('Extracting full text...');
    const topArticles = articles.slice(0, 30); // Process top 30
    
    for (const article of topArticles) {
      const fullText = await extractFullText(article.url);
      article.fullText = fullText;
    }
    log.push(`Extracted text from ${topArticles.length} articles`);

    // Step 3: Generate AI briefings
    log.push('Generating AI briefings...');
    const processedArticles = await generateBriefings(topArticles);
    log.push(`Generated briefings for ${processedArticles.length} articles`);

    // Step 4: Save to database
    log.push('Saving to database...');
    const { saved, errors } = await saveArticles(processedArticles);
    log.push(`Saved ${saved} articles (${errors} errors)`);

    // Step 5: Generate digest intro
    log.push('Generating digest introduction...');
    const digestIntro = await generateDigestIntro(processedArticles);

    // Step 6: Send email
    const recipientEmail = process.env.DIGEST_RECIPIENT_EMAIL;
    if (recipientEmail) {
      log.push(`Sending digest email to ${recipientEmail}...`);
      const emailResult = await sendDigestEmail(
        processedArticles,
        digestIntro,
        recipientEmail
      );

      if (emailResult.success) {
        log.push('Email sent successfully');
      } else {
        log.push(`Email failed: ${emailResult.error}`);
      }
    } else {
      log.push('No recipient email configured, skipping email');
    }

    const duration = Date.now() - startTime;
    log.push(`Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      articlesProcessed: processedArticles.length,
      articlesSaved: saved,
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
