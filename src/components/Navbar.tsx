import React from 'react';
import { BookOpen, Sparkles, Plus, Library, FileText, CheckCircle2, Printer } from 'lucide-react';
import { Book, Questionnaire } from '../types';

interface NavbarProps {
  currentTab: 'library' | 'book' | 'questionnaire' | 'quiz' | 'print' | 'flashcards';
  onSelectTab: (tab: 'library' | 'book' | 'questionnaire' | 'quiz' | 'print' | 'flashcards') => void;
  activeBook: Book | null;
  activeQuestionnaire: Questionnaire | null;
  onOpenImporter: () => void;
  onOpenGenerator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeBook,
  activeQuestionnaire,
  onOpenImporter,
  onOpenGenerator,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onSelectTab('library')}
              className="flex items-center space-x-2 text-stone-900 hover:text-amber-700 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center text-white shadow-sm ring-1 ring-amber-900/10">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-xl font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                  FolioQuest
                  <span className="text-[10px] uppercase font-sans font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    Studio
                  </span>
                </span>
                <p className="text-[11px] text-stone-500 font-sans hidden sm:block">
                  Book Import &amp; Questionnaire Engine
                </p>
              </div>
            </button>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onSelectTab('library')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                currentTab === 'library'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Library className="w-4 h-4" />
              Library
            </button>

            {activeBook && (
              <button
                onClick={() => onSelectTab('book')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 max-w-[200px] truncate ${
                  currentTab === 'book'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
                title={activeBook.title}
              >
                <BookOpen className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="truncate">{activeBook.title}</span>
              </button>
            )}

            {activeQuestionnaire && (
              <>
                <button
                  onClick={() => onSelectTab('questionnaire')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'questionnaire'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Editor
                </button>

                <button
                  onClick={() => onSelectTab('quiz')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'quiz'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Interactive Quiz
                </button>

                <button
                  onClick={() => onSelectTab('print')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'print'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  Print / Exam
                </button>
              </>
            )}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenImporter}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center gap-1.5 border border-stone-200"
            >
              <Plus className="w-4 h-4" />
              <span>Import Book</span>
            </button>

            {activeBook && (
              <button
                onClick={onOpenGenerator}
                className="px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-lg shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span className="font-semibold">AI Generator</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
