import { Resend } from 'resend';
import { ProcessedArticle } from './ai-briefing';
import { categoryLabels } from './feeds';

const resend = new Resend(process.env.RESEND_API_KEY);

interface DigestEmailProps {
  articles: ProcessedArticle[];
  digestIntro: string;
  date: Date;
}

function groupByCategory(
  articles: ProcessedArticle[]
): Record<string, ProcessedArticle[]> {
  return articles.reduce(
    (acc, article) => {
      const cat = article.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(article);
      return acc;
    },
    {} as Record<string, ProcessedArticle[]>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const categoryEmojis: Record<string, string> = {
  agents: '🤖',
  ai: '🧠',
  seo: '🔍',
  tech: '💻',
  marketing: '📈',
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  agents: { bg: '#f3e8ff', text: '#7c3aed', border: '#c4b5fd' },
  ai: { bg: '#fae8ff', text: '#a21caf', border: '#f0abfc' },
  seo: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  tech: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  marketing: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' },
};

function generateEmailHTML({
  articles,
  digestIntro,
  date,
}: DigestEmailProps): string {
  const grouped = groupByCategory(articles);

  const categoryBlocks = Object.entries(grouped)
    .map(([category, categoryArticles]) => {
      const label = categoryLabels[category as keyof typeof categoryLabels] || category;
      const emoji = categoryEmojis[category] || '📰';
      const colors = categoryColors[category] || categoryColors.tech;

      const articleBlocks = categoryArticles
        .slice(0, 10)
        .map(
          (article) => `
        <tr>
          <td style="padding: 0 0 24px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden;">
              <tr>
                <td style="padding: 20px;">
                  <!-- Source & Date -->
                  <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; font-weight: 500;">
                    ${article.sourceName} · ${article.publishedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  
                  <!-- Title -->
                  <h3 style="margin: 0 0 12px 0; font-size: 18px; line-height: 1.4;">
                    <a href="${article.url}" style="color: #111827; text-decoration: none;">${article.title}</a>
                  </h3>
                  
                  <!-- Briefing -->
                  ${article.briefing ? `
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.7;">
                    ${article.briefing}
                  </p>
                  ` : (article.summary ? `
                  <p style="margin: 0 0 16px 0; color: #374151; font-size: 15px; line-height: 1.7;">
                    ${article.summary}
                  </p>
                  ` : '')}
                  
                  <!-- Tags -->
                  ${article.tags && article.tags.length > 0 ? `
                  <p style="margin: 0 0 16px 0;">
                    ${article.tags.map((tag) => `<span style="display: inline-block; background: #f3f4f6; color: #4b5563; padding: 4px 10px; border-radius: 100px; font-size: 12px; margin-right: 6px; margin-bottom: 6px;">${tag}</span>`).join('')}
                  </p>
                  ` : ''}
                  
                  <!-- Content Angles -->
                  ${article.contentAngles && article.contentAngles.length > 0 ? `
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; margin-top: 4px;">
                    <tr>
                      <td style="padding: 14px 16px;">
                        <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #92400e;">💡 CONTENT IDEAS</p>
                        ${article.contentAngles.map((angle) => `<p style="margin: 0 0 4px 0; font-size: 13px; color: #78350f; padding-left: 12px;">→ ${angle}</p>`).join('')}
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  <!-- Read More Button -->
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                    <tr>
                      <td style="background: #111827; border-radius: 6px;">
                        <a href="${article.url}" style="display: inline-block; padding: 10px 20px; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 500;">Read Article →</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `
        )
        .join('');

      return `
        <tr>
          <td style="padding: 0 0 32px 0;">
            <!-- Category Header -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
              <tr>
                <td>
                  <span style="display: inline-block; background: ${colors.bg}; color: ${colors.text}; padding: 8px 16px; border-radius: 100px; font-size: 14px; font-weight: 600; border: 1px solid ${colors.border};">
                    ${emoji} ${label.replace(/[^\w\s&]/g, '')}
                  </span>
                  <span style="color: #9ca3af; font-size: 13px; margin-left: 12px;">${categoryArticles.length} article${categoryArticles.length > 1 ? 's' : ''}</span>
                </td>
              </tr>
            </table>
            
            <!-- Articles -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              ${articleBlocks}
            </table>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tilly's Journal</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 640px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%); padding: 40px 32px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; font-size: 32px; color: #ffffff; font-weight: 700;">📓 Tilly's Journal</h1>
              <p style="margin: 0; color: #c7d2fe; font-size: 15px;">${formatDate(date)}</p>
            </td>
          </tr>
          
          <!-- Overview Section -->
          ${digestIntro ? `
          <tr>
            <td style="padding: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; border-left: 4px solid #3b82f6;">
                <tr>
                  <td style="padding: 24px;">
                    <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px;">📋 Today's Overview</h2>
                    <p style="margin: 0; color: #1e3a5f; font-size: 15px; line-height: 1.8;">${digestIntro}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}
          
          <!-- Stats Bar -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px 20px; text-align: center; border-right: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${articles.length}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Articles</p>
                  </td>
                  <td style="padding: 16px 20px; text-align: center; border-right: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${Object.keys(grouped).length}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Categories</p>
                  </td>
                  <td style="padding: 16px 20px; text-align: center;">
                    <p style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">${articles.filter(a => a.contentAngles && a.contentAngles.length > 0).length}</p>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280; text-transform: uppercase;">Content Ideas</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Articles by Category -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${categoryBlocks}
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px;">
                Generated by Tilly's Journal 📓
              </p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background: #4f46e5; border-radius: 6px;">
                    <a href="${process.env.DASHBOARD_URL || '#'}" style="display: inline-block; padding: 12px 24px; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500;">View Full Archive →</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 11px;">
                You're receiving this because you subscribed to Tilly's Journal.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `;
}

function generatePlainText({
  articles,
  digestIntro,
  date,
}: DigestEmailProps): string {
  const grouped = groupByCategory(articles);

  let text = `📓 TILLY'S JOURNAL\n${formatDate(date)}\n\n`;
  
  if (digestIntro) {
    text += `TODAY'S OVERVIEW\n${'─'.repeat(40)}\n${digestIntro}\n\n`;
  }
  
  text += `Found ${articles.length} articles across ${Object.keys(grouped).length} categories.\n\n`;
  text += '═'.repeat(50) + '\n\n';

  Object.entries(grouped).forEach(([category, categoryArticles]) => {
    const label = categoryLabels[category as keyof typeof categoryLabels] || category;
    const emoji = categoryEmojis[category] || '📰';
    
    text += `${emoji} ${label.toUpperCase()}\n${'─'.repeat(40)}\n\n`;

    categoryArticles.slice(0, 10).forEach((article) => {
      text += `★ ${article.title}\n`;
      text += `  ${article.sourceName} · ${article.publishedAt.toLocaleDateString()}\n`;
      text += `  ${article.url}\n\n`;
      
      if (article.briefing) {
        text += `  ${article.briefing}\n\n`;
      } else if (article.summary) {
        text += `  ${article.summary}\n\n`;
      }
      
      if (article.contentAngles && article.contentAngles.length > 0) {
        text += `  💡 Content Ideas:\n`;
        article.contentAngles.forEach((angle) => {
          text += `     → ${angle}\n`;
        });
        text += '\n';
      }
      text += '─'.repeat(40) + '\n\n';
    });
  });

  text += '\n═'.repeat(50) + '\n';
  text += "Generated by Tilly's Journal 📓\n";

  return text;
}

export async function sendDigestEmail(
  articles: ProcessedArticle[],
  digestIntro: string,
  recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
  const date = new Date();

  const emailProps: DigestEmailProps = {
    articles,
    digestIntro,
    date,
  };

  try {
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Tilly's Journal <digest@yourdomain.com>",
      to: recipientEmail,
      subject: `📓 Tilly's Journal - ${formatDate(date)}`,
      html: generateEmailHTML(emailProps),
      text: generatePlainText(emailProps),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
