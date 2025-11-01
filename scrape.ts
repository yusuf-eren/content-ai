import 'dotenv/config';

export async function scrape(url: string): Promise<string> {
  if (
    url.startsWith('https://www.reddit.com') ||
    url.startsWith('https://reddit.com')
  ) {
    return await scrapeReddit(url);
  } else {
    return await scrapeWithFirecrawl(url);
  }
}

async function scrapeReddit(url: string): Promise<string> {
  const res = await fetch(url.replace(/\/$/, '') + '/.json');
  const json = await res.json();

  const post = json?.[0]?.data?.children?.[0]?.data;
  const comments = json?.[1]?.data?.children || [];

  let output = '';

  if (post) {
    output += `# Post\n`;
    output += `Title: ${post.title || ''}\n`;
    output += `Desc: ${post.selftext || '(no description)'}\n\n`;
  }

  output += `# Comments\n`;

  function extractComments(nodes: any[], depth = 0): void {
    for (const node of nodes) {
      if (node.kind === 't1' && node.data?.body) {
        const indent = '  '.repeat(depth);
        output += `${indent}- ${node.data.body}\n`;
        const replies = node.data.replies;
        if (replies && typeof replies === 'object' && replies.data?.children) {
          extractComments(replies.data.children, depth + 1);
        }
      }
    }
  }

  extractComments(comments);

  return output.trim();
}

async function scrapeWithFirecrawl(url: string): Promise<string> {
  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.FIRECRAWL_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      maxAge: 172800000,
      parsers: ['pdf'],
      formats: ['markdown'],
    }),
  };

  try {
    const response = await fetch(
      'https://api.firecrawl.dev/v2/scrape',
      options
    );
    const data = await response.json();
    if (!data?.data?.markdown) {
      throw new Error('Failed to scrape URL: ' + JSON.stringify(data));
    }
    return data?.data?.markdown as string;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to scrape URL');
  }
}
