import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { message, articleId, conversationHistory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json({ error: 'AI not configured' }, { status: 500 });
    }

    // Build context from article if provided
    let articleContext = '';
    if (articleId) {
      const { data: article } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (article) {
        articleContext = `
CURRENT ARTICLE:
Title: ${article.title}
Source: ${article.source_name}
Category: ${article.category}
Summary: ${article.summary || 'N/A'}
AI Briefing: ${article.briefing || 'N/A'}
Full Text: ${article.full_text?.slice(0, 3000) || 'Not available'}
Tags: ${article.tags?.join(', ') || 'N/A'}
---
`;
      }
    }

    // Get recent articles for general context
    const { data: recentArticles } = await supabase
      .from('articles')
      .select('title, source_name, category, summary, briefing')
      .order('published_at', { ascending: false })
      .limit(10);

    const recentContext = recentArticles
      ?.map(a => `- ${a.title} (${a.source_name}): ${a.summary || a.briefing || 'No summary'}`)
      .join('\n') || '';

    const systemPrompt = `You are a helpful AI assistant integrated into Tilly's Journal, a news aggregator focused on AI, tech, SEO, and marketing news.

Your role is to:
- Help users understand articles and news
- Provide summaries, explanations, and analysis
- Answer questions about the content
- Suggest content ideas and angles
- Help with research and comparisons

${articleContext ? `The user is currently viewing this article:\n${articleContext}` : ''}

Recent articles in the digest for context:
${recentContext}

Be concise, helpful, and conversational. Use markdown formatting when helpful.`;

    // Build messages array with conversation history
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) { // Keep last 10 messages
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      temperature: 0.7,
      messages,
    });

    const reply = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate response: ${errorMessage}` },
      { status: 500 }
    );
  }
}
