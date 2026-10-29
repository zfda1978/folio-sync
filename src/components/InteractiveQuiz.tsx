import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  BookOpen,
  Quote,
  Loader2,
  Clock,
} from 'lucide-react';
import { AnswerEvaluation, Book, Question, Questionnaire } from '../types';
import { apiEvaluateAnswer } from '../services/api';

interface InteractiveQuizProps {
  questionnaire: Questionnaire;
  book: Book;
  onExit: () => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  questionnaire,
  book,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [aiEvaluations, setAiEvaluations] = useState<Record<string, AnswerEvaluation>>({});
  const [isEvaluatingAi, setIsEvaluatingAi] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Timer
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

  const handleSubmitQuiz = () => {
    setIsSubmitted(true);
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
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

  // Compute final score
  let earnedScore = 0;
  let totalPossibleScore = 0;

  questionnaire.questions.forEach((q) => {
    const qPoints = q.points || 5;
    totalPossibleScore += qPoints;

    const ans = userAnswers[q.id];
    if (q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'quote_identification') {
      if (String(ans) === String(q.correctAnswer)) {
        earnedScore += qPoints;
      }
    } else {
      // Free text / essay: Use AI evaluation score (0-5 normalized to question points)
      const aiEval = aiEvaluations[q.id];
      if (aiEval) {
        const ratio = Math.max(0, Math.min(5, aiEval.score)) / 5;
        earnedScore += Math.round(ratio * qPoints);
      }
    }
  });

  const percentage = totalPossibleScore > 0 ? Math.round((earnedScore / totalPossibleScore) * 100) : 0;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner / Navigation */}
      <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="font-serif font-bold text-base text-stone-900 truncate max-w-md">
            {questionnaire.title}
          </h2>
          <p className="text-xs text-stone-500">
            Book: <span className="font-semibold text-stone-700">{book.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
          <span className="flex items-center gap-1.5 bg-stone-100 px-3 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            {formatTimer(secondsElapsed)}
          </span>
          <button
            onClick={onExit}
            className="text-stone-500 hover:text-stone-800 text-xs font-semibold"
          >
            Exit Quiz
          </button>
        </div>
      </div>

      {isSubmitted ? (
        /* Results Screen */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-lg space-y-8 animate-in fade-in">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-10 h-10" />
            </div>
            <h2 className="font-serif text-3xl font-bold text-stone-900">
              Quiz Completed!
            </h2>
            <p className="text-sm text-stone-500 max-w-md mx-auto">
              You finished the questionnaire in <span className="font-semibold text-stone-700">{formatTimer(secondsElapsed)}</span>.
            </p>

            <div className="pt-2 flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-serif font-extrabold text-amber-700">
                  {percentage}%
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-stone-400 mt-0.5">
                  Accuracy Score
                </div>
              </div>
              <div className="h-10 w-px bg-stone-200" />
              <div className="text-center">
                <div className="text-4xl font-serif font-extrabold text-stone-900">
                  {earnedScore} <span className="text-xl font-normal text-stone-400">/ {totalPossibleScore}</span>
                </div>
                <div className="text-xs uppercase tracking-wider font-semibold text-stone-400 mt-0.5">
                  Points Earned
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleRetake}
              className="px-5 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>
            <button
              onClick={onExit}
              className="px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Back to Studio
            </button>
          </div>

          {/* Detailed Question Review */}
          <div className="border-t border-stone-200 pt-8 space-y-6">
            <h3 className="font-serif font-bold text-xl text-stone-900">
              Detailed Answer Review &amp; Rationale
            </h3>

            <div className="space-y-4">
              {questionnaire.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isMcq = q.type === 'multiple_choice' || q.type === 'true_false' || q.type === 'quote_identification';
                const isCorrect = isMcq ? String(userAns) === String(q.correctAnswer) : aiEvaluations[q.id]?.isPassing;
                const aiEval = aiEvaluations[q.id];

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCorrect ? 'bg-emerald-50/30 border-emerald-300' : 'bg-rose-50/30 border-rose-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )}
                        <span className="font-serif font-bold text-sm text-stone-900">
                          Question {idx + 1}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white text-stone-600 border border-stone-200">
                          {q.type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-stone-600 font-mono">
                        {q.points || 5} pts
                      </span>
                    </div>

                    <p className="font-serif text-sm font-medium text-stone-800 mb-3">
                      {q.prompt}
                    </p>

                    {/* Multiple choice feedback */}
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
                                  ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                                  : isOptSelected
                                  ? 'bg-rose-100/70 text-rose-950'
                                  : 'text-stone-600'
                              }`}
                            >
                              <span>
                                {letter}. {opt}
                              </span>
                              {isOptCorrect && (
                                <span className="text-[10px] uppercase font-bold text-emerald-800">
                                  Correct Answer
                                </span>
                              )}
                              {!isOptCorrect && isOptSelected && (
                                <span className="text-[10px] uppercase font-bold text-rose-800">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Free text / AI Evaluation feedback */}
                    {!isMcq && (
                      <div className="space-y-2 mb-3 text-xs">
                        <div className="p-3 bg-white rounded-xl border border-stone-200">
                          <span className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                            Your Written Response:
                          </span>
                          <p className="text-stone-800 italic">{userAns || 'No answer submitted'}</p>
                        </div>

                        {aiEval && (
                          <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                AI Literature Grading: {aiEval.score} / 5
                              </span>
                              <span>{aiEval.isPassing ? 'Passing Analysis' : 'Needs Development'}</span>
                            </div>
                            <p className="text-xs text-stone-700 leading-relaxed">{aiEval.feedback}</p>
                            <p className="text-[11px] text-amber-900">
                              <strong>Strengths:</strong> {aiEval.strengths}
                            </p>
                            {aiEval.exemplarTip && (
                              <p className="text-[11px] text-stone-600">
                                <strong>Tip to Improve:</strong> {aiEval.exemplarTip}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Teacher explanation & Citation */}
                    <div className="p-3 rounded-xl bg-white/80 border border-stone-200 text-xs space-y-1.5">
                      <p className="text-stone-700">
                        <strong className="text-stone-900">Explanation:</strong> {q.explanation}
                      </p>
                      {q.bookCitation?.quoteSnippet && (
                        <p className="text-stone-600 italic font-serif flex items-start gap-1.5">
                          <Quote className="w-3.5 h-3.5 shrink-0 text-amber-700 mt-0.5" />
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
        /* Active Quiz Question Card */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-md space-y-6">
          {/* Progress header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600">
              <span className="uppercase tracking-wider">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="font-mono">{qPointsLabel(currentQ)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                {currentQ.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                Bloom: {currentQ.bloomsLevel}
              </span>
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-snug">
              {currentQ.prompt}
            </h3>
          </div>

          {/* Question Inputs */}
          {currentQ.options && currentQ.options.length > 0 ? (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = String(currentAnswer) === String(optIdx);
                const letter = String.fromCharCode(65 + optIdx);

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-semibold ring-1 ring-amber-600 shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50/50'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-amber-700 text-white'
                          : 'bg-stone-100 text-stone-600'
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
              <label className="block text-xs font-semibold text-stone-600">
                Write your analytical response (cite evidence from {book.title}):
              </label>
              <textarea
                value={currentAnswer}
                onChange={(e) => handleTextAnswerChange(e.target.value)}
                rows={4}
                placeholder="Type your response here..."
                className="w-full p-3.5 text-xs sm:text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-serif leading-relaxed"
              />

              {/* AI Realtime Evaluation Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleEvaluateAi}
                  disabled={!currentAnswer.trim() || isEvaluatingAi}
                  className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 rounded-xl border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isEvaluatingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Grading response with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Evaluate My Answer with AI</span>
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
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      AI Score: {aiEvaluations[currentQ.id].score} / 5
                    </span>
                    <span>{aiEvaluations[currentQ.id].isPassing ? 'Passing Analysis ✓' : 'Needs More Evidence'}</span>
                  </div>
                  <p className="text-stone-700 leading-relaxed">
                    {aiEvaluations[currentQ.id].feedback}
                  </p>
                  <p className="text-stone-800">
                    <strong>Strengths:</strong> {aiEvaluations[currentQ.id].strengths}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 disabled:opacity-30 rounded-xl flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Submit Quiz &amp; Grade</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function qPointsLabel(q: Question) {
  return `${q.points || 5} points`;
}
