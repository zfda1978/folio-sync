/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LibraryView } from './components/LibraryView';
import { BookOverview } from './components/BookOverview';
import { QuestionnaireEditor } from './components/QuestionnaireEditor';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { PrintableWorksheet } from './components/PrintableWorksheet';
import { FlashcardMode } from './components/FlashcardMode';
import { BookImporter } from './components/BookImporter';
import { QuestionnaireGeneratorModal } from './components/QuestionnaireGeneratorModal';
import { ExportModal } from './components/ExportModal';
import { Book, Questionnaire } from './types';
import { INITIAL_QUESTIONNAIRES, SAMPLE_BOOKS } from './data/sampleBooks';

export default function App() {
  // Books state with localStorage persistence
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem('folioquest_books');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load books from localStorage', e);
    }
    return SAMPLE_BOOKS;
  });

  // Questionnaires state with localStorage persistence
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>(() => {
    try {
      const saved = localStorage.getItem('folioquest_questionnaires');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load questionnaires from localStorage', e);
    }
    return INITIAL_QUESTIONNAIRES;
  });

  const [activeBookId, setActiveBookId] = useState<string>(SAMPLE_BOOKS[0]?.id || '');
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string>(
    INITIAL_QUESTIONNAIRES[0]?.id || ''
  );

  const [currentTab, setCurrentTab] = useState<
    'library' | 'book' | 'questionnaire' | 'quiz' | 'print' | 'flashcards'
  >('book');

  // Modals state
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('folioquest_books', JSON.stringify(books));
    } catch (e) {
      console.warn(e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('folioquest_questionnaires', JSON.stringify(questionnaires));
    } catch (e) {
      console.warn(e);
    }
  }, [questionnaires]);

  const activeBook = books.find((b) => b.id === activeBookId) || books[0] || null;
  const activeQuestionnaire =
    questionnaires.find((q) => q.id === activeQuestionnaireId) ||
    questionnaires.find((q) => q.bookId === activeBook?.id) ||
    questionnaires[0] ||
    null;

  const handleImportBook = (newBook: Book) => {
    setBooks((prev) => [newBook, ...prev]);
    setActiveBookId(newBook.id);
    setCurrentTab('book');
  };

  const handleUpdateBook = (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
  };

  const handleDeleteBook = (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (activeBookId === bookId) {
      const remaining = books.filter((b) => b.id !== bookId);
      if (remaining.length > 0) {
        setActiveBookId(remaining[0].id);
      }
    }
  };

  const handleQuestionnaireCreated = (newQ: Questionnaire) => {
    setQuestionnaires((prev) => [newQ, ...prev]);
    setActiveQuestionnaireId(newQ.id);
    setCurrentTab('questionnaire');
  };

  const handleUpdateQuestionnaire = (updatedQ: Questionnaire) => {
    setQuestionnaires((prev) => prev.map((q) => (q.id === updatedQ.id ? updatedQ : q)));
  };

  const handleSelectBook = (book: Book) => {
    setActiveBookId(book.id);
    // Find if there is an existing questionnaire for this book
    const existing = questionnaires.find(
      (q) => q.bookId === book.id || q.bookTitle.toLowerCase() === book.title.toLowerCase()
    );
    if (existing) {
      setActiveQuestionnaireId(existing.id);
    }
    setCurrentTab('book');
  };

  const handleSelectQuestionnaire = (q: Questionnaire) => {
    setActiveQuestionnaireId(q.id);
    const relatedBook = books.find(
      (b) => b.id === q.bookId || b.title.toLowerCase() === q.bookTitle.toLowerCase()
    );
    if (relatedBook) {
      setActiveBookId(relatedBook.id);
    }
    setCurrentTab('questionnaire');
  };

  const handleTakeQuiz = (q: Questionnaire) => {
    setActiveQuestionnaireId(q.id);
    setCurrentTab('quiz');
  };

  const handleOpenGeneratorForBook = (book: Book) => {
    setActiveBookId(book.id);
    setIsGeneratorOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans flex flex-col antialiased selection:bg-amber-200 selection:text-amber-900">
      {/* Sticky Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeBook={activeBook}
        activeQuestionnaire={activeQuestionnaire}
        onOpenImporter={() => setIsImporterOpen(true)}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'library' && (
          <LibraryView
            books={books}
            questionnaires={questionnaires}
            onSelectBook={handleSelectBook}
            onOpenImporter={() => setIsImporterOpen(true)}
            onOpenGeneratorForBook={handleOpenGeneratorForBook}
            onDeleteBook={handleDeleteBook}
          />
        )}

        {currentTab === 'book' && activeBook && (
          <BookOverview
            book={activeBook}
            questionnaires={questionnaires}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            onSelectQuestionnaire={handleSelectQuestionnaire}
            onUpdateBook={handleUpdateBook}
            onTakeQuiz={handleTakeQuiz}
          />
        )}

        {currentTab === 'questionnaire' && activeQuestionnaire && activeBook && (
          <QuestionnaireEditor
            questionnaire={activeQuestionnaire}
            book={activeBook}
            onUpdateQuestionnaire={handleUpdateQuestionnaire}
            onStartQuiz={() => setCurrentTab('quiz')}
            onOpenPrint={() => setCurrentTab('print')}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}

        {currentTab === 'quiz' && activeQuestionnaire && activeBook && (
          <InteractiveQuiz
            questionnaire={activeQuestionnaire}
            book={activeBook}
            onExit={() => setCurrentTab('questionnaire')}
          />
        )}

        {currentTab === 'print' && activeQuestionnaire && activeBook && (
          <PrintableWorksheet
            questionnaire={activeQuestionnaire}
            book={activeBook}
            onBack={() => setCurrentTab('questionnaire')}
          />
        )}

        {currentTab === 'flashcards' && activeQuestionnaire && activeBook && (
          <FlashcardMode
            questionnaire={activeQuestionnaire}
            book={activeBook}
            onExit={() => setCurrentTab('questionnaire')}
          />
        )}
      </main>

      {/* Importer Modal */}
      <BookImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportBook={handleImportBook}
      />

      {/* Generator Wizard Modal */}
      {activeBook && (
        <QuestionnaireGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          book={activeBook}
          onQuestionnaireCreated={handleQuestionnaireCreated}
        />
      )}

      {/* Export Modal */}
      {activeQuestionnaire && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          questionnaire={activeQuestionnaire}
        />
      )}
    </div>
  );
}
