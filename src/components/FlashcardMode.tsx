import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Quote,
  Sparkles,
} from 'lucide-react';
import { Book, Question, Questionnaire } from '../types';

interface FlashcardModeProps {
  questionnaire: Questionnaire;
  book: Book;
  onExit: () => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  questionnaire,
  book,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  const currentQ: Question = questionnaire.questions[currentIndex];
  const total = questionnaire.questions.length;
  const isMastered = masteredIds.includes(currentQ?.id);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, total]);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const toggleMastered = (id: string) => {
    if (masteredIds.includes(id)) {
      setMasteredIds(masteredIds.filter((item) => item !== id));
    } else {
      setMasteredIds([...masteredIds, id]);
    }
  };

  const getAnswerDisplay = (q: Question) => {
    if (q.options && q.options.length > 0 && !isNaN(Number(q.correctAnswer))) {
      const idx = Number(q.correctAnswer);
      const letter = String.fromCharCode(65 + idx);
      return `${letter}. ${q.options[idx] || q.correctAnswer}`;
    }
    return String(q.correctAnswer);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </button>

        <div className="text-xs font-bold text-stone-500">
          Card {currentIndex + 1} of {total} · {masteredIds.length} Mastered
        </div>
      </div>

      {/* Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[380px] bg-white rounded-3xl p-8 border-2 border-stone-200 hover:border-amber-400 shadow-lg cursor-pointer transition-all flex flex-col justify-between relative select-none"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span className="uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-700">
            {isFlipped ? 'Answer &amp; Rationale' : 'Question Prompt'}
          </span>
          <span className="capitalize">{currentQ.bloomsLevel} Level</span>
        </div>

        {/* Card Center Content */}
        <div className="my-auto py-6">
          {!isFlipped ? (
            <div className="space-y-4">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-relaxed">
                {currentQ.prompt}
              </h3>

              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {currentQ.options.map((opt, i) => (
                    <div key={i} className="text-xs text-stone-600 font-sans pl-2">
                      <span className="font-bold text-stone-800 mr-2">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block mb-1">
                  Correct Answer
                </span>
                <p className="font-serif text-lg font-bold text-emerald-950">
                  {getAnswerDisplay(currentQ)}
                </p>
              </div>

              <div className="text-xs text-stone-700 leading-relaxed space-y-2">
                <p>
                  <strong>Explanation:</strong> {currentQ.explanation}
                </p>
                {currentQ.bookCitation?.quoteSnippet && (
                  <p className="italic font-serif text-stone-800 bg-stone-50 p-2.5 rounded-lg border border-stone-200 flex items-start gap-1.5">
                    <Quote className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                    <span>“{currentQ.bookCitation.quoteSnippet}”</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-stone-100">
          <span className="flex items-center gap-1">
            <RotateCw className="w-3.5 h-3.5" />
            Click or Space to flip
          </span>
          <span className="text-[11px] font-sans">
            Use ← and → arrow keys
          </span>
        </div>
      </div>

      {/* Navigation & Mastery Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handlePrev}
          className="p-3 text-stone-700 bg-white hover:bg-stone-100 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => toggleMastered(currentQ.id)}
          className={`px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isMastered
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200 shadow-xs'
          }`}
        >
          <CheckCircle2 className={`w-4 h-4 ${isMastered ? 'text-emerald-700' : 'text-stone-400'}`} />
          <span>{isMastered ? 'Marked as Mastered' : 'Mark as Mastered'}</span>
        </button>

        <button
          onClick={handleNext}
          className="p-3 text-stone-700 bg-white hover:bg-stone-100 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-1.5 text-xs font-semibold"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
