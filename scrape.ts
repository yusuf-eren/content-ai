import 'dotenv/config';

export async function scrape(url: string): Promise<string> {
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
    throw new Error('Failed to scrape URL');
    console.error(error);
  }
}
