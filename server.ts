import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const isProd = process.env.NODE_ENV === 'production';
const PORT = isProd ? Number(process.env.PORT) || 3000 : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

let cachedAi: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!cachedAi) {
    cachedAi = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return cachedAi;
}

const MODEL_FALLBACK_CHAIN = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateWithFallback(
  contents: any,
  config: Record<string, any> = {},
  preferFastThinking = true
) {
  const ai = getAiClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_CHAIN) {
    const attemptConfig = { ...config };
    if (preferFastThinking && !attemptConfig.thinkingConfig) {
      if (model === 'gemini-4-hydrogen') {
        attemptConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (model === 'gemini-3.1-flash-lite') {
        attemptConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }
    }

    for (let retry = 0; retry < 3; retry++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: attemptConfig,
        });
        if (response && response.text && response.text.trim()) {
          return response;
        }
        lastError = new Error(`Model ${model} returned empty text`);
        break;
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        console.warn(`Gemini call failed with ${model} (attempt ${retry + 1}):`, msg.slice(0, 200));

        // Retry without thinkingConfig if a specific model doesn't support it
        if (msg.includes('thinking') && attemptConfig.thinkingConfig) {
          delete attemptConfig.thinkingConfig;
          continue;
        }

        const isTransient = /429|503|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|timeout|ECONNRESET/i.test(msg);
        if (isTransient && retry < 2) {
          await sleep(500 * Math.pow(2, retry));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini models failed to respond');
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// Helper: Keep full book context up to maxChars; for ultra-long books, sample 10 evenly-spaced slices from 0% to 100%
function prepareTextContext(text: string, maxChars = 300000): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;

  const sliceCount = 10;
  const sliceLength = Math.floor(maxChars / sliceCount);
  const slices: string[] = [];
  const span = text.length - sliceLength;

  for (let i = 0; i < sliceCount; i++) {
    const pos = Math.floor((span * i) / (sliceCount - 1));
    const pct = Math.round((i / (sliceCount - 1)) * 100);
    slices.push(`[Book Section ~${pct}%]\n${text.slice(pos, pos + sliceLength)}`);
  }

  return slices.join('\n\n[...]\n\n');
}

// Endpoint 1: Analyze book / excerpt
app.post('/api/gemini/analyze-book', async (req: Request, res: Response) => {
  try {
    const { title, author, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Book content is required' });
    }

    const context = prepareTextContext(content, 250000);

    const prompt = `Analyze the ENTIRE provided book text for "${title || 'Untitled'}" by "${author || 'Unknown'}" (cover opening, middle development, and ending—not just Chapter 1).
Extract:
1. A comprehensive overview summary (2-3 paragraphs covering the full arc of the book).
2. Key themes and motifs explored across the whole work.
3. Main characters and brief role/psychological dynamic across the book.
4. Suggested reading levels and discussion topics.
5. Key memorable quotes or pivotal scenes from varied parts of the book.

Book text:
${context}`;

    const response = await generateWithFallback(
      prompt,
      {
        systemInstruction: 'You are an expert literary scholar and curriculum designer. Return structured, insightful literary analysis in JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            themes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            characters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ['name', 'role', 'description'],
              },
            },
            keyQuotes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  context: { type: Type.STRING },
                  significance: { type: Type.STRING },
                },
                required: ['quote', 'context', 'significance'],
              },
            },
            suggestedAudiences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['summary', 'themes', 'characters', 'keyQuotes', 'suggestedAudiences'],
        },
      }
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing book:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze book' });
  }
});

// Endpoint 2: Generate Questionnaire
app.post('/api/gemini/generate-questionnaire', async (req: Request, res: Response) => {
  try {
    const {
      title,
      author,
      bookContent,
      targetAudience, // 'grade_4'..'grade_10', 'middle_school', 'high_school', 'college', 'book_club', 'exam', 'general'
      difficulty, // 'easy' | 'medium' | 'hard' | 'scholarly'
      questionCount = 10,
      questionTypes, // e.g. ['multiple_choice', 'true_false', 'short_answer', 'quote_identification', 'essay']
      cognitiveDimensions, // e.g. ['logical', 'rational', 'critical', 'innovative']
      focusAreas, // e.g. ['plot', 'themes', 'symbolism', 'characters', 'vocabulary', 'historical_context']
      chapterTitle,
      customInstructions,
    } = req.body;

    if (!bookContent) {
      return res.status(400).json({ error: 'Book content is required to generate questions' });
    }

    const context = prepareTextContext(bookContent, 300000);
    const activeDimensions =
      cognitiveDimensions && cognitiveDimensions.length > 0
        ? cognitiveDimensions.join(', ')
        : 'logical, rational, critical, innovative';

    const prompt = `Create an intellectually rigorous, source-grounded educational questionnaire for:
Book: "${title || 'Untitled'}" by "${author || 'Unknown'}"
${chapterTitle ? `Specific Chapter / Topic: "${chapterTitle}"` : 'Scope: FULL BOOK (all provided chapters and topics from start to finish)'}

Parameters:
- Target Academic Level: ${targetAudience || 'grade_8'} (Calibrate vocabulary, sentence complexity, and analytical scaffolding precisely for this grade or audience—especially Grades 4–10 learners where specified)
- Difficulty Level: ${difficulty || 'medium'}
- Total Questions Needed: ${questionCount}
- Allowed Question Types: ${(questionTypes && questionTypes.length > 0) ? questionTypes.join(', ') : 'multiple_choice, true_false, short_answer, quote_identification'}
- Cognitive Reasoning Dimensions: ${activeDimensions}
- Focus Areas: ${(focusAreas && focusAreas.length > 0) ? focusAreas.join(', ') : 'logical reasoning, thematic depth, cause-and-effect analysis, innovative synthesis'}
${customInstructions ? `- Special Educator / Learner Instructions: ${customInstructions}` : ''}

Design Philosophy & Guidelines:
1. Prioritize understanding, questioning, reasoning, and creative problem-solving over rote trivia. Questions MUST tie directly back to specific arguments, events, characters, concepts, or dialogues in the provided text.
${!chapterTitle ? '1b. CRITICAL COVERAGE RULE: Distribute questions evenly across ALL chapters and sections of the ENTIRE book (opening, middle, climax/core arguments, and conclusion). Do NOT concentrate questions only on Chapter 1.' : '' }
2. Balance across the requested Cognitive Reasoning Dimensions and tag each question's "cognitiveDimension" as one of:
   - "logical": deductive sequence, cause-and-effect, structural inference from premises in the text
   - "rational": evidence-backed justification, clarifying principles, grounded comprehension
   - "critical": evaluating motives, contradictions, authorial intent, bias, or contrasting perspectives
   - "innovative": counterfactual reasoning, original synthesis, applying principles to novel scenarios
3. For "multiple_choice" questions:
   - Provide exactly 4 distinct, plausible options in the "options" array.
   - "correctAnswer" MUST be the 0-based integer index ("0", "1", "2", or "3") of the correct choice.
   - Distractors should test genuine reasoning rather than obvious throwaways.
4. For "true_false" questions:
   - "options" should be ["True", "False"].
   - "correctAnswer" should be "0" (True) or "1" (False).
5. For "short_answer" and "essay" questions:
   - "options" can be an empty array.
   - "correctAnswer" should be a clear model answer with reasoning rubric points.
6. For "quote_identification":
   - "prompt" should include an exact or near-exact passage from the source text and ask about its speaker, reasoning, or significance.
   - Provide 4 options, with "correctAnswer" as the 0-based index.
7. Provide a thorough "explanation" showing the step-by-step rationale grounded in the source text.
8. Assign a realistic Bloom's Taxonomy level: "remember", "understand", "apply", "analyze", "evaluate", or "create".
9. Include bookCitation with "chapter" and "quoteSnippet" where applicable.

Source Book Text:
${context}`;

    const response = await generateWithFallback(
      prompt,
      {
        systemInstruction: `You are an expert curriculum architect and Socratic assessment designer. Create source-grounded, fair, thought-provoking examinations calibrated to the target grade level (Grades 4–10 and beyond) that cultivate logical, rational, critical, and innovative thinking. Always adhere strictly to the JSON schema.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    description: 'One of: multiple_choice, true_false, short_answer, essay, quote_identification',
                  },
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: {
                    type: Type.STRING,
                    description: 'Either string index "0","1","2","3" for choices, or full sample answer for short_answer/essay',
                  },
                  explanation: { type: Type.STRING },
                  bloomsLevel: {
                    type: Type.STRING,
                    description: 'remember, understand, apply, analyze, evaluate, create',
                  },
                  cognitiveDimension: {
                    type: Type.STRING,
                    description: 'logical, rational, critical, innovative',
                  },
                  points: { type: Type.NUMBER },
                  bookCitation: {
                    type: Type.OBJECT,
                    properties: {
                      chapter: { type: Type.STRING },
                      quoteSnippet: { type: Type.STRING },
                    },
                  },
                },
                required: ['id', 'type', 'prompt', 'options', 'correctAnswer', 'explanation', 'bloomsLevel', 'cognitiveDimension', 'points'],
              },
            },
          },
          required: ['title', 'description', 'questions'],
        },
      }
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating questionnaire:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate questionnaire' });
  }
});

// Endpoint 3: Evaluate open-ended student answer
app.post('/api/gemini/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { questionPrompt, studentAnswer, modelAnswer, explanation, bookContext } = req.body;

    if (!questionPrompt || !studentAnswer) {
      return res.status(400).json({ error: 'Question prompt and student answer are required' });
    }

    const context = prepareTextContext(bookContext || '', 12000);

    const prompt = `Evaluate a student's answer to a literary question:

Question: "${questionPrompt}"
Model Answer / Key Points: "${modelAnswer || 'Refer to text'}"
Teacher Explanation: "${explanation || ''}"
Student Answer: "${studentAnswer}"

${context ? `Relevant Book Context:\n${context}` : ''}

Assess the student's answer objectively:
1. Score out of 5 (5 = Excellent, 4 = Good, 3 = Adequate, 2 = Partial, 1 = Minimal, 0 = Inaccurate/Irrelevant).
2. Is it considered correct/passing (score >= 3)?
3. Constructive feedback highlighting what they got right, what was missed, and how to deepen their textual analysis.
4. An improved revision suggestion for the student.`;

    const response = await generateWithFallback(
      prompt,
      {
        systemInstruction: 'You are an empathetic, insightful literature instructor grading a student response. Provide balanced, encouraging feedback with clear rubric scores.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'Score between 0 and 5' },
            isPassing: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING },
            strengths: { type: Type.STRING },
            missingElements: { type: Type.STRING },
            exemplarTip: { type: Type.STRING },
          },
          required: ['score', 'isPassing', 'feedback', 'strengths', 'missingElements', 'exemplarTip'],
        },
      }
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error evaluating answer:', error);
    return res.status(500).json({ error: error.message || 'Failed to evaluate answer' });
  }
});

// Endpoint 4: Generate a single additional question (AI Assistant for the editor)
app.post('/api/gemini/add-single-question', async (req: Request, res: Response) => {
  try {
    const { title, author, bookContent, questionType, bloomsLevel, cognitiveDimension, targetAudience, userGoal } = req.body;
    const context = prepareTextContext(bookContent || '', 120000);

    const prompt = `Generate one new distinct high-quality question for "${title}" by "${author}".
Type: ${questionType || 'multiple_choice'}
Target Level: ${targetAudience || 'grade_8'}
Bloom's Level: ${bloomsLevel || 'analyze'}
Cognitive Dimension: ${cognitiveDimension || 'critical'} (one of: logical, rational, critical, innovative)
Specific Goal: ${userGoal || 'Test key thematic reasoning and causal relationships'}

Book Context:
${context}`;

    const response = await generateWithFallback(
      prompt,
      {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            type: { type: Type.STRING },
            prompt: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING },
            bloomsLevel: { type: Type.STRING },
            cognitiveDimension: { type: Type.STRING },
            points: { type: Type.NUMBER },
            bookCitation: {
              type: Type.OBJECT,
              properties: {
                chapter: { type: Type.STRING },
                quoteSnippet: { type: Type.STRING },
              },
            },
          },
          required: ['id', 'type', 'prompt', 'options', 'correctAnswer', 'explanation', 'bloomsLevel', 'cognitiveDimension', 'points'],
        },
      }
    );

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating single question:', error);
    return res.status(500).json({ error: error.message || 'Failed to add question' });
  }
});

// Helper: Purge website watermarks and download banners from book text
function cleanWatermarkLines(text: string): string {
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

// Helper: Check if extracted text is only a website watermark or too sparse for a real book
function isWatermarkOrInadequateText(text: string, pageCount: number): boolean {
  if (!text || !text.trim()) return true;
  const cleaned = cleanWatermarkLines(text)
    .replace(/^---\s*Page\s+\d+\s*---$/gim, '')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length < 40) return true;
  if (pageCount > 1 && words.length / pageCount < 18) {
    return true;
  }

  return false;
}

// Endpoint 5A: Batched Page Image Vision OCR (fast, plain-text, immune to large PDF limits)
app.post('/api/gemini/ocr-pages', async (req: Request, res: Response) => {
  try {
    const { pages, filename } = req.body as {
      pages: Array<{ pageNumber: number; imageBase64: string }>;
      filename?: string;
    };

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({ error: 'At least one page image is required' });
    }

    const parts: any[] = [];
    for (const p of pages) {
      const cleanB64 = (p.imageBase64 || '').replace(/^data:image\/\w+;base64,/, '');
      if (!cleanB64) continue;
      parts.push({ text: `[IMAGE FOR PAGE ${p.pageNumber}]` });
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanB64,
        },
      });
    }

    const pageList = pages.map((p) => p.pageNumber).join(', ');
    parts.push({
      text: `Transcribe ALL printed book text from these scanned page images (Pages: ${pageList} of "${filename || 'book.pdf'}").

RULES:
1. Transcribe verbatim every paragraph, heading, and dialogue printed on the page images in reading order.
2. Prefix each page with "--- Page X ---" (using its page number).
3. Completely IGNORE and OMIT any website watermarks, URLs, download stamps (e.g. oceanofpdf, pdfdrive, www.*, http://...), or bare page-number margins.
4. Do NOT summarize, do NOT explain, and do NOT wrap output in JSON or markdown code fences. Output ONLY the clean transcribed book text.
5. If a page is purely a decorative cover or blank page with no prose, output only "--- Page X ---" and any title text visible.`,
    });

    const response = await generateWithFallback(
      { parts },
      {
        systemInstruction:
          'You are a high-precision OCR book transcriber. Return verbatim printed text from page images without commentary, JSON wrapping, or website watermarks.',
      },
      true
    );

    const rawText = response.text || '';
    const cleaned = cleanWatermarkLines(rawText);

    return res.json({
      text: cleaned,
      pagesProcessed: pages.map((p) => p.pageNumber),
    });
  } catch (error: any) {
    console.error('Error in batched page OCR:', error);
    return res.status(500).json({ error: error.message || 'Vision OCR failed on page batch' });
  }
});

// Endpoint 5B: Extract Book from PDF using PDF engine + Watermark Filter + Gemini Vision OCR fallback
app.post('/api/gemini/extract-pdf', async (req: Request, res: Response) => {
  try {
    const { pdfBase64, filename, forceOcr } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ error: 'PDF data is required' });
    }

    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const uint8Array = new Uint8Array(pdfBuffer);

    let extractedText = '';
    let pageCount = 0;
    let metadataTitle = '';
    let metadataAuthor = '';

    if (!forceOcr) {
      try {
        // @ts-ignore
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          useSystemFonts: true,
          disableFontFace: true,
        });

        const doc = await loadingTask.promise;
        pageCount = doc.numPages;

        try {
          const meta = await doc.getMetadata();
          if (meta?.info) {
            const info = meta.info as any;
            if (info.Title && typeof info.Title === 'string' && info.Title.trim() && !info.Title.includes('Untitled')) {
              metadataTitle = info.Title.trim();
            }
            if (info.Author && typeof info.Author === 'string' && info.Author.trim()) {
              metadataAuthor = info.Author.trim();
            }
          }
        } catch (mErr) {
          console.warn('Metadata read error:', mErr);
        }

        const rawPages: string[] = [];
        const lineFrequency = new Map<string, number>();

        for (let i = 1; i <= pageCount; i++) {
          try {
            const page = await doc.getPage(i);
            const textContent = await page.getTextContent();
            const lines: string[] = [];
            let currentLine = '';
            let lastY: number | null = null;
            for (const item of textContent.items as any[]) {
              if (!('str' in item)) continue;
              const str: string = item.str;
              const y: number | null = Array.isArray(item.transform) ? item.transform[5] : null;
              if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
                if (currentLine.trim()) lines.push(currentLine.trim());
                currentLine = str;
              } else {
                currentLine += currentLine && str && !currentLine.endsWith(' ') && !str.startsWith(' ') ? ' ' + str : str;
              }
              if (item.hasEOL) {
                if (currentLine.trim()) lines.push(currentLine.trim());
                currentLine = '';
                lastY = null;
              } else if (y !== null) {
                lastY = y;
              }
            }
            if (currentLine.trim()) lines.push(currentLine.trim());
            const pageText = lines.join('\n');
            rawPages.push(pageText);

            const uniqueShort = new Set(lines.filter((l) => l.length > 2 && l.length <= 90));
            uniqueShort.forEach((l) => lineFrequency.set(l, (lineFrequency.get(l) || 0) + 1));
          } catch (pageErr) {
            console.warn(`Could not read page ${i}:`, pageErr);
            rawPages.push('');
          }
        }

        const repeatingLines = new Set<string>();
        if (pageCount >= 3) {
          const threshold = Math.max(2, Math.ceil(pageCount * 0.35));
          lineFrequency.forEach((cnt, line) => {
            if (cnt >= threshold && !/^(chapter|part|book|section)\b/i.test(line)) {
              repeatingLines.add(line);
            }
          });
        }

        const textParts: string[] = [];
        for (let i = 0; i < rawPages.length; i++) {
          const filtered = rawPages[i]
            .split('\n')
            .filter((l) => !repeatingLines.has(l.trim()))
            .join('\n');
          const pt = cleanWatermarkLines(filtered).trim();
          if (pt) {
            textParts.push(`--- Page ${i + 1} ---\n${pt}`);
          }
        }

        extractedText = cleanWatermarkLines(textParts.join('\n\n')).trim();
      } catch (pdfErr) {
        console.warn('Node PDF digital text parse error:', pdfErr);
      }
    }

    const cleanFileName = (filename || 'Custom Book')
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase());

    const needsVisionOcr = forceOcr || isWatermarkOrInadequateText(extractedText, pageCount);

    if (!needsVisionOcr && extractedText.length > 50) {
      let finalTitle = metadataTitle || cleanFileName;
      let finalAuthor = metadataAuthor || 'Unknown Author';
      let summary = `Imported digital volume with ${pageCount} pages.`;
      let themes: string[] = ['Literature', 'Reading Assessment'];

      try {
        const previewExcerpt = extractedText.slice(0, 8000);
        const aiMetaPrompt = `Identify the exact book title, author, a 2-paragraph synopsis, and 3-5 themes from this book excerpt (filename: "${filename}"):
${previewExcerpt}`;

        const aiPromise = generateWithFallback(
          aiMetaPrompt,
          {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                author: { type: Type.STRING },
                summary: { type: Type.STRING },
                themes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['title', 'author', 'summary', 'themes'],
            },
          },
          true
        );

        const timeoutGuard = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
        const aiResponse: any = await Promise.race([aiPromise, timeoutGuard]);

        if (aiResponse && aiResponse.text) {
          const metaResult = JSON.parse(aiResponse.text || '{}');
          if (metaResult.title && metaResult.title.trim()) finalTitle = metaResult.title.trim();
          if (metaResult.author && metaResult.author.trim()) finalAuthor = metaResult.author.trim();
          if (metaResult.summary) summary = metaResult.summary;
          if (metaResult.themes && metaResult.themes.length > 0) themes = metaResult.themes;
        }
      } catch (geminiMetaErr) {
        console.warn('Gemini metadata deduction warning:', geminiMetaErr);
      }

      return res.json({
        text: extractedText,
        title: finalTitle,
        author: finalAuthor,
        summary,
        themes,
        pageCount,
        extractionMethod: 'digital_text',
      });
    }

    // Fallback plain-text PDF OCR (for when browser pdfjs couldn't open the file)
    if (pdfBuffer.byteLength > 18 * 1024 * 1024) {
      return res.status(413).json({
        error: 'PDF exceeds 18MB for raw server fallback. Please use page-by-page Vision OCR in the browser.',
      });
    }

    const pdfPart = {
      inlineData: {
        mimeType: 'application/pdf',
        data: base64Data,
      },
    };

    const totalFallbackPages = pageCount || 0;
    const ocrChunks: string[] = [];

    if (totalFallbackPages > 15) {
      const rangeSize = 15;
      for (let start = 1; start <= totalFallbackPages; start += rangeSize) {
        const end = Math.min(totalFallbackPages, start + rangeSize - 1);
        const rangePrompt = `Transcribe ALL readable book prose, headings, and dialogue strictly from PDF pages ${start} to ${end} (out of ${totalFallbackPages} pages) of "${filename}".
CRITICAL RULES:
1. Prefix each page with "--- Page X ---".
2. Transcribe EVERY page from ${start} through ${end} completely without summarizing or skipping.
3. Ignore and omit ALL website watermarks, URLs, download stamps, and distribution banners.
4. Output ONLY the clean transcribed book text (plain text, no JSON, no commentary).`;
        const rangeRes = await generateWithFallback(
          { parts: [pdfPart, { text: rangePrompt }] },
          {
            systemInstruction:
              'You are an expert OCR book transcriber. Transcribe actual literary prose and chapters from the requested page range verbatim, strictly ignoring website watermark stamps.',
          },
          true
        );
        const chunkText = cleanWatermarkLines(rangeRes.text || '').trim();
        if (chunkText) ocrChunks.push(chunkText);
      }
    } else {
      const ocrPrompt = `Transcribe ALL readable book prose, headings, and dialogue from EVERY page of the attached PDF ("${filename}").
CRITICAL RULES:
1. Prefix each page with "--- Page X ---".
2. Ignore and omit ALL website watermarks, URLs, download stamps, and distribution banners.
3. Output ONLY the clean transcribed book text (plain text, no JSON, no commentary).`;

      const ocrResponse = await generateWithFallback(
        { parts: [pdfPart, { text: ocrPrompt }] },
        {
          systemInstruction:
            'You are an expert OCR book transcriber. Transcribe actual literary prose and chapters from document pages verbatim, strictly ignoring website watermark stamps.',
        },
        true
      );
      const chunkText = cleanWatermarkLines(ocrResponse.text || '').trim();
      if (chunkText) ocrChunks.push(chunkText);
    }

    const finalOcrText = cleanWatermarkLines(ocrChunks.join('\n\n')).trim();

    return res.json({
      text: finalOcrText || extractedText,
      title: metadataTitle || cleanFileName,
      author: metadataAuthor || 'Unknown Author',
      summary: 'Scanned book transcribed via Gemini AI Vision OCR.',
      themes: ['Literature', 'Analysis'],
      pageCount: pageCount || 1,
      extractionMethod: 'gemini_vision_ocr',
    });
  } catch (error: any) {
    console.error('Error in PDF extraction endpoint:', error);
    return res.status(500).json({ error: error.message || 'Failed to extract text from PDF' });
  }
});

// Serve PDF.js worker raw without Vite HMR injection (Web Workers crash if /@vite/client is injected)
app.get('/pdf.worker.min.mjs', (_req: Request, res: Response) => {
  res.type('application/javascript; charset=utf-8');
  res.sendFile(path.resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'));
});

// Vite middleware & Static Serving
async function startServer() {
  const httpServer = http.createServer(app);

  if (!isProd) {
    const hmrConfig = process.env.DISABLE_HMR === 'true' ? false : { server: httpServer };
    const vitePromise = import('vite')
      .then(({ createServer: createViteServer }) =>
        createViteServer({
          server: { middlewareMode: true, hmr: hmrConfig },
          appType: 'spa',
        })
      )
      .catch((err) => {
        console.error('Failed to initialize Vite dev middleware:', err);
        throw err;
      });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        return vite.middlewares(req, res, next);
      } catch (err) {
        return next(err);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.on('error', (err) => {
    console.error('ZENOXIS server error:', err);
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`ZENOXIS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
