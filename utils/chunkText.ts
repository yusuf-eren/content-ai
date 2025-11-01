function markdownToPlainText(markdown: string): string {
  let text = markdown;

  text = text.replace(/^```[\s\S]*?```/gm, '');
  
  text = text.replace(/`([^`]+)`/g, '$1');
  
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1');
  
  text = text.replace(/^[-*+]\s+(.+)$/gm, '$1');
  
  text = text.replace(/^\d+\.\s+(.+)$/gm, '$1');
  
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  
  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  text = text.replace(/^\|.+\|$/gm, '');
  
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

export function chunkText(text: string, sentencesPerChunk: number = 3): string[] {
  const chunks: string[] = [];
  
  if (!text.trim()) {
    return [];
  }

  const plainText = markdownToPlainText(text);
  
  const sentenceRegex = /[.!?]+\s*/g;
  const allSentences: string[] = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = sentenceRegex.exec(plainText)) !== null) {
    const sentence = plainText.substring(lastIndex, match.index + match[0].length).trim();
    if (sentence) {
      allSentences.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < plainText.length) {
    const remaining = plainText.substring(lastIndex).trim();
    if (remaining) {
      allSentences.push(remaining);
    }
  }

  for (let i = 0; i < allSentences.length; i += sentencesPerChunk) {
    const chunk = allSentences
      .slice(i, i + sentencesPerChunk)
      .join(' ')
      .trim();
    
    if (chunk) {
      chunks.push(chunk);
    }
  }

  return chunks;
}

