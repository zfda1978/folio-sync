import { BookAnalysis, DifficultyLevel, Question, Questionnaire, QuestionType, TargetAudience } from '../types';

export interface GenerateQuestionnairePayload {
  title: string;
  author: string;
  bookContent: string;
  targetAudience: TargetAudience;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  focusAreas?: string[];
  chapterTitle?: string;
  customInstructions?: string;
}

export async function apiAnalyzeBook(
  title: string,
  author: string,
  content: string
): Promise<BookAnalysis> {
  const response = await fetch('/api/gemini/analyze-book', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, author, content }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Analysis failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiGenerateQuestionnaire(
  payload: GenerateQuestionnairePayload
): Promise<Questionnaire> {
  const response = await fetch('/api/gemini/generate-questionnaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Generation failed with status ${response.status}`);
  }

  const data = await response.json();
  const id = 'quest-' + Date.now();

  return {
    id,
    bookId: '',
    bookTitle: payload.title,
    bookAuthor: payload.author,
    title: data.title || `Questionnaire: ${payload.title}`,
    description: data.description || 'Literary assessment questionnaire generated with AI.',
    targetAudience: payload.targetAudience,
    difficulty: payload.difficulty,
    chapterScope: payload.chapterTitle ? [payload.chapterTitle] : ['all'],
    questionTypes: payload.questionTypes,
    questions: (data.questions || []).map((q: any, i: number) => ({
      id: q.id || `q-${Date.now()}-${i}`,
      type: q.type || 'multiple_choice',
      prompt: q.prompt || '',
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? '0',
      explanation: q.explanation || '',
      bloomsLevel: q.bloomsLevel || 'analyze',
      points: Number(q.points) || 5,
      bookCitation: q.bookCitation,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function apiEvaluateAnswer(params: {
  questionPrompt: string;
  studentAnswer: string;
  modelAnswer?: string | number;
  explanation?: string;
  bookContext?: string;
}) {
  const response = await fetch('/api/gemini/evaluate-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Evaluation failed with status ${response.status}`);
  }

  return response.json();
}

export async function apiAddSingleQuestion(params: {
  title: string;
  author: string;
  bookContent: string;
  questionType: QuestionType;
  bloomsLevel: string;
  userGoal?: string;
}): Promise<Question> {
  const response = await fetch('/api/gemini/add-single-question', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Add question failed with status ${response.status}`);
  }

  const q = await response.json();
  return {
    id: q.id || `q-${Date.now()}`,
    type: q.type || 'multiple_choice',
    prompt: q.prompt,
    options: q.options || [],
    correctAnswer: q.correctAnswer ?? '0',
    explanation: q.explanation || '',
    bloomsLevel: q.bloomsLevel || 'analyze',
    points: Number(q.points) || 5,
    bookCitation: q.bookCitation,
  };
}
