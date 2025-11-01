import 'dotenv/config';
// import * as fs from 'fs';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from 'langchain';

// import { scrape } from './scrape.js';
import { SUMMARIZATION_PROMPT, ULTRA_SUMMARIZATION_PROMPT } from './prompts.js';
import { z } from 'zod';

const llm = new ChatOpenAI({
  model: 'gpt-4.1-mini',
  apiKey: process.env.OPENAI_API_KEY,
});

// const contentUrl = 'https://blog.langchain.com/context-engineering-for-agents/';

// const content = await scrape(contentUrl);

// fs.writeFileSync('content.md', content as string);
// const content = fs.readFileSync('content.md', 'utf8');

// const messages = [
//   new SystemMessage(ULTRA_SUMMARIZATION_PROMPT),
//   new HumanMessage(content),
// ];

// console.log('--content', content.slice(0, 100));
// const completion = await llm.invoke(messages);

// console.log('-completion', completion.content.slice(0, 100) + '...');

// fs.writeFileSync('completion.md', completion.content as string);

export async function summarize(
  content: string,
  ultra: boolean
): Promise<{ title: string; summary: string }> {
  const messages = [
    new SystemMessage(
      ultra ? ULTRA_SUMMARIZATION_PROMPT : SUMMARIZATION_PROMPT
    ),
    new HumanMessage(content),
  ];
  const summary = await llm
    .withStructuredOutput(
      z.object({
        title: z.string(),
        summary: z.string(),
      })
    )
    .invoke(messages);
  return summary;
}
