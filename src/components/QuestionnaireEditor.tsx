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
  BookOpen,
  Check,
  Quote,
  Layers,
  HelpCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { BloomsLevel, Book, Question, Questionnaire, QuestionType } from '../types';
import { apiAddSingleQuestion } from '../services/api';

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
  const [isGeneratingExtra, setIsGeneratingExtra] = useState(false);
  const [extraQuestionGoal, setExtraQuestionGoal] = useState('');
  const [showAddAiModal, setShowAddAiModal] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  const totalPoints = questionnaire.questions.reduce((sum, q) => sum + (Number(q.points) || 5), 0);

  const handleUpdateQuestion = (index: number, updatedQ: Question) => {
    const newQuestions = [...questionnaire.questions];
    newQuestions[index] = updatedQ;
    const updated = {
      ...questionnaire,
      questions: newQuestions,
      updatedAt: new Date().toISOString(),
    };
    onUpdateQuestionnaire(updated);
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
      prompt: 'New Question prompt based on ' + book.title,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: '0',
      explanation: 'Explanation for why Option A is supported by the text.',
      bloomsLevel: 'understand',
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
        bloomsLevel: 'analyze',
        userGoal: extraQuestionGoal.trim() || 'Create a question focusing on central motifs and character choices',
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
    if (activeFilterType !== 'all' && q.type !== activeFilterType) return false;
    if (activeFilterBlooms !== 'all' && q.bloomsLevel !== activeFilterBlooms) return false;
    return true;
  });

  const getBloomsBadgeColor = (level: BloomsLevel) => {
    switch (level) {
      case 'remember':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'understand':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'apply':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'analyze':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'evaluate':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'create':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Questionnaire Top Header & Metadata */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
              {questionnaire.targetAudience.replace('_', ' ')}
            </span>
            <span className="text-xs capitalize font-semibold px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              {questionnaire.difficulty} Level
            </span>
            <span className="text-xs font-medium text-stone-500">
              Book: <strong className="text-stone-800">{book.title}</strong>
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onStartQuiz}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Interactive Quiz</span>
            </button>

            <button
              onClick={onOpenPrint}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Printable Exam</span>
            </button>

            <button
              onClick={onOpenExport}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-200 flex items-center gap-1.5 transition-all cursor-pointer"
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
            className="w-full font-serif text-2xl sm:text-3xl font-bold text-stone-900 border-b border-transparent hover:border-stone-300 focus:border-amber-600 focus:outline-hidden pb-1 bg-transparent transition-colors"
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
            className="w-full text-xs sm:text-sm text-stone-600 border border-transparent hover:border-stone-200 focus:border-amber-600 rounded-lg p-1.5 focus:outline-hidden bg-transparent leading-relaxed"
          />
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-stone-100 text-xs text-stone-600">
          <div>
            <span className="font-bold text-stone-900">{questionnaire.questions.length}</span> Questions
          </div>
          <div>
            <span className="font-bold text-stone-900">{totalPoints}</span> Total Points
          </div>
          <div>
            Scope: <span className="font-medium text-stone-800">{questionnaire.chapterScope.join(', ') || 'Full Book'}</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={activeFilterType}
            onChange={(e) => setActiveFilterType(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50 text-stone-700"
          >
            <option value="all">All Question Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
            <option value="quote_identification">Quote Identification</option>
            <option value="essay">Essay Prompt</option>
          </select>

          <select
            value={activeFilterBlooms}
            onChange={(e) => setActiveFilterBlooms(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium border border-stone-300 rounded-lg bg-stone-50 text-stone-700"
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
            className="px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 transition-colors"
            title="Randomize question order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddAiModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>+ AI Generated Question</span>
          </button>

          <button
            onClick={handleAddManualQuestion}
            className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Manual Question</span>
          </button>
        </div>
      </div>

      {/* AI Single Question Generator Modal */}
      {showAddAiModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Generate Additional Question
              </h3>
              <button
                onClick={() => setShowAddAiModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-stone-500">
              Prompt Gemini to add one custom question based on any character, motif, or plot point in <span className="font-semibold text-stone-700">{book.title}</span>.
            </p>
            <textarea
              value={extraQuestionGoal}
              onChange={(e) => setExtraQuestionGoal(e.target.value)}
              placeholder="e.g. Focus on Daisy's white dresses and what they suggest about superficial purity vs corruption..."
              rows={3}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddAiModal(false)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAiQuestion}
                disabled={isGeneratingExtra}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5"
              >
                {isGeneratingExtra ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>Add Question to Studio</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-stone-300">
            <p className="text-xs text-stone-500">No questions match the current filter.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const index = questionnaire.questions.findIndex((item) => item.id === q.id);

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 hover:border-stone-300 shadow-xs transition-all space-y-4"
              >
                {/* Question Item Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-stone-900 text-white font-serif font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                      {q.type.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getBloomsBadgeColor(
                        q.bloomsLevel
                      )}`}
                    >
                      Bloom: {q.bloomsLevel}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-stone-500 pl-2">
                      <span>Points:</span>
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
                        className="w-12 px-1.5 py-0.5 text-xs border border-stone-300 rounded text-center font-bold"
                      />
                    </div>
                  </div>

                  {/* Move, Copy, Delete Buttons */}
                  <div className="flex items-center gap-1 text-stone-400">
                    <button
                      onClick={() => handleMoveQuestion(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(index, 'down')}
                      disabled={index === questionnaire.questions.length - 1}
                      className="p-1 hover:text-stone-700 hover:bg-stone-100 rounded disabled:opacity-30"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateQuestion(index)}
                      className="p-1 hover:text-stone-700 hover:bg-stone-100 rounded"
                      title="Duplicate Question"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(index)}
                      className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <div>
                  <textarea
                    value={q.prompt}
                    onChange={(e) =>
                      handleUpdateQuestion(index, {
                        ...q,
                        prompt: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full text-sm font-medium text-stone-900 border border-stone-200 focus:border-amber-600 rounded-xl p-3 focus:outline-hidden bg-stone-50/50 leading-relaxed font-serif"
                    placeholder="Enter question text..."
                  />
                </div>

                {/* Multiple Choice / True-False Options */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2 pl-2">
                    <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      Options (Select the correct radio):
                    </p>
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = String(q.correctAnswer) === String(optIdx);
                      const letter = String.fromCharCode(65 + optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            isCorrect
                              ? 'bg-emerald-50/60 border-emerald-400'
                              : 'bg-white border-stone-200 hover:border-stone-300'
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
                            className="accent-emerald-700 w-4 h-4 cursor-pointer"
                          />
                          <span
                            className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-700 text-white'
                                : 'bg-stone-100 text-stone-600'
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
                            className="flex-1 text-xs text-stone-800 bg-transparent focus:outline-hidden"
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/80 px-2 py-0.5 rounded">
                              Correct Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer / Essay Model Answer */}
                {(q.type === 'short_answer' || q.type === 'essay') && (
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
                      Model Answer &amp; Grading Rubric
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
                      className="w-full text-xs text-stone-800 bg-white border border-amber-200 rounded-lg p-2 focus:outline-hidden leading-relaxed"
                      placeholder="Specify key criteria, required quotes, and expected literary arguments..."
                    />
                  </div>
                )}

                {/* Explanation and Citation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                      Explanation &amp; Rationale
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
                      className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded p-1.5 focus:outline-hidden"
                      placeholder="Why this answer is correct..."
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center justify-between">
                      <span>Book Citation Quote</span>
                      <span className="text-[9px] text-stone-400">Optional</span>
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
                      className="w-full text-xs text-stone-700 bg-white border border-stone-200 rounded p-1.5 focus:outline-hidden font-serif italic"
                      placeholder="“Exact excerpt quote from chapter...”"
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
