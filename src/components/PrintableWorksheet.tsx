import React, { useState } from 'react';
import { Printer, Eye, EyeOff, ArrowLeft, BookOpen, Check } from 'lucide-react';
import { Book, Questionnaire } from '../types';

interface PrintableWorksheetProps {
  questionnaire: Questionnaire;
  book: Book;
  onBack: () => void;
}

export const PrintableWorksheet: React.FC<PrintableWorksheetProps> = ({
  questionnaire,
  book,
  onBack,
}) => {
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const totalPoints = questionnaire.questions.reduce((sum, q) => sum + (q.points || 5), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Control Bar (hidden in print) */}
      <div className="print:hidden bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Studio</span>
        </button>

        <div className="flex items-center gap-3">
          {/* Toggle between student and teacher version */}
          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200">
            <button
              onClick={() => setIncludeAnswerKey(false)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                !includeAnswerKey
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Student Worksheet</span>
            </button>
            <button
              onClick={() => setIncludeAnswerKey(true)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                includeAnswerKey
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Teacher Answer Key</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard Paper Layout) */}
      <div className="bg-white rounded-2xl p-8 sm:p-12 border border-stone-300 shadow-md print:shadow-none print:border-none print:p-0 space-y-8 font-serif">
        {/* Academic Header */}
        <div className="border-b-2 border-stone-900 pb-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-950 tracking-tight">
                {questionnaire.title}
              </h1>
              <p className="text-sm text-stone-600 font-sans mt-1">
                Text: <strong className="text-stone-900">{book.title}</strong> by {book.author}
              </p>
            </div>

            {includeAnswerKey && (
              <span className="font-sans text-xs font-bold uppercase tracking-wider px-3 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Teacher Answer Key
              </span>
            )}
          </div>

          {/* Student fillable info header */}
          {!includeAnswerKey && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans text-xs pt-3 text-stone-700">
              <div className="border-b border-stone-400 pb-1">
                <strong>Name:</strong> ______________________
              </div>
              <div className="border-b border-stone-400 pb-1">
                <strong>Date:</strong> ______________________
              </div>
              <div className="border-b border-stone-400 pb-1">
                <strong>Class / Period:</strong> ____________
              </div>
              <div className="border-b border-stone-400 pb-1">
                <strong>Score:</strong> ______ / {totalPoints}
              </div>
            </div>
          )}

          <div className="font-sans text-xs text-stone-500 italic">
            Instructions: Answer each question thoughtfully based on your reading of the text. Provide direct textual evidence where requested. Total Questions: {questionnaire.questions.length} · Total Points: {totalPoints}.
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-8">
          {questionnaire.questions.map((q, idx) => {
            return (
              <div key={q.id} className="space-y-3 break-inside-avoid">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-base font-bold text-stone-900 leading-snug">
                    <span className="font-sans text-sm font-semibold text-stone-600 mr-2">
                      {idx + 1}.
                    </span>
                    {q.prompt}
                  </h3>
                  <span className="font-sans text-xs font-medium text-stone-500 shrink-0">
                    ({q.points || 5} pts)
                  </span>
                </div>

                {/* Multiple choice options */}
                {q.options && q.options.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-sans text-xs pl-6">
                    {q.options.map((opt, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = String(q.correctAnswer) === String(optIdx);

                      return (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg flex items-center gap-2.5 ${
                            includeAnswerKey && isCorrect
                              ? 'bg-amber-50 text-amber-950 font-bold border border-amber-300'
                              : 'text-stone-800'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full border border-stone-400 text-stone-600 flex items-center justify-center text-[10px] shrink-0 font-bold">
                            {letter}
                          </span>
                          <span>{opt}</span>
                          {includeAnswerKey && isCorrect && (
                            <span className="text-[10px] text-amber-800 uppercase font-bold ml-auto">
                              (Correct)
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Written / Short Answer Lines */
                  <div className="pl-6 space-y-3">
                    {!includeAnswerKey ? (
                      <div className="border border-stone-300 rounded-lg p-3 h-28 bg-stone-50/30 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-dashed border-stone-300 h-6" />
                          <div className="border-b border-dashed border-stone-300 h-6" />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg font-sans text-xs space-y-1">
                        <strong className="text-amber-950 uppercase tracking-wider text-[10px] block">
                          Model Rubric:
                        </strong>
                        <p className="text-stone-800 leading-relaxed font-serif">
                          {String(q.correctAnswer)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Teacher Explanation & Citation (only shown when answer key is ON) */}
                {includeAnswerKey && (
                  <div className="pl-6 pt-1 font-sans text-xs space-y-1 text-stone-600 border-l-2 border-amber-500 ml-6 pl-3">
                    <p>
                      <strong className="text-stone-900">Explanation:</strong> {q.explanation}
                    </p>
                    {q.bookCitation?.quoteSnippet && (
                      <p className="italic font-serif text-stone-800">
                        Quote Citation: “{q.bookCitation.quoteSnippet}” {q.bookCitation.chapter ? `(${q.bookCitation.chapter})` : ''}
                      </p>
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">
                      Bloom’s Level: {q.bloomsLevel}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-300 pt-6 text-center font-sans text-[11px] text-stone-400">
          Generated with FolioQuest · {questionnaire.title} · Page 1
        </div>
      </div>
    </div>
  );
};
