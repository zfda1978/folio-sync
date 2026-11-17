/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, GraduationCap, Users } from 'lucide-react';
import { Navbar, ZenoxisTab } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { LibraryView } from './components/LibraryView';
import { BookOverview } from './components/BookOverview';
import { QuestionnaireEditor } from './components/QuestionnaireEditor';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { PrintableWorksheet } from './components/PrintableWorksheet';
import { FlashcardMode } from './components/FlashcardMode';
import { InsightView } from './components/InsightView';
import { BookImporter } from './components/BookImporter';
import { QuestionnaireGeneratorModal } from './components/QuestionnaireGeneratorModal';
import { ExportModal } from './components/ExportModal';
import { LoginModal } from './components/LoginModal';
import { useAuth } from './context/AuthContext';
import { Book, Questionnaire, QuizAttempt, WorkspaceRole } from './types';
import { INITIAL_QUESTIONNAIRES, SAMPLE_BOOKS } from './data/sampleBooks';

function loadWithFallback<T>(primaryKey: string, legacyKey: string | null, fallback: T): T {
  try {
    const primary = localStorage.getItem(primaryKey);
    if (primary) return JSON.parse(primary);
    if (legacyKey) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) return JSON.parse(legacy);
    }
  } catch (e) {
    console.warn(`Failed to load ${primaryKey}`, e);
  }
  return fallback;
}

export default function App() {
  const [books, setBooks] = useState<Book[]>(() =>
    loadWithFallback<Book[]>('zenoxis_books', 'folioquest_books', SAMPLE_BOOKS)
  );

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>(() =>
    loadWithFallback<Questionnaire[]>(
      'zenoxis_questionnaires',
      'folioquest_questionnaires',
      INITIAL_QUESTIONNAIRES as unknown as Questionnaire[]
    )
  );

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() =>
    loadWithFallback<QuizAttempt[]>('zenoxis_attempts', null, [])
  );

  const [masteredCardIds, setMasteredCardIds] = useState<string[]>(() =>
    loadWithFallback<string[]>('zenoxis_mastered', null, [])
  );

  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>(() => {
    try {
      const saved = localStorage.getItem('zenoxis_role');
      if (saved === 'student' || saved === 'teacher') return saved;
    } catch {
      // ignore
    }
    return 'teacher';
  });

  const [activeBookId, setActiveBookId] = useState<string>(books[0]?.id || SAMPLE_BOOKS[0]?.id || '');
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string>(
    questionnaires[0]?.id || INITIAL_QUESTIONNAIRES[0]?.id || ''
  );

  const [currentTab, setCurrentTab] = useState<ZenoxisTab>('landing');

  const {
    user,
    syncWorkspaceRoleToCloud,
    loadProfileRoleFromCloud,
    saveAttemptToCloud,
    loadAttemptsFromCloud,
  } = useAuth();

  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('zenoxis_books', JSON.stringify(books));
    } catch (e) {
      console.warn(e);
    }
  }, [books]);

  useEffect(() => {
    try {
      localStorage.setItem('zenoxis_questionnaires', JSON.stringify(questionnaires));
    } catch (e) {
      console.warn(e);
    }
  }, [questionnaires]);

  useEffect(() => {
    try {
      localStorage.setItem('zenoxis_attempts', JSON.stringify(quizAttempts));
    } catch (e) {
      console.warn(e);
    }
  }, [quizAttempts]);

  useEffect(() => {
    try {
      localStorage.setItem('zenoxis_mastered', JSON.stringify(masteredCardIds));
    } catch (e) {
      console.warn(e);
    }
  }, [masteredCardIds]);

  useEffect(() => {
    try {
      localStorage.setItem('zenoxis_role', workspaceRole);
    } catch {
      // ignore
    }
  }, [workspaceRole]);

  useEffect(() => {
    if (!user?.isFirebaseBacked) return;
    let active = true;
    (async () => {
      try {
        const [cloudRole, cloudAttempts] = await Promise.all([
          loadProfileRoleFromCloud(),
          loadAttemptsFromCloud(),
        ]);
        if (!active) return;
        if (cloudRole) {
          setWorkspaceRole(cloudRole);
        }
        if (cloudAttempts.length > 0) {
          setQuizAttempts((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const merged = [...prev];
            for (const ca of cloudAttempts) {
              if (!existingIds.has(ca.id)) {
                merged.push(ca);
              }
            }
            return merged.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          });
        }
      } catch (err) {
        console.warn('Cloud workspace sync warning:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.uid, user?.isFirebaseBacked, loadProfileRoleFromCloud, loadAttemptsFromCloud]);

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

  const handleToggleMastered = (questionId: string) => {
    setMasteredCardIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    );
  };

  const handleAttemptCompleted = (attempt: QuizAttempt) => {
    setQuizAttempts((prev) => [attempt, ...prev]);
    if (user?.isFirebaseBacked) {
      saveAttemptToCloud(attempt).catch((err) => {
        console.warn('Failed to save attempt to cloud:', err);
      });
    }
  };

  const handleRoleChange = (role: WorkspaceRole) => {
    setWorkspaceRole(role);
    if (user?.isFirebaseBacked) {
      syncWorkspaceRoleToCloud(role).catch((err) => {
        console.warn('Failed to sync role to cloud:', err);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#EDF1FA] text-[#111D3B] font-sans flex flex-col antialiased selection:bg-[#3978E8]/20 selection:text-[#111D3B]">
      {/* Sticky Top Header (3-Zone Contract) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeBook={activeBook}
        activeQuestionnaire={activeQuestionnaire}
        onOpenImporter={() => setIsImporterOpen(true)}
        user={user}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Workspace Control Sub-Bar (Hidden on Landing Page) */}
      {currentTab !== 'landing' && (
        <div className="bg-white border-b border-[#A9B9D3]/40 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Active Context Breadcrumb */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#111D3B]/70 min-w-0">
            {activeBook && (
              <button
                onClick={() => setCurrentTab('book')}
                className={`inline-flex items-center gap-1.5 font-medium truncate max-w-[240px] sm:max-w-sm cursor-pointer ${
                  currentTab === 'book' ? 'text-[#3978E8] font-semibold' : 'hover:text-[#111D3B]'
                }`}
                title={activeBook.title}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#3978E8] shrink-0" />
                <span className="truncate">{activeBook.title}</span>
              </button>
            )}

            {(currentTab === 'quiz' || currentTab === 'print') && activeQuestionnaire && (
              <>
                <span className="text-[#A9B9D3]">/</span>
                <div className="inline-flex items-center gap-1 bg-[#EDF1FA] p-0.5 rounded-lg border border-[#A9B9D3]/45">
                  <button
                    onClick={() => setCurrentTab('quiz')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      currentTab === 'quiz'
                        ? 'bg-[#111D3B] text-white'
                        : 'text-[#111D3B]/70 hover:text-[#111D3B]'
                    }`}
                  >
                    Web Exam
                  </button>
                  <button
                    onClick={() => setCurrentTab('print')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      currentTab === 'print'
                        ? 'bg-[#111D3B] text-white'
                        : 'text-[#111D3B]/70 hover:text-[#111D3B]'
                    }`}
                  >
                    Printable PDF
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Controls: ZENOXIS AI + Student / Teacher Workspace */}
          <div className="flex items-center gap-2.5">
            {activeBook && (
              <button
                onClick={() => setIsGeneratorOpen(true)}
                className="px-3 py-1.5 text-xs font-semibold text-[#8174D5] bg-[#8174D5]/10 hover:bg-[#8174D5] hover:text-white border border-[#8174D5]/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>ZENOXIS AI</span>
              </button>
            )}

            <div
              className="inline-flex items-center bg-[#EDF1FA] p-0.5 rounded-lg border border-[#A9B9D3]/45"
              role="group"
              aria-label="Workspace Mode"
            >
              <button
                onClick={() => handleRoleChange('teacher')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                  workspaceRole === 'teacher'
                    ? 'bg-[#111D3B] text-white'
                    : 'text-[#111D3B]/65 hover:text-[#111D3B]'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>Teacher</span>
              </button>
              <button
                onClick={() => handleRoleChange('student')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer ${
                  workspaceRole === 'student'
                    ? 'bg-[#111D3B] text-white'
                    : 'text-[#111D3B]/65 hover:text-[#111D3B]'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Student</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Main Workspace */}
      <main className={`flex-1 ${currentTab === 'landing' ? '' : 'pb-16'}`}>
        {currentTab === 'landing' && (
          <LandingView
            books={books}
            questionnaires={questionnaires}
            activeBook={activeBook}
            activeQuestionnaire={activeQuestionnaire}
            user={user}
            onSelectTab={setCurrentTab}
            onOpenImporter={() => setIsImporterOpen(true)}
            onOpenGenerator={() => setIsGeneratorOpen(true)}
            onOpenLogin={() => setIsLoginOpen(true)}
            onSelectRoleAndEnter={(role) => {
              handleRoleChange(role);
              setCurrentTab('library');
            }}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            books={books}
            questionnaires={questionnaires}
            workspaceRole={workspaceRole}
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
            workspaceRole={workspaceRole}
            onBackToLibrary={() => setCurrentTab('library')}
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
            onAttemptCompleted={handleAttemptCompleted}
          />
        )}

        {currentTab === 'print' && activeQuestionnaire && activeBook && (
          <PrintableWorksheet
            questionnaire={activeQuestionnaire}
            book={activeBook}
            workspaceRole={workspaceRole}
            onBack={() => setCurrentTab('questionnaire')}
          />
        )}

        {currentTab === 'flashcards' && activeQuestionnaire && activeBook && (
          <FlashcardMode
            questionnaire={activeQuestionnaire}
            book={activeBook}
            masteredIds={masteredCardIds}
            onToggleMastered={handleToggleMastered}
            onExit={() => setCurrentTab('questionnaire')}
          />
        )}

        {currentTab === 'insight' && (
          <InsightView
            books={books}
            questionnaires={questionnaires}
            attempts={quizAttempts}
            masteredCardIds={masteredCardIds}
            workspaceRole={workspaceRole}
            onStartAssessment={() => setCurrentTab(activeQuestionnaire ? 'quiz' : 'library')}
            onClearHistory={() => setQuizAttempts([])}
          />
        )}
      </main>

      <BookImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportBook={handleImportBook}
      />

      {activeBook && (
        <QuestionnaireGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          book={activeBook}
          onQuestionnaireCreated={handleQuestionnaireCreated}
        />
      )}

      {activeQuestionnaire && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          questionnaire={activeQuestionnaire}
        />
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
