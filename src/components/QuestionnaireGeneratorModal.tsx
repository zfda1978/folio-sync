import React, { useState, useEffect } from 'react';
import { Sparkles, X, Layers, CheckSquare, BookOpen, AlertCircle, Loader2 } from 'lucide-react';
import {
  Book,
  CognitiveDimension,
  DifficultyLevel,
  Questionnaire,
  QuestionType,
  TargetAudience,
} from '../types';
import { apiGenerateQuestionnaire } from '../services/api';

interface QuestionnaireGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book;
  onQuestionnaireCreated: (questionnaire: Questionnaire) => void;
}

const GRADE_OPTIONS: Array<{ id: TargetAudience; label: string; band: string }> = [
  { id: 'grade_4', label: 'Grade 4', band: 'Foundational Logic' },
  { id: 'grade_5', label: 'Grade 5', band: 'Structured Inquiry' },
  { id: 'grade_6', label: 'Grade 6', band: 'Deductive Reading' },
  { id: 'grade_7', label: 'Grade 7', band: 'Analytical Synthesis' },
  { id: 'grade_8', label: 'Grade 8', band: 'Critical Reasoning' },
  { id: 'grade_9', label: 'Grade 9', band: 'Rhetorical Logic' },
  { id: 'grade_10', label: 'Grade 10', band: 'Advanced Evaluation' },
  { id: 'general', label: 'Open Inquiry', band: 'Cross-Level' },
];

const COGNITIVE_OPTIONS: Array<{ id: CognitiveDimension; label: string; desc: string }> = [
  { id: 'logical', label: 'Logical', desc: 'Cause, sequence & deduction' },
  { id: 'rational', label: 'Rational', desc: 'Evidence-backed justification' },
  { id: 'critical', label: 'Critical', desc: 'Evaluate motives & intent' },
  { id: 'innovative', label: 'Innovative', desc: 'Novel synthesis & scenarios' },
];

export const QuestionnaireGeneratorModal: React.FC<QuestionnaireGeneratorModalProps> = ({
  isOpen,
  onClose,
  book,
  onQuestionnaireCreated,
}) => {
  const [title, setTitle] = useState(`${book.title}: ZENOXIS Assessment`);
  const [selectedChapterScope, setSelectedChapterScope] = useState<'all' | string>('all');
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('grade_8');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState<number>(8);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
    'short_answer',
    'quote_identification',
  ]);
  const [cognitiveDimensions, setCognitiveDimensions] = useState<CognitiveDimension[]>([
    'logical',
    'rational',
    'critical',
    'innovative',
  ]);
  const [focusAreas, setFocusAreas] = useState<string[]>([
    'Logical Cause & Effect',
    'Thematic Depth',
    'Character Reasoning',
    'Creative Synthesis',
  ]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(`${book.title}: ZENOXIS Assessment`);
      setSelectedChapterScope('all');
      setError(null);
    }
  }, [isOpen, book.id, book.title]);

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

  const toggleCognitiveDimension = (dim: CognitiveDimension) => {
    if (cognitiveDimensions.includes(dim)) {
      if (cognitiveDimensions.length > 1) {
        setCognitiveDimensions(cognitiveDimensions.filter((d) => d !== dim));
      }
    } else {
      setCognitiveDimensions([...cognitiveDimensions, dim]);
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
    setLoadingStep('Indexing chapters and building source-grounded reasoning context...');

    try {
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
          contentToUse = book.chapters.map((ch) => `=== ${ch.title} ===\n${ch.content}`).join('\n\n');
        }
      }

      setLoadingStep('Formulating logical, rational, critical & innovative questions...');

      const generated = await apiGenerateQuestionnaire({
        title: book.title,
        author: book.author,
        bookContent: contentToUse,
        targetAudience,
        difficulty,
        questionCount,
        questionTypes,
        cognitiveDimensions,
        focusAreas,
        chapterTitle: chapterTitleName,
        customInstructions: customInstructions.trim(),
      });

      generated.bookId = book.id;
      if (title.trim()) {
        generated.title = title.trim();
      }

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

  const FOCUS_OPTIONS = [
    'Logical Cause & Effect',
    'Thematic Depth',
    'Character Reasoning',
    'Evidence & Argumentation',
    'Symbolism & Metaphors',
    'Creative Synthesis',
    'Ethical Dilemmas',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#111D3B]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-[#A9B9D3]/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#EDF1FA]/70 border-b border-[#A9B9D3]/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#111D3B] text-[#8174D5] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#111D3B]">ZENOXIS AI Assessment Builder</h2>
              <p className="text-xs text-[#111D3B]/65">
                Source volume: <span className="font-semibold text-[#111D3B]">{book.title}</span> by {book.author}
              </p>
            </div>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-[#111D3B]/50 hover:text-[#111D3B] p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
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
              <div className="w-14 h-14 rounded-2xl bg-[#111D3B] flex items-center justify-center text-[#51BCA6]">
                <Loader2 className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#111D3B]">Synthesizing Assessment</h3>
                <p className="text-xs text-[#3978E8] font-medium mt-1">{loadingStep}</p>
                <p className="text-[11px] text-[#111D3B]/55 mt-2 max-w-sm">
                  ZENOXIS AI is grounding each prompt, distractor, and answer key in your book chapters.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-1">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#A9B9D3] rounded-lg focus:ring-2 focus:ring-[#3978E8] focus:outline-hidden bg-white text-[#111D3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#3978E8]" />
                  <span>Chapter &amp; Topic Scope</span>
                </label>
                <select
                  value={selectedChapterScope}
                  onChange={(e) => setSelectedChapterScope(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#A9B9D3] rounded-lg bg-white text-[#111D3B] focus:ring-2 focus:ring-[#3978E8] focus:outline-hidden"
                >
                  <option value="all">
                    Full Book ({book.chapters.length} chapters · {book.totalWords.toLocaleString()} words)
                  </option>
                  {book.chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title} ({ch.wordCount.toLocaleString()} words)
                    </option>
                  ))}
                </select>
              </div>

              {/* Grades 4–10 Adaptive Calibration */}
              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-2">
                  Adaptive Grade Level (Grades 4–10 &amp; Open Inquiry)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setTargetAudience(opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        targetAudience === opt.id
                          ? 'border-[#3978E8] bg-[#EDF1FA] text-[#111D3B] ring-1 ring-[#3978E8]'
                          : 'border-[#A9B9D3]/55 bg-white text-[#111D3B]/80 hover:border-[#3978E8]/60'
                      }`}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] text-[#111D3B]/60 mt-0.5 leading-tight">{opt.band}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cognitive Reasoning Dimensions */}
              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-2">
                  Cognitive Reasoning Dimensions
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COGNITIVE_OPTIONS.map((dim) => {
                    const active = cognitiveDimensions.includes(dim.id);
                    return (
                      <button
                        key={dim.id}
                        type="button"
                        onClick={() => toggleCognitiveDimension(dim.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-[#8174D5] bg-[#8174D5]/10 text-[#111D3B] ring-1 ring-[#8174D5]'
                            : 'border-[#A9B9D3]/55 bg-white text-[#111D3B]/70 hover:border-[#8174D5]/50'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center justify-between">
                          <span>{dim.label}</span>
                          <CheckSquare className={`w-3.5 h-3.5 ${active ? 'text-[#8174D5]' : 'text-[#A9B9D3]'}`} />
                        </div>
                        <div className="text-[10px] text-[#111D3B]/60 mt-0.5 leading-tight">{dim.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#111D3B] mb-1.5">
                    Complexity Tier
                  </label>
                  <div className="flex rounded-lg border border-[#A9B9D3]/60 overflow-hidden p-0.5 bg-[#EDF1FA]/60">
                    {(['easy', 'medium', 'hard', 'scholarly'] as DifficultyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`flex-1 py-1.5 text-xs font-medium capitalize rounded-md transition-all cursor-pointer ${
                          difficulty === lvl
                            ? 'bg-[#111D3B] text-white font-semibold'
                            : 'text-[#111D3B]/65 hover:text-[#111D3B]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#111D3B]">
                      Question Count
                    </label>
                    <span className="text-xs font-mono tabular-nums font-bold text-[#3978E8]">
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
                    className="w-full accent-[#3978E8] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono tabular-nums text-[#111D3B]/50 mt-1">
                    <span>4</span>
                    <span>10</span>
                    <span>20</span>
                  </div>
                </div>
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-1.5">
                  Assessment Formats
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'multiple_choice', label: 'Multiple Choice' },
                    { id: 'true_false', label: 'True / False' },
                    { id: 'short_answer', label: 'Analytical Short Answer' },
                    { id: 'quote_identification', label: 'Passage Identification' },
                    { id: 'essay', label: 'Extended Reasoning Prompt' },
                  ].map((t) => {
                    const isSelected = questionTypes.includes(t.id as QuestionType);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleQuestionType(t.id as QuestionType)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDF1FA] border-[#3978E8] text-[#111D3B] font-semibold'
                            : 'bg-white border-[#A9B9D3]/60 text-[#111D3B]/70 hover:bg-[#EDF1FA]/40'
                        }`}
                      >
                        <CheckSquare className={`w-3.5 h-3.5 ${isSelected ? 'text-[#3978E8]' : 'text-[#A9B9D3]'}`} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus Areas */}
              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-1.5">
                  Inquiry Focus
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_OPTIONS.map((area) => {
                    const isChecked = focusAreas.includes(area);
                    return (
                      <button
                        key={area}
                        type="button"
                        onClick={() => toggleFocusArea(area)}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#111D3B] text-white border-[#111D3B] font-medium'
                            : 'bg-white text-[#111D3B]/70 border-[#A9B9D3]/60 hover:bg-[#EDF1FA]'
                        }`}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111D3B] mb-1">
                  Educator / Learner Guidance (Optional)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Emphasize cause-and-effect reasoning and innovative counterfactual scenarios"
                  className="w-full px-3 py-2 text-xs border border-[#A9B9D3] rounded-lg focus:ring-2 focus:ring-[#3978E8] focus:outline-hidden bg-white text-[#111D3B]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#EDF1FA]/60 border-t border-[#A9B9D3]/45 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-[#111D3B]/70 hover:text-[#111D3B] rounded-lg hover:bg-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={isLoading || questionTypes.length === 0}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] disabled:opacity-50 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate {questionCount} Questions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
