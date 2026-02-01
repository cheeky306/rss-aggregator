import { NextResponse } from 'next/server';
import { getArticleById } from '@/lib/database';
import { extractFullText } from '@/lib/rss-fetcher';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const article = await getArticleById(id);

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // If we already have full text, return it
    if (article.full_text) {
      return NextResponse.json({ fullText: article.full_text });
    }

    // Otherwise, fetch it now
    const fullText = await extractFullText(article.url);

    if (fullText) {
      // Cache it in the database for next time
      await supabase
        .from('articles')
        .update({ full_text: fullText })
        .eq('id', id);

      return NextResponse.json({ fullText });
    }

    return NextResponse.json({ 
      fullText: null, 
      message: 'Could not extract full text. Try reading the original article.' 
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
  }
}
