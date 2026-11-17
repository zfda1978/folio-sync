import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  FileDown,
  Play,
  Printer,
  Quote,
  Loader2,
} from 'lucide-react';
import {
  BloomsLevel,
  Book,
  CognitiveDimension,
  Question,
  Questionnaire,
} from '../types';
import { apiAddSingleQuestion } from '../services/api';
import { formatAudienceLabel, inferCognitiveDimension } from '../utils/textParser';

interface QuestionnaireEditorProps {
  questionnaire: Questionnaire;
  book: Book;
  onUpdateQuestionnaire: (updated: Questionnaire) => void;
  onStartQuiz: () => void;
  onOpenPrint: () => void;
  onOpenExport: () => void;
}

export const QuestionnaireEditor: React.FC<QuestionnaireEditorProps> = ({
  questionnaire,
  book,
  onUpdateQuestionnaire,
  onStartQuiz,
  onOpenPrint,
  onOpenExport,
}) => {
  const [activeFilterType, setActiveFilterType] = useState<string>('all');
  const [activeFilterBlooms, setActiveFilterBlooms] = useState<string>('all');
  const [activeFilterDimension, setActiveFilterDimension] = useState<string>('all');
  const [isGeneratingExtra, setIsGeneratingExtra] = useState(false);
  const [extraQuestionGoal, setExtraQuestionGoal] = useState('');
  const [extraDimension, setExtraDimension] = useState<CognitiveDimension>('critical');
  const [showAddAiModal, setShowAddAiModal] = useState(false);

  const totalPoints = questionnaire.questions.reduce((sum, q) => sum + (Number(q.points) || 5), 0);

  const handleUpdateQuestion = (index: number, updatedQ: Question) => {
    const newQuestions = [...questionnaire.questions];
    newQuestions[index] = updatedQ;
    onUpdateQuestionnaire({
      ...questionnaire,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteQuestion = (index: number) => {
    if (questionnaire.questions.length <= 1) return;
    const newQuestions = questionnaire.questions.filter((_, i) => i !== index);
    onUpdateQuestionnaire({
      ...questionnaire,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDuplicateQuestion = (index: number) => {
    const target = questionnaire.questions[index];
    const duplicated: Question = {
      ...target,
      id: `q-${Date.now()}`,
      prompt: `${target.prompt} (Copy)`,
    };
    const newQuestions = [...questionnaire.questions];
    newQuestions.splice(index + 1, 0, duplicated);
    onUpdateQuestionnaire({
      ...questionnaire,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= questionnaire.questions.length) return;
    const newQuestions = [...questionnaire.questions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(newIdx, 0, moved);
    onUpdateQuestionnaire({
      ...questionnaire,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleShuffle = () => {
    const shuffled = [...questionnaire.questions].sort(() => Math.random() - 0.5);
    onUpdateQuestionnaire({
      ...questionnaire,
      questions: shuffled,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddManualQuestion = () => {
    const newQ: Question = {
      id: `q-${Date.now()}`,
      type: 'multiple_choice',
      prompt: `New reasoning question based on ${book.title}`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: '0',
      explanation: 'Explanation grounded in the source text.',
      bloomsLevel: 'analyze',
      cognitiveDimension: 'logical',
      points: 5,
      bookCitation: {
        chapter: book.chapters[0]?.title || 'Chapter 1',
        quoteSnippet: '',
      },
    };
    onUpdateQuestionnaire({
      ...questionnaire,
      questions: [...questionnaire.questions, newQ],
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddAiQuestion = async () => {
    setIsGeneratingExtra(true);
    try {
      const fullText = book.chapters.map((c) => c.content).join('\n\n');
      const newQ = await apiAddSingleQuestion({
        title: book.title,
        author: book.author,
        bookContent: fullText,
        questionType: 'multiple_choice',
        bloomsLevel: extraDimension === 'innovative' ? 'create' : 'analyze',
        cognitiveDimension: extraDimension,
        targetAudience: questionnaire.targetAudience,
        userGoal:
          extraQuestionGoal.trim() ||
          `Craft a ${extraDimension} reasoning question testing cause, evidence, and synthesis`,
      });
      onUpdateQuestionnaire({
        ...questionnaire,
        questions: [...questionnaire.questions, newQ],
        updatedAt: new Date().toISOString(),
      });
      setShowAddAiModal(false);
      setExtraQuestionGoal('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingExtra(false);
    }
  };

  const filteredQuestions = questionnaire.questions.filter((q) => {
    const dim = inferCognitiveDimension(q);
    if (activeFilterType !== 'all' && q.type !== activeFilterType) return false;
    if (activeFilterBlooms !== 'all' && q.bloomsLevel !== activeFilterBlooms) return false;
    if (activeFilterDimension !== 'all' && dim !== activeFilterDimension) return false;
    return true;
  });

  const dimensionColorText = (dim: CognitiveDimension) => {
    switch (dim) {
      case 'logical':
        return 'text-[#3978E8]';
      case 'rational':
        return 'text-[#111D3B]';
      case 'critical':
        return 'text-[#8174D5]';
      case 'innovative':
        return 'text-[#51BCA6]';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Studio Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#A9B9D3]/55 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#111D3B]/65">
            <span className="font-bold text-[#3978E8] uppercase tracking-wider">
              ZENOXIS Studio
            </span>
            <span>·</span>
            <span className="font-semibold text-[#111D3B]">
              {formatAudienceLabel(questionnaire.targetAudience)}
            </span>
            <span>·</span>
            <span className="capitalize">{questionnaire.difficulty} tier</span>
            <span>·</span>
            <span>
              Source: <strong className="text-[#111D3B]">{book.title}</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onStartQuiz}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#51BCA6] hover:bg-[#3FA590] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Web Exam</span>
            </button>

            <button
              onClick={onOpenPrint}
              className="px-3.5 py-2 text-xs font-semibold text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/35 rounded-xl border border-[#A9B9D3]/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printable PDF</span>
            </button>

            <button
              onClick={onOpenExport}
              className="px-3.5 py-2 text-xs font-semibold text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/35 rounded-xl border border-[#A9B9D3]/50 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Editable Title & Description */}
        <div className="space-y-2">
          <input
            type="text"
            value={questionnaire.title}
            onChange={(e) =>
              onUpdateQuestionnaire({
                ...questionnaire,
                title: e.target.value,
                updatedAt: new Date().toISOString(),
              })
            }
            className="w-full font-['Sora'] text-2xl sm:text-3xl font-bold text-[#111D3B] border-b border-transparent hover:border-[#A9B9D3] focus:border-[#3978E8] focus:outline-hidden pb-1 bg-transparent transition-colors"
          />
          <textarea
            value={questionnaire.description}
            onChange={(e) =>
              onUpdateQuestionnaire({
                ...questionnaire,
                description: e.target.value,
                updatedAt: new Date().toISOString(),
              })
            }
            rows={2}
            className="w-full text-xs sm:text-sm text-[#111D3B]/75 border border-transparent hover:border-[#A9B9D3]/60 focus:border-[#3978E8] rounded-lg p-1.5 focus:outline-hidden bg-transparent leading-relaxed"
          />
        </div>

        {/* Clean Unboxed Stats */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#A9B9D3]/35 text-xs font-mono tabular-nums text-[#111D3B]/70">
          <span>
            <strong className="text-[#111D3B]">{questionnaire.questions.length}</strong> Questions
          </span>
          <span>·</span>
          <span>
            <strong className="text-[#111D3B]">{totalPoints}</strong> Total Points
          </span>
          <span>·</span>
          <span className="font-sans">
            Scope: <strong className="text-[#111D3B]">{questionnaire.chapterScope.join(', ') || 'Full Book'}</strong>
          </span>
        </div>
      </div>

      {/* Studio Filters & Authoring Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#A9B9D3]/50">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeFilterType}
            onChange={(e) => setActiveFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-[#A9B9D3] rounded-lg bg-[#EDF1FA]/50 text-[#111D3B]"
          >
            <option value="all">All Formats</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
            <option value="quote_identification">Passage Identification</option>
            <option value="essay">Extended Prompt</option>
          </select>

          <select
            value={activeFilterDimension}
            onChange={(e) => setActiveFilterDimension(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-[#A9B9D3] rounded-lg bg-[#EDF1FA]/50 text-[#111D3B]"
          >
            <option value="all">All Reasoning Modes</option>
            <option value="logical">Logical</option>
            <option value="rational">Rational</option>
            <option value="critical">Critical</option>
            <option value="innovative">Innovative</option>
          </select>

          <select
            value={activeFilterBlooms}
            onChange={(e) => setActiveFilterBlooms(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-[#A9B9D3] rounded-lg bg-[#EDF1FA]/50 text-[#111D3B]"
          >
            <option value="all">All Bloom Levels</option>
            <option value="remember">Remember</option>
            <option value="understand">Understand</option>
            <option value="apply">Apply</option>
            <option value="analyze">Analyze</option>
            <option value="evaluate">Evaluate</option>
            <option value="create">Create</option>
          </select>

          <button
            onClick={handleShuffle}
            className="px-2.5 py-1.5 text-xs font-medium text-[#111D3B]/75 hover:text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/35 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAiModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#8174D5] hover:bg-[#6D5EC4] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Add via ZENOXIS AI</span>
          </button>

          <button
            onClick={handleAddManualQuestion}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/40 border border-[#A9B9D3]/55 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Question</span>
          </button>
        </div>
      </div>

      {/* Add AI Question Modal */}
      {showAddAiModal && (
        <div className="fixed inset-0 z-50 bg-[#111D3B]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#A9B9D3] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#111D3B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#8174D5]" />
                <span>Add Question with ZENOXIS AI</span>
              </h3>
              <button
                onClick={() => setShowAddAiModal(false)}
                className="text-[#111D3B]/50 hover:text-[#111D3B] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#111D3B]/70">
              Generate one new source-grounded question for <strong className="text-[#111D3B]">{book.title}</strong>.
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#111D3B] mb-1">
                Reasoning Dimension
              </label>
              <select
                value={extraDimension}
                onChange={(e) => setExtraDimension(e.target.value as CognitiveDimension)}
                className="w-full text-xs p-2 border border-[#A9B9D3] rounded-lg bg-white text-[#111D3B]"
              >
                <option value="logical">Logical — Cause, sequence &amp; deduction</option>
                <option value="rational">Rational — Evidence-backed comprehension</option>
                <option value="critical">Critical — Evaluate motives &amp; perspective</option>
                <option value="innovative">Innovative — Counterfactual &amp; creative synthesis</option>
              </select>
            </div>
            <textarea
              value={extraQuestionGoal}
              onChange={(e) => setExtraQuestionGoal(e.target.value)}
              placeholder="e.g. Test what would happen if Gatsby had revealed his past to Daisy early on..."
              rows={3}
              className="w-full text-xs p-2.5 border border-[#A9B9D3] rounded-lg focus:ring-2 focus:ring-[#3978E8] focus:outline-hidden text-[#111D3B]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddAiModal(false)}
                className="px-3 py-1.5 text-xs text-[#111D3B]/70 hover:bg-[#EDF1FA] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAiQuestion}
                disabled={isGeneratingExtra}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] disabled:opacity-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingExtra ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Add to Studio</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-[#A9B9D3]">
            <p className="text-xs text-[#111D3B]/60">No questions match the current filter.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const index = questionnaire.questions.findIndex((item) => item.id === q.id);
            const dim = inferCognitiveDimension(q);

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-[#A9B9D3]/50 hover:border-[#3978E8]/60 transition-all space-y-4"
              >
                {/* Item Header — Zero Pills */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs">
                    <span className="w-7 h-7 rounded-lg bg-[#111D3B] text-white font-mono tabular-nums font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="uppercase font-semibold tracking-wider text-[11px] text-[#111D3B]/70">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span className="text-[#A9B9D3]">·</span>
                    <span className={`uppercase font-bold tracking-wider text-[11px] ${dimensionColorText(dim)}`}>
                      {dim}
                    </span>
                    <span className="text-[#A9B9D3]">·</span>
                    <span className="text-[11px] text-[#111D3B]/60 capitalize">
                      Bloom: {q.bloomsLevel}
                    </span>
                    <span className="text-[#A9B9D3]">·</span>
                    <div className="flex items-center gap-1 text-xs text-[#111D3B]/70">
                      <span>Pts:</span>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={q.points || 5}
                        onChange={(e) =>
                          handleUpdateQuestion(index, {
                            ...q,
                            points: Number(e.target.value) || 5,
                          })
                        }
                        className="w-12 px-1.5 py-0.5 text-xs font-mono tabular-nums border border-[#A9B9D3] rounded text-center font-bold text-[#111D3B]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#111D3B]/45">
                    <button
                      onClick={() => handleMoveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-[#111D3B] hover:bg-[#EDF1FA] rounded disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(index, 'down')}
                      disabled={index === questionnaire.questions.length - 1}
                      className="p-1 hover:text-[#111D3B] hover:bg-[#EDF1FA] rounded disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateQuestion(index)}
                      className="p-1 hover:text-[#111D3B] hover:bg-[#EDF1FA] rounded cursor-pointer"
                      title="Duplicate Question"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editable Prompt */}
                <textarea
                  value={q.prompt}
                  onChange={(e) =>
                    handleUpdateQuestion(index, {
                      ...q,
                      prompt: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full font-serif text-lg font-semibold text-[#111D3B] border border-[#A9B9D3]/50 focus:border-[#3978E8] rounded-xl p-3 focus:outline-hidden bg-[#EDF1FA]/30 leading-snug"
                  placeholder="Enter question text..."
                />

                {/* Choices */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = String(q.correctAnswer) === String(optIdx);
                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCorrect
                              ? 'bg-[#51BCA6]/12 border-[#51BCA6]'
                              : 'bg-white border-[#A9B9D3]/45 hover:border-[#3978E8]/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={isCorrect}
                            onChange={() =>
                              handleUpdateQuestion(index, {
                                ...q,
                                correctAnswer: String(optIdx),
                              })
                            }
                            className="accent-[#51BCA6] w-4 h-4 cursor-pointer"
                          />
                          <span
                            className={`w-6 h-6 rounded-md text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? 'bg-[#51BCA6] text-white'
                                : 'bg-[#EDF1FA] text-[#111D3B]'
                            }`}
                          >
                            {letter}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...(q.options || [])];
                              newOpts[optIdx] = e.target.value;
                              handleUpdateQuestion(index, { ...q, options: newOpts });
                            }}
                            className="flex-1 text-xs text-[#111D3B] bg-transparent focus:outline-hidden"
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-[#2F8A77] uppercase tracking-wider">
                              Answer Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Open-Ended Rubric */}
                {(q.type === 'short_answer' || q.type === 'essay') && (
                  <div className="p-3 rounded-xl bg-[#EDF1FA]/60 border border-[#A9B9D3]/50 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#3978E8] block">
                      Model Reasoning &amp; Rubric
                    </label>
                    <textarea
                      value={String(q.correctAnswer || '')}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          ...q,
                          correctAnswer: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full text-xs text-[#111D3B] bg-white border border-[#A9B9D3]/60 rounded-lg p-2 focus:outline-hidden leading-relaxed"
                    />
                  </div>
                )}

                {/* Explanation & Citation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#EDF1FA]/35 border border-[#A9B9D3]/45 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#111D3B]/55 block">
                      Rationale &amp; Explanation
                    </label>
                    <textarea
                      value={q.explanation}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          ...q,
                          explanation: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full text-xs text-[#111D3B]/85 bg-white border border-[#A9B9D3]/45 rounded p-1.5 focus:outline-hidden"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-[#EDF1FA]/35 border border-[#A9B9D3]/45 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#111D3B]/55 flex items-center gap-1">
                      <Quote className="w-3 h-3 text-[#8174D5]" />
                      <span>Source Citation Snippet</span>
                    </label>
                    <input
                      type="text"
                      value={q.bookCitation?.quoteSnippet || ''}
                      onChange={(e) =>
                        handleUpdateQuestion(index, {
                          ...q,
                          bookCitation: {
                            ...q.bookCitation,
                            quoteSnippet: e.target.value,
                          },
                        })
                      }
                      className="w-full text-sm text-[#111D3B] bg-white border border-[#A9B9D3]/45 rounded p-1.5 focus:outline-hidden font-serif italic"
                      placeholder="“Exact passage from chapter...”"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
