import { BloomsLevel, Chapter, CognitiveDimension, Question, Questionnaire, TargetAudience } from '../types';

export function calculateWordCount(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTime(words: number): number {
  return Math.max(1, Math.round(words / 220));
}

export function formatAudienceLabel(audience: TargetAudience | string): string {
  const map: Record<string, string> = {
    grade_4: 'Grade 4',
    grade_5: 'Grade 5',
    grade_6: 'Grade 6',
    grade_7: 'Grade 7',
    grade_8: 'Grade 8',
    grade_9: 'Grade 9',
    grade_10: 'Grade 10',
    middle_school: 'Middle School (Grades 6–8)',
    high_school: 'High School (Grades 9–10)',
    college: 'Advanced / Seminar',
    book_club: 'Reading Circle',
    exam: 'Formal Examination',
    general: 'General Inquiry',
  };
  return map[audience] || audience.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function inferCognitiveDimension(question: Pick<Question, 'cognitiveDimension' | 'bloomsLevel'>): CognitiveDimension {
  if (question.cognitiveDimension) return question.cognitiveDimension;
  const map: Record<BloomsLevel, CognitiveDimension> = {
    remember: 'rational',
    understand: 'rational',
    apply: 'logical',
    analyze: 'critical',
    evaluate: 'critical',
    create: 'innovative',
  };
  return map[question.bloomsLevel] || 'critical';
}

export function formatDimensionLabel(dim: CognitiveDimension): string {
  const labels: Record<CognitiveDimension, string> = {
    logical: 'Logical Reasoning',
    rational: 'Rational Comprehension',
    critical: 'Critical Analysis',
    innovative: 'Innovative Synthesis',
  };
  return labels[dim] || dim;
}

export function parseChaptersFromText(rawText: string): Chapter[] {
  if (!rawText || !rawText.trim()) return [];

  const numWord =
    '(?:[0-9]+|[IVXLCDM]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty)';
  const chapterRegex = new RegExp(
    `(?:^|\\n)[ \\t]*(?:(?:CHAPTER|Chapter|ACT|Act|PART|Part|BOOK|Book|SECTION|Section|TOPIC|Topic|UNIT|Unit)[ \\t]+${numWord}(?:[ \\t]*[:.\\-–—][ \\t]*[^\\n]{1,80}|[ \\t]+[^\\n.!?]{1,65})?|(?:CHAPTER|Chapter|PART|Part)[ \\t]*\\n[ \\t]*${numWord}\\b|(?:PROLOGUE|Prologue|EPILOGUE|Epilogue|INTRODUCTION|Introduction|PREFACE|Preface)(?:[ \\t]*[:.\\-–—][ \\t]*[^\\n]{1,80})?|#{1,3}[ \\t]+[^\\n]+)[ \\t]*(?=\\n|$)`,
    'gi'
  );

  const rawMatches: { title: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = chapterRegex.exec(rawText)) !== null) {
    const startIdx = match[0].startsWith('\n') ? match.index + 1 : match.index;
    rawMatches.push({
      title: match[0].trim().replace(/\s+/g, ' ').replace(/^#+\s*/, ''),
      index: startIdx,
    });
  }

  const matches = rawMatches.filter((m, idx) => {
    if (idx === rawMatches.length - 1) {
      const tailWords = calculateWordCount(rawText.slice(m.index));
      return tailWords >= 40;
    }
    const span = rawText.slice(m.index, rawMatches[idx + 1].index);
    return calculateWordCount(span) >= 50;
  });

  if (matches.length < 2) {
    const totalWords = calculateWordCount(rawText);
    if (totalWords > 3000) {
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
          const content = currentChunk.join('\n\n').trim();
          if (content) {
            chapters.push({
              id: `part-${partNumber}`,
              title: `Part ${partNumber}`,
              content,
              wordCount: calculateWordCount(content),
              order: partNumber,
            });
            partNumber++;
          }
          currentChunk = [];
          currentWords = 0;
        }
      }

      if (currentChunk.length > 0) {
        const content = currentChunk.join('\n\n').trim();
        if (content) {
          chapters.push({
            id: `part-${partNumber}`,
            title: `Part ${partNumber}`,
            content,
            wordCount: calculateWordCount(content),
            order: partNumber,
          });
        }
      }

      return chapters;
    }

    return [
      {
        id: 'full-text',
        title: matches[0]?.title || 'Full Book Text',
        content: rawText.trim(),
        wordCount: calculateWordCount(rawText),
        order: 1,
      },
    ];
  }

  const chapters: Chapter[] = [];
  let orderCounter = 1;

  if (matches[0].index > 0) {
    const preContent = rawText.slice(0, matches[0].index).trim();
    const preWords = calculateWordCount(preContent);
    if (preWords >= 30) {
      chapters.push({
        id: 'front-matter',
        title: 'Front Matter & Opening',
        content: preContent,
        wordCount: preWords,
        order: orderCounter++,
      });
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
    const content = rawText.slice(current.index, nextIndex).trim();

    if (content) {
      chapters.push({
        id: `ch-${orderCounter}`,
        title: current.title,
        content,
        wordCount: calculateWordCount(content),
        order: orderCounter++,
      });
    }
  }

  return chapters;
}

export function formatQuestionnaireToMarkdown(quest: Questionnaire, includeAnswers = true): string {
  let md = `# ${quest.title}\n\n`;
  md += `**Source Text:** ${quest.bookTitle} by ${quest.bookAuthor}\n`;
  md += `**Level:** ${formatAudienceLabel(quest.targetAudience)} | **Difficulty:** ${quest.difficulty.toUpperCase()} | **Total Questions:** ${quest.questions.length}\n\n`;
  md += `*${quest.description}*\n\n---\n\n`;

  quest.questions.forEach((q, idx) => {
    const dim = inferCognitiveDimension(q);
    md += `### Question ${idx + 1} (${q.points} pts) [${dim.toUpperCase()} · ${q.bloomsLevel.toUpperCase()}]\n`;
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

      md += `**Answer Key:** ${correctDisplay}\n\n`;
      md += `**Rationale & Reasoning:** ${q.explanation}\n`;
      if (q.bookCitation?.quoteSnippet) {
        md += `> "${q.bookCitation.quoteSnippet}" ${q.bookCitation.chapter ? `(${q.bookCitation.chapter})` : ''}\n`;
      }
      md += '\n---\n\n';
    } else {
      md += `\n*Response: _________________________________________________*\n\n---\n\n`;
    }
  });

  return md;
}

export function exportQuestionnaireToCsv(quest: Questionnaire): string {
  const headers = [
    'Number',
    'Type',
    'Cognitive Dimension',
    'Bloom Taxonomy',
    'Question Prompt',
    'Option A',
    'Option B',
    'Option C',
    'Option D',
    'Correct Answer',
    'Points',
    'Explanation',
  ];
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
      clean(inferCognitiveDimension(q)),
      clean(q.bloomsLevel),
      clean(q.prompt),
      clean(optA),
      clean(optB),
      clean(optC),
      clean(optD),
      clean(answerText),
      q.points,
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

export function cleanWatermarksFromText(text: string): string {
  if (!text) return '';
  const watermarkDomains =
    /(oceanofpdf|pdfdrive|z-lib(?:rary)?|libgen|annas-archive|pdfcoffee|dokumen\.pub|ebook-hunter|manybooks|free-ebooks|b-ok|1lib|epubor|pdfroom|pdfbooksworld|planetebook|holybooks)/i;
  const standaloneUrlOrDomain =
    /^(?:https?:\/\/|www\.)\S+$|^[a-z0-9-]+(?:\.[a-z0-9-]+)+\.(?:com|org|net|io|rs|is|to|me|info|pub|club|xyz|cc)(?:\/\S*)?$/i;
  const watermarkPhrase =
    /^(?:downloaded|uploaded|scanned|converted|shared|brought to you|visit|read more|get more|free ebooks?|courtesy|source)\s+(?:from|by|to|at|of)\b/i;

  return text
    .split('\n')
    .map((line) => {
      let cleaned = line.trim();
      if (!cleaned) return '';
      cleaned = cleaned
        .replace(/(?:https?:\/\/|www\.)\S+/gi, '')
        .replace(/\b[a-z0-9.-]*(?:oceanofpdf|pdfdrive|z-library|annas-archive|pdfcoffee|dokumen\.pub)\S*/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      return cleaned;
    })
    .filter((line) => {
      if (!line) return true;
      if (standaloneUrlOrDomain.test(line)) return false;
      if (watermarkPhrase.test(line)) return false;
      if (watermarkDomains.test(line) && line.split(/\s+/).length <= 8) return false;
      if (/^(?:t\.me\/|telegram:|@\w+\s*$)/i.test(line)) return false;
      return true;
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
