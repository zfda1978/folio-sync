import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: Trim large texts to prevent overflow while keeping high relevance
function prepareTextContext(text: string, maxChars = 45000): string {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  // If too long, sample beginning, middle, and end with markers
  const partLength = Math.floor(maxChars / 3);
  const start = text.slice(0, partLength);
  const midStart = Math.floor(text.length / 2) - Math.floor(partLength / 2);
  const mid = text.slice(midStart, midStart + partLength);
  const end = text.slice(-partLength);
  return `${start}\n\n[... Excerpt omitted for length ...]\n\n${mid}\n\n[... Excerpt omitted for length ...]\n\n${end}`;
}

// Endpoint 1: Analyze book / excerpt
app.post('/api/gemini/analyze-book', async (req: Request, res: Response) => {
  try {
    const { title, author, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Book content is required' });
    }

    const context = prepareTextContext(content, 35000);

    const prompt = `Analyze the following book text/excerpt for the title "${title || 'Untitled'}" by "${author || 'Unknown'}".
Extract:
1. A concise overview summary (2-3 paragraphs).
2. Key themes and motifs explored.
3. Main characters and brief role/psychological dynamic.
4. Suggested reading levels and discussion topics.
5. Key memorable quotes or pivotal scenes.

Text snippet:
${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
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
      },
    });

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
      targetAudience, // 'middle_school' | 'high_school' | 'college' | 'book_club' | 'exam' | 'general'
      difficulty, // 'easy' | 'medium' | 'hard' | 'scholarly'
      questionCount = 10,
      questionTypes, // e.g. ['multiple_choice', 'true_false', 'short_answer', 'quote_identification', 'essay']
      focusAreas, // e.g. ['plot', 'themes', 'symbolism', 'characters', 'vocabulary', 'historical_context']
      chapterTitle,
      customInstructions,
    } = req.body;

    if (!bookContent) {
      return res.status(400).json({ error: 'Book content is required to generate questions' });
    }

    const context = prepareTextContext(bookContent, 38000);

    const prompt = `Create a high-quality literary questionnaire for:
Book: "${title || 'Untitled'}" by "${author || 'Unknown'}"
${chapterTitle ? `Specific Section / Chapter: "${chapterTitle}"` : 'Scope: Provided book text'}

Parameters:
- Target Audience: ${targetAudience || 'general reader'}
- Difficulty Level: ${difficulty || 'medium'}
- Total Questions Needed: ${questionCount}
- Allowed Question Types: ${(questionTypes && questionTypes.length > 0) ? questionTypes.join(', ') : 'multiple_choice, true_false, short_answer, quote_identification'}
- Focus Areas: ${(focusAreas && focusAreas.length > 0) ? focusAreas.join(', ') : 'themes, character actions, symbolism, reading comprehension'}
${customInstructions ? `- Special User Instructions: ${customInstructions}` : ''}

Guidelines:
1. Questions MUST directly tie back to specific plot details, characters, dialogues, symbols, or themes present in the provided text.
2. For "multiple_choice" questions:
   - Provide exactly 4 distinct, plausible options in the "options" array.
   - "correctAnswer" MUST be the 0-based integer index (0, 1, 2, or 3) of the correct choice.
   - Distractors should be thoughtful and test genuine comprehension, not obvious nonsense.
3. For "true_false" questions:
   - "options" should be ["True", "False"].
   - "correctAnswer" should be 0 (for True) or 1 (for False).
4. For "short_answer" and "essay" questions:
   - "options" can be an empty array.
   - "correctAnswer" should be a sample model answer / rubric points.
5. For "quote_identification":
   - "prompt" should include the exact or near-exact quote and ask who said it, to whom, or under what circumstances.
   - Provide 4 options, with "correctAnswer" as the 0-based index.
6. Provide a rich "explanation" citing the rationale and quoting or referencing the specific part of the book.
7. Assign a realistic Bloom's Taxonomy level: "remember", "understand", "apply", "analyze", "evaluate", or "create".
8. Include bookCitation with "chapter" and "quoteSnippet" where applicable.

Source Book Text:
${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: `You are a master literature educator and test creator. Generate intellectually stimulating, fair, rigorous questionnaires with exact answers and thorough explanations. Always adhere strictly to the JSON schema.`,
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
                  points: { type: Type.NUMBER },
                  bookCitation: {
                    type: Type.OBJECT,
                    properties: {
                      chapter: { type: Type.STRING },
                      quoteSnippet: { type: Type.STRING },
                    },
                  },
                },
                required: ['id', 'type', 'prompt', 'options', 'correctAnswer', 'explanation', 'bloomsLevel', 'points'],
              },
            },
          },
          required: ['title', 'description', 'questions'],
        },
      },
    });

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
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
      },
    });

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
    const { title, author, bookContent, questionType, bloomsLevel, userGoal } = req.body;
    const context = prepareTextContext(bookContent || '', 15000);

    const prompt = `Generate one new distinct high-quality question for "${title}" by "${author}".
Type: ${questionType || 'multiple_choice'}
Bloom's Level: ${bloomsLevel || 'analyze'}
Specific Goal: ${userGoal || 'Test key thematic understanding'}

Book Context:
${context}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
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
            points: { type: Type.NUMBER },
            bookCitation: {
              type: Type.OBJECT,
              properties: {
                chapter: { type: Type.STRING },
                quoteSnippet: { type: Type.STRING },
              },
            },
          },
          required: ['id', 'type', 'prompt', 'options', 'correctAnswer', 'explanation', 'bloomsLevel', 'points'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating single question:', error);
    return res.status(500).json({ error: error.message || 'Failed to add question' });
  }
});

// Vite middleware & Static Serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`FolioQuest server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
