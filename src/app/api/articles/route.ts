import { NextRequest, NextResponse } from 'next/server';
import { getArticles, getStats, getTagCounts } from '@/lib/database';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const action = searchParams.get('action') || 'list';

  try {
    if (action === 'stats') {
      const stats = await getStats();
      return NextResponse.json(stats);
    }

    if (action === 'tags') {
      const tags = await getTagCounts();
      return NextResponse.json(tags);
    }

    // Default: list articles
    const { articles, total } = await getArticles({
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
      startDate: searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined,
      endDate: searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined,
    });

    return NextResponse.json({
      articles,
      count: articles.length,
      total,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
