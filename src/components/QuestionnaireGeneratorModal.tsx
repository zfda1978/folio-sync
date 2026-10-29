import React, { useState } from 'react';
import { Sparkles, X, Layers, CheckSquare, Settings2, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import { Book, DifficultyLevel, Questionnaire, QuestionType, TargetAudience } from '../types';
import { apiGenerateQuestionnaire } from '../services/api';

interface QuestionnaireGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onQuestionnaireCreated: (questionnaire: Questionnaire) => void;
}

export const QuestionnaireGeneratorModal: React.FC<QuestionnaireGeneratorModalProps> = ({
  isOpen,
  onClose,
  book,
  onQuestionnaireCreated,
}) => {
  const [title, setTitle] = useState(`${book.title}: Study Guide & Assessment`);
  const [selectedChapterScope, setSelectedChapterScope] = useState<'all' | string>('all');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('high_school');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
    'short_answer',
    'quote_identification',
  ]);
  const [focusAreas, setFocusAreas] = useState<string[]>([
    'Plot Comprehension',
    'Thematic Depth & Motifs',
    'Character Psychology',
    'Symbolism & Metaphors',
  ]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleQuestionType = (type: QuestionType) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const toggleFocusArea = (area: string) => {
    if (focusAreas.includes(area)) {
      setFocusAreas(focusAreas.filter((a) => a !== area));
    } else {
      setFocusAreas([...focusAreas, area]);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingStep('Ingesting chapter text and analyzing literary structure...');

    try {
      // Determine content to pass
      let contentToUse = '';
      let chapterTitleName = '';

      if (selectedChapterScope === 'all') {
        contentToUse = book.chapters.map((ch) => `=== ${ch.title} ===\n${ch.content}`).join('\n\n');
      } else {
        const found = book.chapters.find((ch) => ch.id === selectedChapterScope);
        if (found) {
          contentToUse = found.content;
          chapterTitleName = found.title;
        } else {
          contentToUse = book.chapters[0]?.content || '';
        }
      }

      setLoadingStep('Formulating questions, plausible distractors, and Bloom taxonomy levels...');

      const generated = await apiGenerateQuestionnaire({
        title: book.title,
        author: book.author,
        bookContent: contentToUse,
        targetAudience,
        difficulty,
        questionCount,
        questionTypes,
        focusAreas,
        chapterTitle: chapterTitleName,
        customInstructions: customInstructions.trim(),
      });

      generated.bookId = book.id;
      if (title.trim()) {
        generated.title = title.trim();
      }

      setLoadingStep('Finalizing questionnaire rubric and citations...');
      onQuestionnaireCreated(generated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate questionnaire. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const AUDIENCE_OPTIONS: { id: TargetAudience; label: string; desc: string }[] = [
    { id: 'middle_school', label: 'Middle School', desc: 'Grades 6–8 · Literal recall, core events' },
    { id: 'high_school', label: 'High School', desc: 'Grades 9–12 · Thematic analysis & motifs' },
    { id: 'college', label: 'College / AP Lit', desc: 'Scholarly critique, literary nuance' },
    { id: 'book_club', label: 'Book Club', desc: 'Discussion prompts & moral reflections' },
    { id: 'exam', label: 'Formal Exam', desc: 'Rigorous objective & short-response test' },
    { id: 'general', label: 'General Reader', desc: 'Engaging broad comprehension' },
  ];

  const FOCUS_OPTIONS = [
    'Plot Comprehension',
    'Thematic Depth & Motifs',
    'Character Psychology',
    'Symbolism & Metaphors',
    'Vocabulary in Context',
    'Historical / Cultural Setting',
    'Moral Dilemmas',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">
                Generate Questionnaire with AI
              </h2>
              <p className="text-xs text-stone-500">
                Preparing custom questions for <span className="font-semibold text-stone-800">{book.title}</span> by {book.author}
              </p>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 animate-pulse">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-amber-600 rounded-full p-1 text-white shadow-md animate-spin">
                  <Loader2 className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">Crafting Questionnaire</h3>
                <p className="text-xs text-amber-700 font-medium mt-1 animate-pulse">{loadingStep}</p>
                <p className="text-[11px] text-stone-400 mt-2 max-w-sm">
                  Gemini is examining literary nuances, building verified citations, and formulating distractors.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Questionnaire Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Questionnaire Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>

              {/* Scope (Chapters) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-stone-500" />
                  Chapter / Text Scope
                </label>
                <select
                  value={selectedChapterScope}
                  onChange={(e) => setSelectedChapterScope(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">Full Book ({book.chapters.length} chapters · {book.totalWords.toLocaleString()} words)</option>
                  {book.chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title} ({ch.wordCount.toLocaleString()} words)
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Target Audience &amp; Academic Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetAudience(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        targetAudience === opt.id
                          ? 'border-amber-600 bg-amber-50/70 text-amber-900 ring-1 ring-amber-600'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Difficulty Level
                  </label>
                  <div className="flex rounded-lg border border-stone-200 overflow-hidden p-0.5 bg-stone-50">
                    {(['easy', 'medium', 'hard', 'scholarly'] as DifficultyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-all ${
                          difficulty === lvl
                            ? 'bg-white text-stone-900 shadow-xs font-semibold'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-stone-700">
                      Number of Questions
                    </label>
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {questionCount} questions
                    </span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={20}
                    step={1}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                    <span>4 (Quick Quiz)</span>
                    <span>10 (Standard)</span>
                    <span>20 (Comprehensive)</span>
                  </div>
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Question Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'multiple_choice', label: 'Multiple Choice (4 options)' },
                    { id: 'true_false', label: 'True / False' },
                    { id: 'short_answer', label: 'Short Answer (Analytical)' },
                    { id: 'quote_identification', label: 'Quote Identification' },
                    { id: 'essay', label: 'Essay / Discussion Prompt' },
                  ].map((t) => {
                    const isSelected = questionTypes.includes(t.id as QuestionType);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleQuestionType(t.id as QuestionType)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <CheckSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-600' : 'text-stone-300'}`} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Focus Areas &amp; Themes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_OPTIONS.map((area) => {
                    const isChecked = focusAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleFocusArea(area)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                          isChecked
                            ? 'bg-stone-900 text-white border-stone-900 font-medium'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Instructions */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Custom Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Include questions on the green light and Daisy's voice; create challenging distractors"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={isLoading || questionTypes.length === 0}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:opacity-50 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Questionnaire...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Generate {questionCount} Questions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
