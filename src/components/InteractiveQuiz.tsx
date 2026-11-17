import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Quote,
  Loader2,
  Clock,
} from 'lucide-react';
import {
  AnswerEvaluation,
  Book,
  Question,
  Questionnaire,
  QuizAttempt,
  UserAnswerRecord,
} from '../types';
import { apiEvaluateAnswer } from '../services/api';
import { inferCognitiveDimension } from '../utils/textParser';

interface InteractiveQuizProps {
  questionnaire: Questionnaire;
  book: Book;
  onExit: () => void;
  onAttemptCompleted?: (attempt: QuizAttempt) => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  questionnaire,
  book,
  onExit,
  onAttemptCompleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    setUserAnswers({});
    setAiEvaluations({});
    setIsSubmitted(false);
    setSecondsElapsed(0);
  }, [questionnaire.id]);

  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted]);

  const currentQ = questionnaire.questions[currentIndex];
  const totalQuestions = questionnaire.questions.length;
  const currentAnswer = userAnswers[currentQ?.id] ?? '';

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers({
      ...userAnswers,
      [currentQ.id]: String(optionIndex),
    });
  };

  const handleTextAnswerChange = (val: string) => {
    if (isSubmitted) return;
    setUserAnswers({
      ...userAnswers,
      [currentQ.id]: val,
    });
  };

  const handleEvaluateAi = async () => {
    if (!currentAnswer.trim() || isEvaluatingAi) return;
    setIsEvaluatingAi(true);
    setEvaluationError(null);

    try {
      const bookContext = book.chapters.map((c) => c.content).join('\n\n');
      const evalResult = await apiEvaluateAnswer({
        questionPrompt: currentQ.prompt,
        studentAnswer: currentAnswer,
        modelAnswer: String(currentQ.correctAnswer),
        explanation: currentQ.explanation,
        bookContext,
      });

      setAiEvaluations({
        ...aiEvaluations,
        [currentQ.id]: evalResult,
      });
    } catch (err: any) {
      console.error(err);
      setEvaluationError(err.message || 'AI evaluation failed. Please try again.');
    } finally {
      setIsEvaluatingAi(false);
    }
  };

  const computeResults = () => {
    let earnedScore = 0;
    let totalPossibleScore = 0;
    const answerRecords: Record<string, UserAnswerRecord> = {};

    questionnaire.questions.forEach((q) => {
      const qPoints = q.points || 5;
      totalPossibleScore += qPoints;
      const ans = userAnswers[q.id] ?? '';

      if (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'quote_identification') {
        const isCorrect = String(ans) === String(q.correctAnswer);
        const pts = isCorrect ? qPoints : 0;
        earnedScore += pts;
        answerRecords[q.id] = {
          questionId: q.id,
          answer: ans,
          isCorrect,
          scoreEarned: pts,
        };
      } else {
        const aiEval = aiEvaluations[q.id];
        let pts = 0;
        let isCorrect = false;
        if (aiEval) {
          const ratio = Math.max(0, Math.min(5, aiEval.score)) / 5;
          pts = Math.round(ratio * qPoints);
          isCorrect = aiEval.isPassing;
        }
        earnedScore += pts;
        answerRecords[q.id] = {
          questionId: q.id,
          answer: ans,
          isCorrect,
          scoreEarned: pts,
          aiEvaluation: aiEval,
        };
      }
    });

    const percentage = totalPossibleScore > 0 ? Math.round((earnedScore / totalPossibleScore) * 100) : 0;
    return { earnedScore, totalPossibleScore, percentage, answerRecords };
  };

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    const { earnedScore, totalPossibleScore, percentage, answerRecords } = computeResults();

    if (onAttemptCompleted) {
      onAttemptCompleted({
        id: `attempt-${Date.now()}`,
        questionnaireId: questionnaire.id,
        questionnaireTitle: questionnaire.title,
        bookTitle: book.title,
        date: new Date().toISOString(),
        score: earnedScore,
        totalPoints: totalPossibleScore,
        percentage,
        timeSpentSeconds: secondsElapsed,
        answers: answerRecords,
      });
    }

    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#3978E8', '#51BCA6', '#8174D5', '#EDF1FA'],
      });
    } catch {
      // ignore
    }
  };

  const handleRetake = () => {
    setUserAnswers({});
    setAiEvaluations({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setSecondsElapsed(0);
  };

  const { earnedScore, totalPossibleScore, percentage } = computeResults();

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentQ) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Assessment Top Bar */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-[#A9B9D3]/50">
        <div className="min-w-0">
          <h2 className="font-bold text-base text-[#111D3B] truncate max-w-md">
            {questionnaire.title}
          </h2>
          <p className="text-xs text-[#111D3B]/60">
            ZENOXIS Assess · <span className="font-semibold text-[#111D3B]">{book.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-[#111D3B]/75 shrink-0">
          <span className="flex items-center gap-1.5 font-mono tabular-nums text-[#111D3B]">
            <Clock className="w-3.5 h-3.5 text-[#3978E8]" />
            {formatTimer(secondsElapsed)}
          </span>
          <button
            onClick={onExit}
            className="text-[#111D3B]/60 hover:text-[#111D3B] text-xs font-semibold cursor-pointer"
          >
            Exit
          </button>
        </div>
      </div>

      {isSubmitted ? (
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#A9B9D3]/55 space-y-8">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#111D3B] text-[#51BCA6] flex items-center justify-center mx-auto">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#111D3B]">
              Assessment Complete
            </h2>
            <p className="text-sm text-[#111D3B]/65 max-w-md mx-auto">
              Completed in <span className="font-mono tabular-nums font-semibold text-[#111D3B]">{formatTimer(secondsElapsed)}</span> and recorded to ZENOXIS Insight.
            </p>

            <div className="pt-3 flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-4xl font-mono tabular-nums font-bold text-[#3978E8]">
                  {percentage}%
                </div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#111D3B]/50 mt-1">
                  Accuracy
                </div>
              </div>
              <div className="h-10 w-px bg-[#A9B9D3]/50" />
              <div className="text-center">
                <div className="text-4xl font-mono tabular-nums font-bold text-[#111D3B]">
                  {earnedScore}{' '}
                  <span className="text-xl font-normal text-[#111D3B]/45">/ {totalPossibleScore}</span>
                </div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-[#111D3B]/50 mt-1">
                  Points
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleRetake}
              className="px-5 py-2.5 text-xs font-semibold text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/35 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Assessment</span>
            </button>
            <button
              onClick={onExit}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-[#111D3B] hover:bg-[#1E315E] rounded-xl transition-colors cursor-pointer"
            >
              Return to Studio
            </button>
          </div>

          {/* Detailed Review */}
          <div className="border-t border-[#A9B9D3]/45 pt-8 space-y-5">
            <h3 className="font-bold text-lg text-[#111D3B]">
              Reasoning Review &amp; Citations
            </h3>

            <div className="space-y-4">
              {questionnaire.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isMcq =
                  q.type === 'multiple_choice' ||
                  q.type === 'true_false' ||
                  q.type === 'quote_identification';
                const isCorrect = isMcq
                  ? String(userAns) === String(q.correctAnswer)
                  : aiEvaluations[q.id]?.isPassing;
                const aiEval = aiEvaluations[q.id];
                const dim = inferCognitiveDimension(q);

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border ${
                      isCorrect
                        ? 'bg-[#51BCA6]/8 border-[#51BCA6]/50'
                        : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-[#51BCA6] shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-bold text-[#111D3B]">Question {idx + 1}</span>
                        <span className="text-[#A9B9D3]">·</span>
                        <span className="uppercase text-[11px] font-semibold text-[#8174D5]">
                          {dim}
                        </span>
                        <span className="text-[#A9B9D3]">·</span>
                        <span className="uppercase text-[11px] text-[#111D3B]/55">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold text-[#111D3B]/70">
                        {q.points || 5} pts
                      </span>
                    </div>

                    <p className="font-serif text-base font-semibold text-[#111D3B] mb-3">
                      {q.prompt}
                    </p>

                    {isMcq && q.options && (
                      <div className="space-y-1.5 text-xs mb-3">
                        {q.options.map((opt, optIdx) => {
                          const isOptCorrect = String(optIdx) === String(q.correctAnswer);
                          const isOptSelected = String(optIdx) === String(userAns);
                          const letter = String.fromCharCode(65 + optIdx);

                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg flex items-center justify-between ${
                                isOptCorrect
                                  ? 'bg-[#51BCA6]/20 text-[#111D3B] font-semibold'
                                  : isOptSelected
                                  ? 'bg-rose-100/80 text-rose-950'
                                  : 'text-[#111D3B]/70'
                              }`}
                            >
                              <span>
                                {letter}. {opt}
                              </span>
                              {isOptCorrect && (
                                <span className="text-[10px] uppercase font-bold text-[#2F8A77]">
                                  Correct
                                </span>
                              )}
                              {!isOptCorrect && isOptSelected && (
                                <span className="text-[10px] uppercase font-bold text-rose-800">
                                  Selected
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {!isMcq && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-[#A9B9D3]/45">
                          <span className="text-[10px] font-bold uppercase text-[#111D3B]/50 block mb-1">
                            Your Response
                          </span>
                          <p className="font-serif text-sm text-[#111D3B] italic">
                            {userAns || 'No response submitted'}
                          </p>
                        </div>

                        {aiEval && (
                          <div className="p-3.5 bg-[#EDF1FA] border border-[#8174D5]/35 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-[#111D3B]">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#8174D5]" />
                                ZENOXIS AI Score: {aiEval.score} / 5
                              </span>
                              <span className={aiEval.isPassing ? 'text-[#2F8A77]' : 'text-[#8174D5]'}>
                                {aiEval.isPassing ? 'Strong Reasoning' : 'Needs Development'}
                              </span>
                            </div>
                            <p className="text-xs text-[#111D3B]/80 leading-relaxed">{aiEval.feedback}</p>
                            <p className="text-[11px] text-[#111D3B]">
                              <strong>Strengths:</strong> {aiEval.strengths}
                            </p>
                            {aiEval.exemplarTip && (
                              <p className="text-[11px] text-[#111D3B]/70">
                                <strong>Next Step:</strong> {aiEval.exemplarTip}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="p-3 rounded-xl bg-white/90 border border-[#A9B9D3]/40 text-xs space-y-1.5">
                      <p className="text-[#111D3B]/80">
                        <strong className="text-[#111D3B]">Explanation:</strong> {q.explanation}
                      </p>
                      {q.bookCitation?.quoteSnippet && (
                        <p className="text-[#111D3B]/75 italic font-serif text-sm flex items-start gap-1.5">
                          <Quote className="w-3.5 h-3.5 shrink-0 text-[#3978E8] mt-1" />
                          <span>“{q.bookCitation.quoteSnippet}”</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#A9B9D3]/55 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[#111D3B]/70">
              <span className="uppercase tracking-wider font-semibold">
                Question {currentIndex + 1} / {totalQuestions}
              </span>
              <span>{currentQ.points || 5} pts</span>
            </div>
            <div className="w-full h-1.5 bg-[#EDF1FA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3978E8] transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#111D3B]/60">
              <span className="text-[#8174D5]">{inferCognitiveDimension(currentQ)}</span>
              <span>·</span>
              <span>{currentQ.type.replace('_', ' ')}</span>
              <span>·</span>
              <span>Bloom: {currentQ.bloomsLevel}</span>
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#111D3B] leading-snug">
              {currentQ.prompt}
            </h3>
          </div>

          {currentQ.options && currentQ.options.length > 0 ? (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = String(currentAnswer) === String(optIdx);
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-[#3978E8] bg-[#EDF1FA] text-[#111D3B] font-semibold ring-1 ring-[#3978E8]'
                        : 'border-[#A9B9D3]/55 bg-white text-[#111D3B]/85 hover:border-[#3978E8]/60 hover:bg-[#EDF1FA]/40'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#3978E8] text-white'
                          : 'bg-[#EDF1FA] text-[#111D3B]'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="text-xs sm:text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#111D3B]/75">
                Construct a reasoned response supported by evidence from {book.title}:
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                rows={4}
                placeholder="Write your reasoned analysis here..."
                className="w-full p-3.5 text-sm border border-[#A9B9D3] rounded-xl focus:ring-2 focus:ring-[#3978E8] focus:outline-hidden font-serif leading-relaxed text-[#111D3B]"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleEvaluateAi}
                  disabled={!currentAnswer.trim() || isEvaluatingAi}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#8174D5] hover:bg-[#6D5EC4] disabled:opacity-50 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isEvaluatingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Evaluate with ZENOXIS AI</span>
                    </>
                  )}
                </button>
              </div>

              {evaluationError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                  {evaluationError}
                </div>
              )}

              {aiEvaluations[currentQ.id] && (
                <div className="p-4 bg-[#EDF1FA] border border-[#8174D5]/40 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#111D3B]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#8174D5]" />
                      ZENOXIS AI Score: {aiEvaluations[currentQ.id].score} / 5
                    </span>
                    <span className={aiEvaluations[currentQ.id].isPassing ? 'text-[#2F8A77]' : 'text-[#8174D5]'}>
                      {aiEvaluations[currentQ.id].isPassing ? 'Strong Analysis' : 'Add Evidence'}
                    </span>
                  </div>
                  <p className="text-[#111D3B]/80 leading-relaxed">
                    {aiEvaluations[currentQ.id].feedback}
                  </p>
                  <p className="text-[#111D3B]">
                    <strong>Strengths:</strong> {aiEvaluations[currentQ.id].strengths}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-[#A9B9D3]/40">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-[#111D3B]/70 hover:text-[#111D3B] disabled:opacity-30 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#111D3B] hover:bg-[#1E315E] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#51BCA6] hover:bg-[#3FA590] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Submit &amp; Record Score</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
