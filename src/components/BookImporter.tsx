import React, { useState } from 'react';
import { Upload, FileText, BookOpen, Sparkles, X, Check, ArrowRight } from 'lucide-react';
import { Book } from '../types';
import { calculateWordCount, estimateReadingTime, parseChaptersFromText } from '../utils/textParser';
import { SAMPLE_BOOKS } from '../data/sampleBooks';

interface BookImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImportBook: (book: Book) => void;
}

export const BookImporter: React.FC<BookImporterProps> = ({ isOpen, onClose, onImportBook }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'classics'>('upload');

  // Paste / Manual form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setUploadFeedback(`Reading "${file.name}"...`);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Infer title from file name
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanName.replace(/\b\w/g, (c) => c.toUpperCase()));
        setContent(text);
        setUploadFeedback(`File loaded! ${calculateWordCount(text).toLocaleString()} words found.`);
        setActiveTab('paste'); // Switch to preview tab
      } catch (err: any) {
        setUploadFeedback(`Error reading file: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveImportedBook = () => {
    if (!title.trim() || !content.trim()) return;

    const chapters = parseChaptersFromText(content);
    const totalWords = calculateWordCount(content);

    const gradientPresets = [
      'from-amber-700 via-amber-900 to-stone-900',
      'from-emerald-800 via-teal-950 to-stone-900',
      'from-blue-800 via-indigo-950 to-stone-900',
      'from-purple-800 via-violet-950 to-stone-900',
      'from-rose-800 via-red-950 to-stone-900',
    ];
    const randomGradient = gradientPresets[Math.floor(Math.random() * gradientPresets.length)];

    const newBook: Book = {
      id: 'book-' + Date.now(),
      title: title.trim(),
      author: author.trim() || 'Unknown Author',
      coverGradient: randomGradient,
      totalWords,
      chapters,
      createdAt: new Date().toISOString(),
    };

    onImportBook(newBook);
    onClose();
  };

  const handleSelectSample = (sample: Book) => {
    onImportBook(sample);
    onClose();
  };

  const currentWords = calculateWordCount(content);
  const detectedChapters = content ? parseChaptersFromText(content) : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900">Import a Book or Excerpt</h2>
              <p className="text-xs text-stone-500">
                Load full books, chapters, or syllabus texts to generate intelligent questionnaires
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200 px-6 pt-2 bg-stone-50/50">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload File (.txt, .md, .epub)
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Paste Text &amp; Custom Excerpt
          </button>
          <button
            onClick={() => setActiveTab('classics')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'classics'
                ? 'border-amber-600 text-amber-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            Classic Library (Instant)
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label
                htmlFor="book-file-upload"
                className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  Click or drag book files here
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-sm">
                  Supports Plain Text (.txt), Markdown (.md), JSON or EPUB exports. Up to 50MB.
                </p>
                <span className="mt-4 inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-900 text-white shadow-xs">
                  Browse Files on Device
                </span>
                <input
                  id="book-file-upload"
                  type="file"
                  accept=".txt,.md,.json,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadFeedback && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{uploadFeedback}</span>
                </div>
              )}

              <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
                  Tips for Best Questionnaire Results
                </h4>
                <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
                  <li>Include clear chapter headings (e.g. <code>Chapter 1</code> or <code>### Chapter One</code>) for chapter-by-chapter quiz generation.</li>
                  <li>You can also paste excerpts directly using the <strong>Paste Text</strong> tab.</li>
                  <li>Our AI will analyze character interactions, literary devices, quotes, and themes automatically.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Book Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. To Kill a Mockingbird"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Harper Lee"
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Book Content / Chapters / Excerpt <span className="text-rose-500">*</span>
                  </label>
                  {currentWords > 0 && (
                    <span className="text-xs text-stone-500">
                      {currentWords.toLocaleString()} words · ~{estimateReadingTime(currentWords)} min read · {detectedChapters.length} chapter(s) detected
                    </span>
                  )}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={9}
                  placeholder="Paste the book text, single chapter, or full transcript here... (e.g., from Project Gutenberg or your notes)"
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono text-xs leading-relaxed bg-white"
                />
              </div>

              {detectedChapters.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                  <h4 className="text-xs font-bold text-stone-800 mb-1 flex items-center justify-between">
                    <span>Parsed Chapters ({detectedChapters.length})</span>
                    <span className="text-[11px] font-normal text-stone-500">Ready for question scoping</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {detectedChapters.map((ch, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white border border-stone-200 px-2.5 py-1 rounded-md text-stone-700 font-medium"
                      >
                        {ch.title} ({ch.wordCount.toLocaleString()} w)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classics' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-500 mb-2">
                Select any of these public domain masterworks to immediately test question generation, student quiz mode, and printable worksheets:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {SAMPLE_BOOKS.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleSelectSample(b)}
                    className="p-4 rounded-xl border border-stone-200 hover:border-amber-500 hover:shadow-md cursor-pointer transition-all bg-white flex items-start justify-between group"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className={`w-12 h-16 rounded-md bg-gradient-to-br ${b.coverGradient || 'from-stone-700 to-stone-900'} shadow-xs flex items-center justify-center text-white shrink-0 font-serif font-bold text-lg`}>
                        {b.title[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-serif text-stone-900 group-hover:text-amber-800 transition-colors">
                          {b.title}
                        </h4>
                        <p className="text-xs text-stone-500 font-medium">by {b.author}</p>
                        <p className="text-xs text-stone-600 line-clamp-2 mt-1">
                          {b.analysis?.summary}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-500">
                          <span>{b.chapters.length} Chapters</span>
                          <span>·</span>
                          <span>{b.totalWords.toLocaleString()} Words</span>
                          <span>·</span>
                          <span className="text-amber-700 font-medium">{b.analysis?.themes?.length || 0} Themes</span>
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 group-hover:bg-amber-600 group-hover:text-white rounded-lg transition-colors flex items-center gap-1 shrink-0 mt-2">
                      Load Book
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/50 transition-colors"
          >
            Cancel
          </button>

          {activeTab === 'paste' && (
            <button
              onClick={handleSaveImportedBook}
              disabled={!title.trim() || !content.trim() || isProcessing}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save &amp; Open Book</span>
            </button>
          )}

          {activeTab === 'upload' && content && (
            <button
              onClick={() => setActiveTab('paste')}
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-all"
            >
              <span>Review Book Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
