import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Layers,
  Clock,
  FileText,
  User,
  Quote,
  ChevronRight,
  ChevronDown,
  Plus,
  Play,
  Printer,
  Loader2,
} from 'lucide-react';
import { Book, Questionnaire } from '../types';
import { estimateReadingTime } from '../utils/textParser';
import { apiAnalyzeBook } from '../services/api';

interface BookOverviewProps {
  book: Book;
  questionnaires: Questionnaire[];
  onOpenGenerator: () => void;
  onSelectQuestionnaire: (q: Questionnaire) => void;
  onUpdateBook: (updatedBook: Book) => void;
  onTakeQuiz: (q: Questionnaire) => void;
}

export const BookOverview: React.FC<BookOverviewProps> = ({
  book,
  questionnaires,
  onOpenGenerator,
  onSelectQuestionnaire,
  onUpdateBook,
  onTakeQuiz,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(book.chapters[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const selectedChapter = book.chapters.find((ch) => ch.id === selectedChapterId) || book.chapters[0];
  const bookQuestionnaires = questionnaires.filter(
    (q) => q.bookId === book.id || q.bookTitle.toLowerCase() === book.title.toLowerCase()
  );

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const fullText = book.chapters.map((c) => c.content).join('\n\n');
      const analysis = await apiAnalyzeBook(book.title, book.author, fullText);
      const updated: Book = {
        ...book,
        analysis,
      };
      onUpdateBook(updated);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Book Hero Banner */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
          <div className="flex items-start gap-5">
            <div
              className={`w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-gradient-to-br ${
                book.coverGradient || 'from-amber-700 to-stone-900'
              } shadow-lg ring-1 ring-white/10 flex items-center justify-center text-white shrink-0 font-serif text-3xl font-bold`}
            >
              {book.title[0]}
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Imported Volume</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-white tracking-tight">
                {book.title}
              </h1>
              <p className="text-stone-300 font-medium text-sm sm:text-base">
                by {book.author || 'Unknown Author'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-stone-500" />
                  {book.chapters.length} Chapter{book.chapters.length !== 1 ? 's' : ''}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-stone-500" />
                  {book.totalWords.toLocaleString()} Words
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-stone-500" />
                  ~{estimateReadingTime(book.totalWords)} min reading time
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenGenerator}
              className="px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Create Questionnaire</span>
            </button>

            {!book.analysis && (
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-3 text-sm font-medium text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Analyzing Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Run AI Analysis</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {analysisError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-900/40 border border-rose-500/40 text-rose-200 text-xs">
            {analysisError}
          </div>
        )}
      </div>

      {/* Literary Analysis Section */}
      {book.analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary & Themes */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Literary Synopsis &amp; Themes
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed mt-2 font-serif">
                {book.analysis.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                Core Themes Explored
              </h4>
              <div className="flex flex-wrap gap-2">
                {book.analysis.themes?.map((theme, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/70"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {book.analysis.keyQuotes && book.analysis.keyQuotes.length > 0 && (
              <div className="pt-2 border-t border-stone-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-stone-400" />
                  Key Passages &amp; Quotes
                </h4>
                <div className="space-y-3">
                  {book.analysis.keyQuotes.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 text-xs font-serif italic text-stone-800 space-y-1"
                    >
                      <p className="text-stone-900">“{q.quote}”</p>
                      <p className="font-sans text-[11px] text-stone-500 not-italic">
                        <span className="font-semibold text-stone-700">{q.context}</span> — {q.significance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Key Characters */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
              <User className="w-4 h-4 text-stone-500" />
              Dramatis Personae &amp; Characters
            </h3>

            <div className="space-y-3">
              {book.analysis.characters?.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-stone-200 hover:border-amber-300 transition-colors bg-stone-50/50"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900">{char.name}</h4>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-stone-200/80 text-stone-700">
                      {char.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-3 leading-relaxed">
                    {char.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Questionnaires Prepared for this Book */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Prepared Questionnaires ({bookQuestionnaires.length})
            </h2>
            <p className="text-xs text-stone-500">
              Generated assessments, reading guides, and quizzes for this title
            </p>
          </div>
          <button
            onClick={onOpenGenerator}
            className="px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Questionnaire</span>
          </button>
        </div>

        {bookQuestionnaires.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-stone-300 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-800">No Questionnaires Created Yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Hit &ldquo;Create Questionnaire&rdquo; to have AI extract custom reading guides, multiple choice tests, or discussion rubrics from this text.
              </p>
            </div>
            <button
              onClick={onOpenGenerator}
              className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Generate First Questionnaire</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookQuestionnaires.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {q.targetAudience.replace('_', ' ')}
                    </span>
                    <span className="text-stone-400 capitalize">{q.difficulty}</span>
                  </div>

                  <h3
                    onClick={() => onSelectQuestionnaire(q)}
                    className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 cursor-pointer transition-colors line-clamp-2"
                  >
                    {q.title}
                  </h3>
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {q.description}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-stone-600 pt-1">
                    <span className="font-semibold text-amber-900 bg-stone-100 px-2 py-0.5 rounded">
                      {q.questions.length} Questions
                    </span>
                    <span>·</span>
                    <span>
                      {q.questions.reduce((sum, item) => sum + (item.points || 5), 0)} Total Pts
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectQuestionnaire(q)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors text-center"
                  >
                    Edit / View
                  </button>
                  <button
                    onClick={() => onTakeQuiz(q)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Take Quiz</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chapters & Reader View */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-stone-200 bg-stone-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700" />
              Chapter Reader &amp; Excerpt Viewer
            </h3>
            <p className="text-xs text-stone-500">
              Browse the source text to cross-reference questions and verify literary details
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-stone-200 min-h-[400px]">
          {/* Chapter sidebar */}
          <div className="md:col-span-4 p-3 max-h-[500px] overflow-y-auto space-y-1 bg-stone-50/40">
            {book.chapters.map((ch, idx) => {
              const isSelected = ch.id === selectedChapter?.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-100/70 text-amber-950 font-semibold shadow-xs border border-amber-300'
                      : 'text-stone-700 hover:bg-stone-100 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">
                      Part {idx + 1}
                    </span>
                    <span className="text-xs truncate block">{ch.title}</span>
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono shrink-0">
                    {ch.wordCount.toLocaleString()} w
                  </span>
                </button>
              );
            })}
          </div>

          {/* Chapter content viewer */}
          <div className="md:col-span-8 p-6 max-h-[500px] overflow-y-auto bg-stone-50/20">
            {selectedChapter ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="border-b border-stone-200 pb-3">
                  <h4 className="text-xl font-serif font-bold text-stone-900">
                    {selectedChapter.title}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {selectedChapter.wordCount.toLocaleString()} words · ~{estimateReadingTime(selectedChapter.wordCount)} min read
                  </p>
                </div>
                <div className="font-serif text-sm text-stone-800 leading-relaxed space-y-4 whitespace-pre-line">
                  {selectedChapter.content}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-stone-400 text-xs">
                Select a chapter on the left to read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
