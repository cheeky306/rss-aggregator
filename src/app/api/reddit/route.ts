import { NextResponse } from 'next/server';
import { fetchAllRedditFeeds, redditFeeds, fetchRedditPosts } from '@/lib/reddit';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const subreddit = searchParams.get('subreddit');

  try {
    let posts;

    if (subreddit) {
      // Fetch specific subreddit
      const feed = redditFeeds.find(f => f.subreddit.toLowerCase() === subreddit.toLowerCase());
      posts = await fetchRedditPosts(subreddit, feed?.category || 'tech', 25);
    } else if (category) {
      // Fetch all subreddits in a category
      const categoryFeeds = redditFeeds.filter(f => f.category === category);
      const allPosts = [];
      for (const feed of categoryFeeds) {
        const feedPosts = await fetchRedditPosts(feed.subreddit, feed.category, 10);
        allPosts.push(...feedPosts);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      posts = allPosts.sort((a, b) => b.score - a.score);
    } else {
      // Fetch all
      posts = await fetchAllRedditFeeds();
    }

    return NextResponse.json({ posts, count: posts.length });
  } catch (error) {
    console.error('Reddit fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch Reddit posts' }, { status: 500 });
  }
}
