export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'quote_identification';

export type BloomsLevel =
  | 'remember'
  | 'understand'
  | 'apply'
  | 'analyze'
  | 'evaluate'
  | 'create';

export type TargetAudience =
  | 'middle_school'
  | 'high_school'
  | 'college'
  | 'book_club'
  | 'exam'
  | 'general';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'scholarly';

export interface BookCitation {
  chapter?: string;
  quoteSnippet?: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  bloomsLevel: BloomsLevel;
  points: number;
  bookCitation?: BookCitation;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

export interface CharacterProfile {
  name: string;
  role: string;
  description: string;
}

export interface KeyQuote {
  quote: string;
  context: string;
  significance: string;
}

export interface BookAnalysis {
  summary: string;
  themes: string[];
  characters: CharacterProfile[];
  keyQuotes: KeyQuote[];
  suggestedAudiences: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverGradient?: string;
  totalWords: number;
  chapters: Chapter[];
  createdAt: string;
  analysis?: BookAnalysis;
}

export interface Questionnaire {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  title: string;
  description: string;
  targetAudience: TargetAudience;
  difficulty: DifficultyLevel;
  chapterScope: string[]; // ['all'] or list of chapter IDs
  questionTypes: QuestionType[];
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface AnswerEvaluation {
  score: number;
  isPassing: boolean;
  feedback: string;
  strengths: string;
  missingElements: string;
  exemplarTip: string;
}

export interface UserAnswerRecord {
  questionId: string;
  answer: string | number;
  isCorrect?: boolean;
  scoreEarned: number;
  aiEvaluation?: AnswerEvaluation;
}

export interface QuizAttempt {
  id: string;
  questionnaireId: string;
  date: string;
  score: number;
  totalPoints: number;
  percentage: number;
  timeSpentSeconds: number;
  answers: Record<string, UserAnswerRecord>;
}
