# RSS News Aggregator

AI-powered news aggregation with daily email digests and a content creation database.

## Features

- **Daily Email Digest**: Curated briefings delivered every morning at 6am UTC
- **AI-Powered Analysis**: Claude generates summaries, briefings, tags, and content angles
- **Content Creation Hub**: Searchable database with filtering by category, tags, and keywords
- **Full-Text Extraction**: Automatically pulls complete article text, not just RSS snippets
- **Customizable Sources**: Easy to add/remove RSS feeds across categories

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Hosting**: Vercel (with Cron)
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **AI**: OpenAI GPT-4o

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to SQL Editor
3. Copy the contents of `supabase/schema.sql` and run it
4. Go to Settings → API and copy:
   - Project URL → `SUPABASE_URL`
   - Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Get API Keys

**OpenAI**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key → `OPENAI_API_KEY`

**Resend (Email)**
1. Go to [resend.com](https://resend.com) and sign up
2. Add and verify your domain (or use their test domain initially)
3. Create an API key → `RESEND_API_KEY`

### 3. Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables (see `.env.example`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-your-openai-key
RESEND_API_KEY=re_your-key
EMAIL_FROM=Daily Digest <digest@yourdomain.com>
DIGEST_RECIPIENT_EMAIL=your@email.com
CRON_SECRET=generate-a-random-string
```

4. Deploy

### 4. Configure Cron

The `vercel.json` file configures a daily cron job at 6am UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/digest",
      "schedule": "0 6 * * *"
    }
  ]
}
```

To change the time, modify the cron expression. Examples:
- `0 7 * * *` = 7am UTC daily
- `0 6 * * 1-5` = 6am UTC weekdays only
- `0 */12 * * *` = Every 12 hours

### 5. Test It

Visit your deployment and click "Run Digest Now" to test the full pipeline.

## Customizing Feeds

Edit `src/lib/feeds.ts` to add or remove RSS sources:

```typescript
export const feedSources: FeedSource[] = [
  {
    name: 'Your New Source',
    url: 'https://example.com/feed.xml',
    category: 'ai', // ai | seo | tech | marketing
  },
  // ... more feeds
];
```

## API Endpoints

### `GET /api/cron/digest`
Runs the full aggregation pipeline. Protected by `CRON_SECRET`.

### `GET /api/articles`
Fetch articles with filters:
- `?category=ai` - Filter by category
- `?search=openai` - Text search
- `?tags=gpt,llm` - Filter by tags
- `?limit=20&offset=0` - Pagination
- `?action=stats` - Get statistics
- `?action=tags` - Get tag counts

## Cost Estimates

**Monthly costs at ~50 articles/day:**
- Supabase: Free tier (500MB)
- Vercel: Free tier (hobby) or paid for cron
- Resend: Free tier (100 emails/day)
- OpenAI API: ~$5-15/month depending on article count

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

## License

MIT
