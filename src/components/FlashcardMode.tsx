import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCw,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { Book, Question, Questionnaire } from '../types';
import { inferCognitiveDimension } from '../utils/textParser';

interface FlashcardModeProps {
  questionnaire: Questionnaire;
  book: Book;
  masteredIds: string[];
  onToggleMastered: (questionId: string) => void;
  onExit: () => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  questionnaire,
  book,
  masteredIds,
  onToggleMastered,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const total = questionnaire.questions.length;
  const safeIndex = total > 0 ? currentIndex % total : 0;
  const currentQ: Question | undefined = questionnaire.questions[safeIndex];
  const isMastered = currentQ ? masteredIds.includes(currentQ.id) : false;

  const handleNext = useCallback(() => {
    if (total === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [questionnaire.id]);

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
  }, [handleNext, handlePrev]);

  if (!currentQ) return null;

  const getAnswerDisplay = (q: Question) => {
    if (q.options && q.options.length > 0 && !isNaN(Number(q.correctAnswer))) {
      const idx = Number(q.correctAnswer);
      const letter = String.fromCharCode(65 + idx);
      return `${letter}. ${q.options[idx] || q.correctAnswer}`;
    }
    return String(q.correctAnswer);
  };

  const masteredInThisDeck = questionnaire.questions.filter((q) => masteredIds.includes(q.id)).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onExit}
          className="text-xs font-semibold text-[#111D3B]/70 hover:text-[#111D3B] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </button>

        <div className="text-xs font-mono tabular-nums font-semibold text-[#111D3B]/70">
          ZENOXIS Think · {safeIndex + 1}/{total} · {masteredInThisDeck} Mastered
        </div>
      </div>

      {/* Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[380px] bg-white rounded-2xl p-8 border border-[#A9B9D3]/60 hover:border-[#3978E8] shadow-sm cursor-pointer transition-all flex flex-col justify-between relative select-none"
      >
        <div className="flex items-center justify-between text-xs text-[#111D3B]/55">
          <span className="uppercase font-bold tracking-wider text-[11px] text-[#3978E8]">
            {isFlipped ? 'Reasoned Answer' : `${book.title} · Prompt`}
          </span>
          <span className="uppercase font-mono text-[11px] text-[#8174D5]">
            {inferCognitiveDimension(currentQ)} · {currentQ.bloomsLevel}
          </span>
        </div>

        <div className="my-auto py-6">
          {!isFlipped ? (
            <div className="space-y-4">
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#111D3B] leading-relaxed">
                {currentQ.prompt}
              </h3>

              {currentQ.options && currentQ.options.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {currentQ.options.map((opt, i) => (
                    <div key={i} className="text-xs text-[#111D3B]/75 pl-2">
                      <span className="font-mono font-bold text-[#111D3B] mr-2">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#51BCA6]/12 border border-[#51BCA6]/50">
                <span className="text-[10px] uppercase font-bold text-[#2F8A77] tracking-wider block mb-1">
                  Answer Key
                </span>
                <p className="font-serif text-lg font-bold text-[#111D3B]">
                  {getAnswerDisplay(currentQ)}
                </p>
              </div>

              <div className="text-xs text-[#111D3B]/80 leading-relaxed space-y-2">
                <p>
                  <strong className="text-[#111D3B]">Explanation:</strong> {currentQ.explanation}
                </p>
                {currentQ.bookCitation?.quoteSnippet && (
                  <p className="italic font-serif text-sm text-[#111D3B] bg-[#EDF1FA]/60 p-3 rounded-lg border border-[#A9B9D3]/45 flex items-start gap-1.5">
                    <Quote className="w-3.5 h-3.5 shrink-0 text-[#3978E8] mt-0.5" />
                    <span>“{currentQ.bookCitation.quoteSnippet}”</span>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[#111D3B]/45 pt-4 border-t border-[#A9B9D3]/35">
          <span className="flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5" />
            Click or Space to flip
          </span>
          <span className="text-[11px] font-mono">← / → keys</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          className="px-4 py-2.5 text-[#111D3B] bg-white hover:bg-[#EDF1FA] rounded-xl border border-[#A9B9D3]/55 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => onToggleMastered(currentQ.id)}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isMastered
              ? 'bg-[#51BCA6] text-white'
              : 'bg-white text-[#111D3B] hover:bg-[#EDF1FA] border border-[#A9B9D3]/55'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isMastered ? 'Concept Mastered' : 'Mark as Mastered'}</span>
        </button>

        <button
          onClick={handleNext}
          className="px-4 py-2.5 text-[#111D3B] bg-white hover:bg-[#EDF1FA] rounded-xl border border-[#A9B9D3]/55 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
