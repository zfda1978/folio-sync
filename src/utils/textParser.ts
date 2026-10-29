import { Chapter, Question, Questionnaire } from '../types';

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTime(words: number): number {
  return Math.max(1, Math.round(words / 220));
}

export function parseChaptersFromText(rawText: string): Chapter[] {
  if (!rawText || !rawText.trim()) return [];

  // Common chapter regex patterns
  const chapterRegex = /(?:^|\n)(?:(?:CHAPTER|Chapter|ACT|Act|PART|Part|BOOK|Book)\s+(?:[0-9IVXLCDM]+|[A-Za-z]+)(?:\s*[:\-–—]\s*[^\n]+)?|#{1,3}\s+[^\n]+)/g;

  const matches: { title: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = chapterRegex.exec(rawText)) !== null) {
    matches.push({
      title: match[0].trim().replace(/^#+\s*/, ''),
      index: match.index,
    });
  }

  // If no clear chapter headers found, check if text is long enough to split into logical parts
  if (matches.length < 2) {
    const totalWords = calculateWordCount(rawText);
    if (totalWords > 3000) {
      // Split into ~1500-2000 word chunks
      const paragraphs = rawText.split(/\n\s*\n/);
      const chapters: Chapter[] = [];
      let currentChunk: string[] = [];
      let currentWords = 0;
      let partNumber = 1;

      for (const p of paragraphs) {
        const pWords = calculateWordCount(p);
        currentChunk.push(p);
        currentWords += pWords;

        if (currentWords >= 1800) {
          const content = currentChunk.join('\n\n');
          chapters.push({
            id: `part-${partNumber}`,
            title: `Part ${partNumber}`,
            content,
            wordCount: calculateWordCount(content),
            order: partNumber,
          });
          partNumber++;
          currentChunk = [];
          currentWords = 0;
        }
      }

      if (currentChunk.length > 0) {
        const content = currentChunk.join('\n\n');
        chapters.push({
          id: `part-${partNumber}`,
          title: `Part ${partNumber}`,
          content,
          wordCount: calculateWordCount(content),
          order: partNumber,
        });
      }

      return chapters;
    }

    // Single chapter/text
    return [
      {
        id: 'full-text',
        title: 'Full Book Text',
        content: rawText.trim(),
        wordCount: calculateWordCount(rawText),
        order: 1,
      },
    ];
  }

  // Extract chapters based on matched headers
  const chapters: Chapter[] = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const content = rawText.slice(current.index, nextIndex).trim();

    chapters.push({
      id: `ch-${i + 1}`,
      title: current.title,
      content,
      wordCount: calculateWordCount(content),
      order: i + 1,
    });
  }

  return chapters;
}

export function formatQuestionnaireToMarkdown(quest: Questionnaire, includeAnswers = true): string {
  let md = `# ${quest.title}\n\n`;
  md += `**Book:** ${quest.bookTitle} by ${quest.bookAuthor}\n`;
  md += `**Target Audience:** ${quest.targetAudience.replace('_', ' ').toUpperCase()} | **Difficulty:** ${quest.difficulty.toUpperCase()} | **Total Questions:** ${quest.questions.length}\n\n`;
  md += `*${quest.description}*\n\n---\n\n`;

  quest.questions.forEach((q, idx) => {
    md += `### Question ${idx + 1} (${q.points} pts) [${q.bloomsLevel.toUpperCase()}]\n`;
    md += `${q.prompt}\n\n`;

    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, optIdx) => {
        const letter = String.fromCharCode(65 + optIdx);
        md += `  ${letter}. ${opt}\n`;
      });
      md += '\n';
    }

    if (includeAnswers) {
      let correctDisplay = '';
      if (q.options && q.options.length > 0 && !isNaN(Number(q.correctAnswer))) {
        const idx = Number(q.correctAnswer);
        const letter = String.fromCharCode(65 + idx);
        correctDisplay = `${letter}. ${q.options[idx] || q.correctAnswer}`;
      } else {
        correctDisplay = String(q.correctAnswer);
      }

      md += `**Correct Answer:** ${correctDisplay}\n\n`;
      md += `**Explanation & Rationale:** ${q.explanation}\n`;
      if (q.bookCitation?.quoteSnippet) {
        md += `> "${q.bookCitation.quoteSnippet}" ${q.bookCitation.chapter ? `(${q.bookCitation.chapter})` : ''}\n`;
      }
      md += '\n---\n\n';
    } else {
      md += `\n*Your Answer: _________________________________________________*\n\n---\n\n`;
    }
  });

  return md;
}

export function exportQuestionnaireToCsv(quest: Questionnaire): string {
  // Standard QTI / LMS CSV layout: Question Type, Question Text, Option A, Option B, Option C, Option D, Correct Answer, Explanation, Points
  const headers = ['Number', 'Type', 'Question Prompt', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Points', 'Bloom Taxonomy', 'Explanation'];
  const rows = quest.questions.map((q, idx) => {
    const optA = q.options?.[0] || '';
    const optB = q.options?.[1] || '';
    const optC = q.options?.[2] || '';
    const optD = q.options?.[3] || '';
    let answerText = String(q.correctAnswer);
    if (q.options && !isNaN(Number(q.correctAnswer))) {
      answerText = String.fromCharCode(65 + Number(q.correctAnswer));
    }

    const clean = (str: string) => `"${(str || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;

    return [
      idx + 1,
      clean(q.type),
      clean(q.prompt),
      clean(optA),
      clean(optB),
      clean(optC),
      clean(optD),
      clean(answerText),
      q.points,
      clean(q.bloomsLevel),
      clean(q.explanation),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
