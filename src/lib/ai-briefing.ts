import { GoogleGenerativeAI } from '@google/generative-ai';
import { RawArticle } from './rss-fetcher';

export interface ProcessedArticle extends RawArticle {
  summary: string;
  briefing: string;
  tags: string[];
  contentAngles: string[];
}

// Process a batch of articles with Gemini
export async function generateBriefings(
  articles: RawArticle[]
): Promise<ProcessedArticle[]> {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return articles.map((article) => ({
      ...article,
      summary: article.snippet?.slice(0, 300) || '',
      briefing: '',
      tags: [],
      contentAngles: [],
    }));
  }

  // Process in batches to manage API costs and context
  const batchSize = 5;
  const results: ProcessedArticle[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i/batchSize) + 1}, articles ${i + 1}-${Math.min(i + batchSize, articles.length)}`);
    const processed = await processBatch(batch);
    results.push(...processed);
  }

  return results;
}

async function processBatch(articles: RawArticle[]): Promise<ProcessedArticle[]> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const articlesContext = articles
    .map(
      (a, idx) => `
ARTICLE ${idx + 1}:
Title: ${a.title}
Source: ${a.sourceName}
Category: ${a.category}
Content: ${(a.fullText || a.snippet || '').slice(0, 2000)}
---`
    )
    .join('\n');

  const prompt = `Analyze these ${articles.length} articles and provide analysis for EACH ONE.

For each article provide:
1. summary: 2-3 sentence summary of key facts
2. briefing: 1-2 paragraph analysis with business/marketing implications
3. tags: 3-5 topic tags as array
4. contentAngles: 2-3 specific content ideas as array

Return ONLY valid JSON with "articles" array containing objects with: summary, briefing, tags, contentAngles

${articlesContext}

Return ONLY valid JSON, no markdown:`;

  try {
    console.log('Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    console.log('Gemini response received, length:', content?.length || 0);
    
    if (!content) {
      console.error('No content in Gemini response');
      throw new Error('No response content');
    }

    // Clean up response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.slice(7);
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.slice(3);
    }
    if (cleanContent.endsWith('```')) {
      cleanContent = cleanContent.slice(0, -3);
    }
    cleanContent = cleanContent.trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanContent);
      console.log('Parsed JSON successfully, keys:', Object.keys(parsed));
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content.slice(0, 500));
      throw parseError;
    }
    
    // Handle both array and object with articles key
    const articlesData = Array.isArray(parsed) ? parsed : (parsed.articles || []);
    console.log(`Got ${articlesData.length} article analyses from Gemini`);

    if (articlesData.length === 0) {
      console.error('No articles data in response. Full response:', JSON.stringify(parsed).slice(0, 500));
    }

    return articles.map((article, idx) => {
      const data = articlesData[idx] || {};
      const result = {
        ...article,
        summary: data.summary || article.snippet?.slice(0, 300) || '',
        briefing: data.briefing || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        contentAngles: Array.isArray(data.contentAngles) ? data.contentAngles : [],
      };
      
      if (!data.briefing) {
        console.warn(`No briefing for article ${idx + 1}: ${article.title.slice(0, 50)}`);
      }
      
      return result;
    });
  } catch (error) {
    console.error('Error generating briefings:', error);
    // Return articles with snippet as fallback
    return articles.map((article) => ({
      ...article,
      summary: article.snippet?.slice(0, 300) || '',
      briefing: '',
      tags: [],
      contentAngles: [],
    }));
  }
}

// Generate the daily digest summary
export async function generateDigestIntro(
  articles: ProcessedArticle[]
): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    return 'Today\'s digest contains the latest news from your RSS feeds.';
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Only use articles that have actual briefings
  const articlesWithBriefings = articles.filter(a => a.briefing && a.briefing.length > 0);
  
  if (articlesWithBriefings.length === 0) {
    console.log('No articles with briefings for digest intro');
    return 'Today\'s digest contains the latest news from your RSS feeds.';
  }

  const topStories = articlesWithBriefings.slice(0, 10);

  const context = topStories
    .map((a) => `- ${a.title} (${a.sourceName}): ${a.summary || a.briefing?.slice(0, 200)}`)
    .join('\n');

  const prompt = `Write a 2-3 paragraph executive summary for a daily news digest based on these stories. Highlight the biggest themes and what matters for someone in marketing/AI.

Today's stories:
${context}

Write conversationally, no bullet points:`;

  try {
    console.log('Generating digest intro...');
    const result = await model.generateContent(prompt);
    const intro = result.response.text() || '';
    console.log('Digest intro generated, length:', intro.length);
    return intro;
  } catch (error) {
    console.error('Error generating digest intro:', error);
    return 'Today\'s digest contains the latest news from your RSS feeds.';
  }
}
