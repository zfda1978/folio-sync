import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, Table, Code } from 'lucide-react';
import { Questionnaire } from '../types';
import { downloadFile, exportQuestionnaireToCsv, formatQuestionnaireToMarkdown } from '../utils/textParser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionnaire: Questionnaire;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  questionnaire,
}) => {
  const [includeAnswers, setIncludeAnswers] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadMarkdown = () => {
    const md = formatQuestionnaireToMarkdown(questionnaire, includeAnswers);
    downloadFile(md, `${questionnaire.title.replace(/\s+/g, '_')}.md`, 'text/markdown');
  };

  const handleDownloadCsv = () => {
    const csv = exportQuestionnaireToCsv(questionnaire);
    downloadFile(csv, `${questionnaire.title.replace(/\s+/g, '_')}.csv`, 'text/csv');
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(questionnaire, null, 2);
    downloadFile(jsonStr, `${questionnaire.title.replace(/\s+/g, '_')}.json`, 'application/json');
  };

  const handleCopyMarkdown = () => {
    const md = formatQuestionnaireToMarkdown(questionnaire, includeAnswers);
    navigator.clipboard.writeText(md);
    setCopiedType('markdown');
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900">Export Questionnaire</h3>
              <p className="text-xs text-stone-500">Download formatted files or copy text</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Include answers checkbox */}
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="accent-amber-600 rounded"
            />
            <span>Include Answer Key, Explanations &amp; Citations</span>
          </label>

          {/* Export Options */}
          <div className="space-y-3">
            {/* Markdown option */}
            <div className="p-4 rounded-xl border border-stone-200 hover:border-amber-500 transition-all flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Markdown Document (.md)</h4>
                  <p className="text-[11px] text-stone-500">
                    Perfect for Notion, Obsidian, Google Docs, or GitHub
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="p-2 text-stone-600 hover:bg-stone-200 rounded-lg text-xs flex items-center gap-1 font-semibold"
                  title="Copy to clipboard"
                >
                  {copiedType === 'markdown' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-lg shadow-xs"
                >
                  Download
                </button>
              </div>
            </div>

            {/* CSV option */}
            <div className="p-4 rounded-xl border border-stone-200 hover:border-amber-500 transition-all flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Spreadsheet CSV (.csv)</h4>
                  <p className="text-[11px] text-stone-500">
                    Compatible with Canvas, Google Classroom, Kahoot, Quizlet
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-lg shadow-xs"
              >
                Download
              </button>
            </div>

            {/* JSON option */}
            <div className="p-4 rounded-xl border border-stone-200 hover:border-amber-500 transition-all flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Structured Data (.json)</h4>
                  <p className="text-[11px] text-stone-500">
                    Complete schema with Bloom tags, citations, points
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-lg shadow-xs"
              >
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200/50 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
