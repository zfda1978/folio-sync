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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#111D3B]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#A9B9D3]/60 overflow-hidden">
        <div className="px-6 py-5 bg-[#EDF1FA]/70 border-b border-[#A9B9D3]/50 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111D3B] text-[#51BCA6] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#111D3B]">Export ZENOXIS Assessment</h3>
              <p className="text-xs text-[#111D3B]/65">Download structured formats or copy Markdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#111D3B]/50 hover:text-[#111D3B] p-1.5 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-[#111D3B] cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnswers}
              onChange={(e) => setIncludeAnswers(e.target.checked)}
              className="accent-[#3978E8] rounded"
            />
            <span>Include Answer Key, Explanations &amp; Citations</span>
          </label>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-[#A9B9D3]/50 hover:border-[#3978E8] transition-all flex items-center justify-between bg-[#EDF1FA]/35">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#3978E8]/15 text-[#3978E8] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111D3B]">Markdown Document (.md)</h4>
                  <p className="text-[11px] text-[#111D3B]/60">
                    For Notion, Obsidian, Docs, or coursework repos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="p-2 text-[#111D3B]/70 hover:bg-white rounded-lg text-xs flex items-center gap-1 font-semibold cursor-pointer"
                  title="Copy Markdown"
                >
                  {copiedType === 'markdown' ? (
                    <Check className="w-4 h-4 text-[#51BCA6]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="px-3 py-1.5 text-xs font-semibold bg-[#111D3B] text-white hover:bg-[#1E315E] rounded-lg cursor-pointer"
                >
                  Download
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#A9B9D3]/50 hover:border-[#3978E8] transition-all flex items-center justify-between bg-[#EDF1FA]/35">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#51BCA6]/15 text-[#2F8A77] flex items-center justify-center">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111D3B]">Spreadsheet CSV (.csv)</h4>
                  <p className="text-[11px] text-[#111D3B]/60">
                    Compatible with LMS &amp; Gradebook workflows
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadCsv}
                className="px-3 py-1.5 text-xs font-semibold bg-[#111D3B] text-white hover:bg-[#1E315E] rounded-lg cursor-pointer"
              >
                Download
              </button>
            </div>

            <div className="p-4 rounded-xl border border-[#A9B9D3]/50 hover:border-[#3978E8] transition-all flex items-center justify-between bg-[#EDF1FA]/35">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#8174D5]/15 text-[#8174D5] flex items-center justify-center">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111D3B]">Structured JSON (.json)</h4>
                  <p className="text-[11px] text-[#111D3B]/60">
                    Full schema with cognitive dimensions &amp; citations
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 text-xs font-semibold bg-[#111D3B] text-white hover:bg-[#1E315E] rounded-lg cursor-pointer"
              >
                Download
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#EDF1FA]/60 border-t border-[#A9B9D3]/45 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#111D3B]/75 hover:bg-white rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
