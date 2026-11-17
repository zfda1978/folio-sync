import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Trash2,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Book, Questionnaire, WorkspaceRole } from '../types';
import { estimateReadingTime } from '../utils/textParser';
import { AxisOfIntelligenceMark } from './ZenoxisLogo';

interface LibraryViewProps {
  books: Book[];
  questionnaires: Questionnaire[];
  workspaceRole: WorkspaceRole;
  onSelectBook: (book: Book) => void;
  onOpenImporter: () => void;
  onOpenGeneratorForBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  questionnaires,
  workspaceRole,
  onSelectBook,
  onOpenImporter,
  onOpenGeneratorForBook,
  onDeleteBook,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalQuestions = questionnaires.reduce((acc, q) => acc + q.questions.length, 0);
  const totalWords = books.reduce((acc, b) => acc + (b.totalWords || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Architectural Obsidian Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-[#111D3B] text-[#EDF1FA] border border-[#1E315E] px-6 py-8 sm:px-10 sm:py-10">
        {/* Subtle Geometric Axis Grid Accent */}
        <svg
          className="absolute right-0 top-0 h-full w-80 opacity-[0.07] pointer-events-none"
          viewBox="0 0 320 260"
          fill="none"
          aria-hidden="true"
        >
          <polygon points="160,10 300,130 160,250 20,130" stroke="#EDF1FA" strokeWidth="1.5" />
          <polygon points="160,50 255,130 160,210 65,130" stroke="#51BCA6" strokeWidth="1.2" />
          <line x1="160" y1="0" x2="160" y2="260" stroke="#A9B9D3" strokeWidth="1" />
          <line x1="0" y1="130" x2="320" y2="130" stroke="#A9B9D3" strokeWidth="1" />
        </svg>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 text-xs font-medium tracking-[0.14em] uppercase text-[#A9B9D3]">
              <AxisOfIntelligenceMark className="w-5 h-5" />
              <span>ZENOXIS Library</span>
              <span>·</span>
              <span className="font-serif italic normal-case tracking-normal text-sm text-[#51BCA6]">
                Ancient Wisdom. Future Intelligence.
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Think Beyond Limits.
            </h1>
            <p className="text-sm text-[#A9B9D3] leading-relaxed">
              {workspaceRole === 'teacher'
                ? 'Import PDF, EPUB, and TXT volumes to organize chapters and craft Grades 4–10 logical, rational, critical, and innovative assessments.'
                : 'Explore source-grounded books, read structured chapters, and test your logical reasoning and critical comprehension.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 shrink-0">
            <div className="flex items-center gap-6 text-left">
              <div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-white">
                  {books.length}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[#A9B9D3]">Volumes</div>
              </div>
              <div className="h-8 w-px bg-[#A9B9D3]/25" />
              <div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-white">
                  {questionnaires.length}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[#A9B9D3]">Assessments</div>
              </div>
              <div className="h-8 w-px bg-[#A9B9D3]/25" />
              <div>
                <div className="font-mono tabular-nums text-2xl font-semibold text-[#51BCA6]">
                  {totalQuestions}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[#A9B9D3]">Questions</div>
              </div>
              <div className="hidden sm:block h-8 w-px bg-[#A9B9D3]/25" />
              <div className="hidden sm:block">
                <div className="font-mono tabular-nums text-2xl font-semibold text-white">
                  {totalWords.toLocaleString()}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-[#A9B9D3]">Words Indexed</div>
              </div>
            </div>

            <button
              onClick={onOpenImporter}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import Book</span>
            </button>
          </div>
        </div>
      </section>

      {/* Search & Collection Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#111D3B]">
            Source-Grounded Collection
          </h2>
          <p className="text-xs text-[#111D3B]/60">
            {filteredBooks.length} volume{filteredBooks.length !== 1 ? 's' : ''} ready for reading &amp; inquiry
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#111D3B]/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by title or author..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#A9B9D3]/60 rounded-xl text-[#111D3B] placeholder:text-[#111D3B]/40 focus:ring-2 focus:ring-[#3978E8] focus:border-[#3978E8] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Book Grid */}
      {filteredBooks.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#A9B9D3] space-y-4">
          <div className="w-14 h-14 rounded-xl bg-[#EDF1FA] text-[#3978E8] flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#111D3B]">No Volumes Found</h3>
            <p className="text-xs text-[#111D3B]/65 max-w-sm mx-auto mt-1">
              Import a custom book (.pdf, .epub, .txt, .md) or load a curated classic into ZENOXIS Library.
            </p>
          </div>
          <button
            onClick={onOpenImporter}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-xl inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Import Book</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((b) => {
            const bookQuests = questionnaires.filter(
              (q) => q.bookId === b.id || q.bookTitle.toLowerCase() === b.title.toLowerCase()
            );

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-[#A9B9D3]/50 hover:border-[#3978E8] hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6 space-y-4">
                  {/* Cover & Title */}
                  <div className="flex items-start gap-4">
                    <div
                      onClick={() => onSelectBook(b)}
                      className={`w-14 h-20 rounded-lg bg-gradient-to-br ${
                        b.coverGradient || 'from-[#111D3B] via-[#1D356B] to-[#3978E8]'
                      } flex items-center justify-center text-white shrink-0 font-serif font-bold text-2xl cursor-pointer group-hover:scale-[1.03] transition-transform`}
                    >
                      {b.title[0]}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <h3
                        onClick={() => onSelectBook(b)}
                        className="font-bold text-base text-[#111D3B] group-hover:text-[#3978E8] transition-colors cursor-pointer truncate"
                        title={b.title}
                      >
                        {b.title}
                      </h3>
                      <p className="text-xs text-[#111D3B]/65 font-medium truncate">
                        by {b.author}
                      </p>

                      {/* Clean Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono tabular-nums text-[#111D3B]/55 pt-1">
                        <span>{b.chapters.length} ch</span>
                        <span>·</span>
                        <span>{b.totalWords.toLocaleString()} w</span>
                        <span>·</span>
                        <span>~{estimateReadingTime(b.totalWords)}m</span>
                        {b.sourceFormat && (
                          <>
                            <span>·</span>
                            <span className="uppercase">{b.sourceFormat}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Editorial Excerpt */}
                  {b.analysis?.summary && (
                    <p className="font-serif text-[15px] text-[#111D3B]/75 line-clamp-2 leading-snug">
                      {b.analysis.summary}
                    </p>
                  )}

                  {/* Assessment count as clean inline text */}
                  <div className="pt-1 text-xs font-medium text-[#111D3B]/70 flex items-center justify-between">
                    <span>
                      <span className="font-mono tabular-nums font-semibold text-[#111D3B]">
                        {bookQuests.length}
                      </span>{' '}
                      Assessment{bookQuests.length !== 1 ? 's' : ''}
                    </span>
                    {bookQuests.length > 0 && (
                      <span className="text-[11px] text-[#51BCA6] font-semibold">
                        Ready for Assess &amp; Think
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="px-6 py-3.5 bg-[#EDF1FA]/55 border-t border-[#A9B9D3]/35 flex items-center justify-between">
                  <button
                    onClick={() => onSelectBook(b)}
                    className="text-xs font-semibold text-[#111D3B] hover:text-[#3978E8] flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Open Chapters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenGeneratorForBook(b)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#3978E8] bg-white hover:bg-[#3978E8] hover:text-white border border-[#3978E8]/35 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Generate Questionnaire with ZENOXIS AI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>ZENOXIS AI</span>
                    </button>

                    {books.length > 1 && (
                      <button
                        onClick={() => onDeleteBook(b.id)}
                        className="p-1.5 text-[#111D3B]/40 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Remove Volume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
