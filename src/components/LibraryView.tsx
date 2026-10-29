import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Layers,
  FileText,
  Clock,
  Trash2,
  ArrowRight,
  Search,
} from 'lucide-react';
import { Book, Questionnaire } from '../types';
import { estimateReadingTime } from '../utils/textParser';

interface LibraryViewProps {
  books: Book[];
  questionnaires: Questionnaire[];
  onSelectBook: (book: Book) => void;
  onOpenImporter: () => void;
  onOpenGeneratorForBook: (book: Book) => void;
  onDeleteBook: (bookId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  books,
  questionnaires,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Book Library &amp; Questionnaire Studio
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Import literature, manuscripts, or syllabus readings to prepare interactive questionnaires, quizzes, and Bloom&apos;s assessments.
          </p>
        </div>

        <button
          onClick={onOpenImporter}
          className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Import New Book</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-900">{books.length}</div>
            <div className="text-xs text-stone-500 font-medium">Imported Volumes</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-900">{questionnaires.length}</div>
            <div className="text-xs text-stone-500 font-medium">Prepared Questionnaires</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-stone-900">{totalQuestions}</div>
            <div className="text-xs text-stone-500 font-medium">AI &amp; Custom Questions</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search books by title, author, or keyword..."
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
        />
      </div>

      {/* Book Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-serif font-bold text-stone-900">
          Your Library Collection ({filteredBooks.length})
        </h2>

        {filteredBooks.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-stone-300 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">No Books Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                Import a book using files (.txt, .md), paste text, or load a classic title from our library.
              </p>
            </div>
            <button
              onClick={onOpenImporter}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import a Book Now</span>
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
                  className="bg-white rounded-2xl border border-stone-200 hover:border-amber-500 hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4">
                    {/* Top row with cover & info */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-20 rounded-lg bg-gradient-to-br ${
                          b.coverGradient || 'from-amber-700 to-stone-900'
                        } shadow-md flex items-center justify-center text-white shrink-0 font-serif font-bold text-2xl group-hover:scale-105 transition-transform`}
                      >
                        {b.title[0]}
                      </div>

                      <div className="space-y-1 min-w-0">
                        <h3
                          onClick={() => onSelectBook(b)}
                          className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-800 transition-colors cursor-pointer truncate"
                          title={b.title}
                        >
                          {b.title}
                        </h3>
                        <p className="text-xs text-stone-500 font-medium truncate">by {b.author}</p>

                        <div className="flex items-center gap-2 text-[11px] text-stone-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {b.chapters.length} Ch
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {b.totalWords.toLocaleString()} w
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~{estimateReadingTime(b.totalWords)}m
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Summary excerpt or analysis */}
                    {b.analysis?.summary && (
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {b.analysis.summary}
                      </p>
                    )}

                    {/* Questionnaires count badge */}
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
                        {bookQuests.length} Questionnaire{bookQuests.length !== 1 ? 's' : ''} Prepared
                      </span>
                    </div>
                  </div>

                  {/* Card bottom actions */}
                  <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => onSelectBook(b)}
                      className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1"
                    >
                      <span>Explore &amp; Read</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenGeneratorForBook(b)}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        title="Generate Questionnaire"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>AI Gen</span>
                      </button>

                      {books.length > 1 && (
                        <button
                          onClick={() => onDeleteBook(b.id)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-colors"
                          title="Remove Book"
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
    </div>
  );
};
