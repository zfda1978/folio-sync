import React, { useState, useEffect } from 'react';
import { Printer, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Book, Questionnaire, WorkspaceRole } from '../types';
import { formatAudienceLabel, inferCognitiveDimension } from '../utils/textParser';

interface PrintableWorksheetProps {
  questionnaire: Questionnaire;
  book: Book;
  workspaceRole: WorkspaceRole;
  onBack: () => void;
}

export const PrintableWorksheet: React.FC<PrintableWorksheetProps> = ({
  questionnaire,
  book,
  workspaceRole,
  onBack,
}) => {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(workspaceRole === 'teacher');

  useEffect(() => {
    setIncludeAnswerKey(workspaceRole === 'teacher');
  }, [workspaceRole]);

  const handlePrint = () => {
    window.print();
  };

  const totalPoints = questionnaire.questions.reduce((sum, q) => sum + (q.points || 5), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Control Bar */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-[#A9B9D3]/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#111D3B]/70 hover:text-[#111D3B] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl bg-[#EDF1FA] p-1 border border-[#A9B9D3]/45">
            <button
              onClick={() => setIncludeAnswerKey(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                !includeAnswerKey
                  ? 'bg-[#111D3B] text-white'
                  : 'text-[#111D3B]/70 hover:text-[#111D3B]'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Student Exam</span>
            </button>
            <button
              onClick={() => setIncludeAnswerKey(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                includeAnswerKey
                  ? 'bg-[#111D3B] text-white'
                  : 'text-[#111D3B]/70 hover:text-[#111D3B]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Teacher Answer Key</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#A9B9D3]/60 print:border-none print:p-0 space-y-8">
        <div className="border-b-2 border-[#111D3B] pb-6 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#3978E8] mb-1">
                ZENOXIS Assess · {formatAudienceLabel(questionnaire.targetAudience)}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111D3B] tracking-tight">
                {questionnaire.title}
              </h1>
              <p className="text-sm text-[#111D3B]/70 mt-1">
                Source: <strong className="text-[#111D3B]">{book.title}</strong> by {book.author}
              </p>
            </div>

            {includeAnswerKey && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-[#EDF1FA] text-[#111D3B] border border-[#3978E8]/40 shrink-0">
                Answer Key
              </span>
            )}
          </div>

          {!includeAnswerKey && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 text-[#111D3B]/80">
              <div className="border-b border-[#A9B9D3] pb-1">
                <strong>Student:</strong> _____________________
              </div>
              <div className="border-b border-[#A9B9D3] pb-1">
                <strong>Date:</strong> _______________________
              </div>
              <div className="border-b border-[#A9B9D3] pb-1">
                <strong>Grade / Section:</strong> ____________
              </div>
              <div className="border-b border-[#A9B9D3] pb-1 font-mono tabular-nums">
                <strong>Score:</strong> _____ / {totalPoints}
              </div>
            </div>
          )}

          <div className="text-xs text-[#111D3B]/65">
            Instructions: Reason carefully through each prompt using evidence from the source text. Total Questions: {questionnaire.questions.length} · Total Points: {totalPoints}.
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {questionnaire.questions.map((q, idx) => {
            const dim = inferCognitiveDimension(q);
            return (
              <div key={q.id} className="space-y-3 break-inside-avoid">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-lg font-bold text-[#111D3B] leading-snug">
                    <span className="font-mono text-sm font-semibold text-[#3978E8] mr-2">
                      {idx + 1}.
                    </span>
                    {q.prompt}
                  </h3>
                  <span className="font-mono tabular-nums text-xs text-[#111D3B]/60 shrink-0">
                    ({q.points || 5} pts)
                  </span>
                </div>

                {q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pl-6">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = String(q.correctAnswer) === String(optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg flex items-center gap-2.5 ${
                            includeAnswerKey && isCorrect
                              ? 'bg-[#51BCA6]/15 text-[#111D3B] font-bold border border-[#51BCA6]'
                              : 'text-[#111D3B]/85'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-[#A9B9D3] text-[#111D3B] flex items-center justify-center text-[10px] shrink-0 font-mono font-bold">
                            {letter}
                          </span>
                          <span>{opt}</span>
                          {includeAnswerKey && isCorrect && (
                            <span className="text-[10px] text-[#2F8A77] uppercase font-bold ml-auto">
                              Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="pl-6 space-y-3">
                    {!includeAnswerKey ? (
                      <div className="border border-[#A9B9D3] rounded-lg p-3 h-28 bg-[#EDF1FA]/20 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-dashed border-[#A9B9D3] h-6" />
                          <div className="border-b border-dashed border-[#A9B9D3] h-6" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-[#EDF1FA]/60 border border-[#A9B9D3]/60 rounded-lg text-xs space-y-1">
                        <strong className="text-[#3978E8] uppercase tracking-wider text-[10px] block">
                          Model Reasoning Rubric
                        </strong>
                        <p className="text-[#111D3B] leading-relaxed font-serif text-sm">
                          {String(q.correctAnswer)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {includeAnswerKey && (
                  <div className="ml-6 p-3 rounded-lg bg-[#EDF1FA]/40 border border-[#A9B9D3]/45 text-xs space-y-1 text-[#111D3B]/75">
                    <p>
                      <strong className="text-[#111D3B]">Explanation:</strong> {q.explanation}
                    </p>
                    {q.bookCitation?.quoteSnippet && (
                      <p className="italic font-serif text-sm text-[#111D3B]">
                        Citation: “{q.bookCitation.quoteSnippet}” {q.bookCitation.chapter ? `(${q.bookCitation.chapter})` : ''}
                      </p>
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-[#111D3B]/55 font-mono">
                      Dimension: {dim} · Bloom: {q.bloomsLevel}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#A9B9D3]/50 pt-6 text-center text-[11px] text-[#111D3B]/50">
          ZENOXIS Assess · Think Beyond Limits · {questionnaire.title}
        </div>
      </div>
    </div>
  );
};
