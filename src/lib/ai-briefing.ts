import OpenAI from 'openai';
import { RawArticle } from './rss-fetcher';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface ProcessedArticle extends RawArticle {
  summary: string;
  briefing: string;
  tags: string[];
  contentAngles: string[];
}

// Process a batch of articles with OpenAI
export async function generateBriefings(
  articles: RawArticle[]
): Promise<ProcessedArticle[]> {
  // Process in batches to manage API costs and context
  const batchSize = 10;
  const results: ProcessedArticle[] = [];

  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const processed = await processBatch(batch);
    results.push(...processed);
  }

  return results;
}

async function processBatch(articles: RawArticle[]): Promise<ProcessedArticle[]> {
  const articlesContext = articles
    .map(
      (a, idx) => `
ARTICLE ${idx + 1}:
Title: ${a.title}
Source: ${a.sourceName}
Category: ${a.category}
URL: ${a.url}
Content: ${a.fullText || a.snippet}
---`
    )
    .join('\n');

  const prompt = `You are a senior marketing strategist and content analyst helping a marketing professional stay informed on AI, SEO, and tech news.

Analyze these articles and for EACH ONE provide:

1. **Summary** (2-3 sentences): The key facts and why they matter
2. **Briefing** (1-2 paragraphs): A deeper analysis suitable for a morning briefing. Include context, implications for marketing/business, and any connections to broader trends. Write in a clear, professional tone.
3. **Tags** (3-5): Specific topic tags for filtering/searching
4. **Content Angles** (2-3): Specific ideas for how this news could be turned into original content. Be specific, not generic. Consider the perspective of someone building thought leadership in AI commerce and marketing.

Format your response as a JSON object with an "articles" key containing an array. Each object should have: title, summary, briefing, tags (array), contentAngles (array).

${articlesContext}

Respond ONLY with valid JSON.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content');
    }

    const parsed = JSON.parse(content);
    
    // Handle both array and object with articles key
    const articlesData = Array.isArray(parsed) ? parsed : parsed.articles || [];

    return articles.map((article, idx) => ({
      ...article,
      summary: articlesData[idx]?.summary || '',
      briefing: articlesData[idx]?.briefing || '',
      tags: articlesData[idx]?.tags || [],
      contentAngles: articlesData[idx]?.contentAngles || [],
    }));
  } catch (error) {
    console.error('Error generating briefings:', error);
    // Return articles with empty analysis on error
    return articles.map((article) => ({
      ...article,
      summary: '',
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
  const topStories = articles.slice(0, 15);

  const context = topStories
    .map((a) => `- ${a.title} (${a.sourceName}): ${a.summary}`)
    .join('\n');

  const prompt = `You are writing the introduction to a daily news digest for a marketing professional focused on AI, SEO, and tech.

Based on these top stories from the last 24 hours, write a 2-3 paragraph executive summary highlighting:
- The biggest story or theme of the day
- Key developments worth paying attention to
- Any patterns or connections across stories

Keep it conversational but professional. No bullet points. Write in a way that helps the reader quickly understand what matters today.

Today's stories:
${context}

Write the intro now:`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating digest intro:', error);
    return '';
  }
}
