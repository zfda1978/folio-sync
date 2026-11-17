import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Plus,
  Play,
  Loader2,
  Quote,
  ArrowLeft,
} from 'lucide-react';
import { Book, Questionnaire, WorkspaceRole } from '../types';
import { estimateReadingTime, formatAudienceLabel } from '../utils/textParser';
import { apiAnalyzeBook } from '../services/api';

interface BookOverviewProps {
  book: Book;
  questionnaires: Questionnaire[];
  workspaceRole: WorkspaceRole;
  onBackToLibrary: () => void;
  onOpenGenerator: () => void;
  onSelectQuestionnaire: (q: Questionnaire) => void;
  onUpdateBook: (updatedBook: Book) => void;
  onTakeQuiz: (q: Questionnaire) => void;
}

export const BookOverview: React.FC<BookOverviewProps> = ({
  book,
  questionnaires,
  workspaceRole,
  onBackToLibrary,
  onOpenGenerator,
  onSelectQuestionnaire,
  onUpdateBook,
  onTakeQuiz,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>(book.chapters[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedChapterId(book.chapters[0]?.id || '');
    setAnalysisError(null);
  }, [book.id]);

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
      {/* Back link */}
      <div>
        <button
          onClick={onBackToLibrary}
          className="text-xs font-semibold text-[#111D3B]/65 hover:text-[#3978E8] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to ZENOXIS Library</span>
        </button>
      </div>

      {/* Book Hero Banner */}
      <div className="bg-[#111D3B] text-[#EDF1FA] rounded-2xl p-6 sm:p-8 border border-[#1E315E] relative overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between relative z-10">
          <div className="flex items-start gap-5">
            <div
              className={`w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-gradient-to-br ${
                book.coverGradient || 'from-[#111D3B] via-[#1D356B] to-[#3978E8]'
              } ring-1 ring-white/15 flex items-center justify-center text-white shrink-0 font-serif text-3xl font-bold`}
            >
              {book.title[0]}
            </div>

            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#51BCA6]">
                Source Volume {book.sourceFormat ? `· ${book.sourceFormat.toUpperCase()}` : ''}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {book.title}
              </h1>
              <p className="text-[#A9B9D3] font-medium text-sm">
                by {book.author || 'Unknown Author'}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono tabular-nums text-[#A9B9D3] pt-1">
                <span>
                  {book.chapters.length} Chapter{book.chapters.length !== 1 ? 's' : ''}
                </span>
                <span>·</span>
                <span>{book.totalWords.toLocaleString()} words</span>
                <span>·</span>
                <span>~{estimateReadingTime(book.totalWords)}m read</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={onOpenGenerator}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Questionnaire</span>
            </button>

            {!book.analysis && (
              <button
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-2.5 text-sm font-medium text-[#EDF1FA] bg-white/10 hover:bg-white/15 rounded-xl border border-white/15 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#51BCA6]" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#8174D5]" />
                    <span>Analyze with ZENOXIS AI</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {analysisError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
            {analysisError}
          </div>
        )}
      </div>

      {/* Literary Analysis Section */}
      {book.analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#A9B9D3]/50 space-y-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3978E8]">
                Conceptual Synopsis &amp; Themes
              </h3>
              <p className="font-serif text-base text-[#111D3B]/90 leading-relaxed mt-2">
                {book.analysis.summary}
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#111D3B]/55 mb-2">
                Core Concepts Explored
              </h4>
              <div className="text-xs text-[#111D3B]/80 font-medium leading-relaxed">
                {book.analysis.themes?.join(' · ')}
              </div>
            </div>

            {book.analysis.keyQuotes && book.analysis.keyQuotes.length > 0 && (
              <div className="pt-4 border-t border-[#A9B9D3]/35">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#111D3B]/55 mb-3 flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-[#8174D5]" />
                  <span>Key Passages</span>
                </h4>
                <div className="space-y-3">
                  {book.analysis.keyQuotes.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#EDF1FA]/60 border border-[#A9B9D3]/40 space-y-1"
                    >
                      <p className="font-serif italic text-[15px] text-[#111D3B]">“{q.quote}”</p>
                      <p className="text-[11px] text-[#111D3B]/65">
                        <span className="font-semibold text-[#111D3B]">{q.context}</span> — {q.significance}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Characters / Key Entities */}
          <div className="bg-white rounded-2xl p-6 border border-[#A9B9D3]/50 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#111D3B]">
              Key Figures &amp; Entities
            </h3>

            <div className="space-y-3">
              {book.analysis.characters?.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-[#A9B9D3]/45 bg-[#EDF1FA]/35 space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-bold text-[#111D3B]">{char.name}</h4>
                    <span className="text-[11px] font-medium text-[#8174D5] shrink-0">
                      {char.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#111D3B]/70 line-clamp-3 leading-relaxed">
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
            <h2 className="text-lg font-bold text-[#111D3B]">
              Assessments for This Volume ({bookQuestionnaires.length})
            </h2>
            <p className="text-xs text-[#111D3B]/60">
              Logical, rational, critical, and innovative question sets grounded in this text
            </p>
          </div>
          <button
            onClick={onOpenGenerator}
            className="px-3.5 py-2 text-xs font-semibold text-[#3978E8] bg-white hover:bg-[#3978E8] hover:text-white rounded-lg border border-[#3978E8]/40 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Assessment</span>
          </button>
        </div>

        {bookQuestionnaires.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#A9B9D3] space-y-3">
            <h3 className="text-sm font-bold text-[#111D3B]">No Assessments Generated Yet</h3>
            <p className="text-xs text-[#111D3B]/65 max-w-sm mx-auto">
              Generate chapter-specific or full-book questionnaires calibrated for Grades 4–10 with ZENOXIS AI.
            </p>
            <button
              onClick={onOpenGenerator}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate First Assessment</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookQuestionnaires.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 border border-[#A9B9D3]/50 hover:border-[#3978E8] transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="text-[11px] font-medium text-[#111D3B]/60 flex items-center gap-1.5">
                    <span className="font-semibold text-[#3978E8]">
                      {formatAudienceLabel(q.targetAudience)}
                    </span>
                    <span>·</span>
                    <span className="capitalize">{q.difficulty}</span>
                  </div>

                  <h3
                    onClick={() => onSelectQuestionnaire(q)}
                    className="font-bold text-base text-[#111D3B] group-hover:text-[#3978E8] cursor-pointer transition-colors line-clamp-2"
                  >
                    {q.title}
                  </h3>
                  <p className="text-xs text-[#111D3B]/65 line-clamp-2 leading-relaxed">
                    {q.description}
                  </p>

                  <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#111D3B]/75 pt-1">
                    <span>{q.questions.length} Qs</span>
                    <span>·</span>
                    <span>
                      {q.questions.reduce((sum, item) => sum + (item.points || 5), 0)} pts
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#A9B9D3]/35 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectQuestionnaire(q)}
                    className="flex-1 px-3 py-1.5 text-xs font-semibold text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/35 rounded-lg transition-colors text-center cursor-pointer"
                  >
                    {workspaceRole === 'teacher' ? 'Open in Studio' : 'Review Questions'}
                  </button>
                  <button
                    onClick={() => onTakeQuiz(q)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#51BCA6] hover:bg-[#3FA590] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Assess</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chapters & Reader View */}
      <div className="bg-white rounded-2xl border border-[#A9B9D3]/50 overflow-hidden">
        <div className="p-5 border-b border-[#A9B9D3]/40 bg-[#EDF1FA]/45 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#111D3B] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#3978E8]" />
              <span>Chapters &amp; Topic Explorer</span>
            </h3>
            <p className="text-xs text-[#111D3B]/60">
              Inspect organized chapters and verify source passages
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#A9B9D3]/40 min-h-[420px]">
          <div className="md:col-span-4 p-3 max-h-[520px] overflow-y-auto space-y-1 bg-[#EDF1FA]/25">
            {book.chapters.map((ch, idx) => {
              const isSelected = ch.id === selectedChapter?.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-[#111D3B] text-white font-semibold'
                      : 'text-[#111D3B]/80 hover:bg-[#EDF1FA]'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span
                      className={`text-[10px] font-mono uppercase block ${
                        isSelected ? 'text-[#51BCA6]' : 'text-[#111D3B]/45'
                      }`}
                    >
                      Part {idx + 1}
                    </span>
                    <span className="text-xs truncate block">{ch.title}</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono tabular-nums shrink-0 ${
                      isSelected ? 'text-[#A9B9D3]' : 'text-[#111D3B]/50'
                    }`}
                  >
                    {ch.wordCount.toLocaleString()} w
                  </span>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-8 p-6 sm:p-8 max-h-[520px] overflow-y-auto bg-white">
            {selectedChapter ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="border-b border-[#A9B9D3]/40 pb-3">
                  <h4 className="text-xl font-bold text-[#111D3B]">
                    {selectedChapter.title}
                  </h4>
                  <p className="text-xs font-mono tabular-nums text-[#111D3B]/55 mt-1">
                    {selectedChapter.wordCount.toLocaleString()} words · ~{estimateReadingTime(selectedChapter.wordCount)}m read
                  </p>
                </div>
                <div className="font-serif text-[17px] text-[#111D3B]/90 leading-relaxed space-y-4 whitespace-pre-line">
                  {selectedChapter.content}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-[#111D3B]/40 text-xs">
                Select a chapter on the left to read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
