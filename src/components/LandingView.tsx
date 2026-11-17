import React, { useState } from 'react';
import { ArrowRight, BookOpen, Plus, Sparkles, GraduationCap, Users } from 'lucide-react';
import { Book, Questionnaire, WorkspaceRole } from '../types';
import { AuthUser } from '../context/AuthContext';
import { ZenoxisTab } from './Navbar';
import { AxisOfIntelligenceMark, ZenoxisWordmark } from './ZenoxisLogo';

interface LandingViewProps {
  books: Book[];
  questionnaires: Questionnaire[];
  activeBook: Book | null;
  activeQuestionnaire: Questionnaire | null;
  user: AuthUser | null;
  onSelectTab: (tab: ZenoxisTab) => void;
  onOpenImporter: () => void;
  onOpenGenerator: () => void;
  onOpenLogin: () => void;
  onSelectRoleAndEnter: (role: WorkspaceRole) => void;
}

import prismStudyImg from '../assets/images/zenoxis_prism_study_1794897167931.jpg';

const HERO_MURAL_SRC = '/assets/aistudio/image_ebb558ad.png';

const COGNITIVE_PILLARS = [
  {
    index: '01',
    title: 'Logic',
    accentColor: '#3978E8',
    summary:
      'Trace deductive chains, cause-and-effect structure, and premise-to-conclusion validity across every chapter.',
    outcome: 'Structured argument and sequence verification',
    targetTab: 'questionnaire' as ZenoxisTab,
  },
  {
    index: '02',
    title: 'Reason',
    accentColor: '#8174D5',
    summary:
      'Move past surface recall with evidence-grounded questions that require textual citation and explanatory justification.',
    outcome: 'Source-cited short answer and essay rubrics',
    targetTab: 'quiz' as ZenoxisTab,
  },
  {
    index: '03',
    title: 'Discovery',
    accentColor: '#51BCA6',
    summary:
      'Uncover thematic connections, character dynamics, and conceptual patterns across entire volumes in minutes.',
    outcome: 'Full-book chapter synthesis and concept decks',
    targetTab: 'flashcards' as ZenoxisTab,
  },
  {
    index: '04',
    title: 'Intelligence',
    accentColor: '#3978E8',
    summary:
      'Measure comprehension trajectories across Grades 4–10 and adapt inquiry depth to match learner growth.',
    outcome: 'Cognitive progression tracking and analytics',
    targetTab: 'insight' as ZenoxisTab,
  },
];

export const LandingView: React.FC<LandingViewProps> = ({
  books,
  questionnaires,
  activeBook,
  activeQuestionnaire,
  user,
  onSelectTab,
  onOpenImporter,
  onOpenGenerator,
  onOpenLogin,
  onSelectRoleAndEnter,
}) => {
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [studyImgFailed, setStudyImgFailed] = useState(false);

  const totalQuestions = questionnaires.reduce((sum, q) => sum + q.questions.length, 0);

  const handleOpenModule = (tab: ZenoxisTab) => {
    if ((tab === 'quiz' || tab === 'flashcards') && !activeQuestionnaire) {
      onSelectTab('library');
      return;
    }
    if (tab === 'questionnaire' && !activeQuestionnaire && !activeBook) {
      onSelectTab('library');
      return;
    }
    onSelectTab(tab);
  };

  return (
    <div className="bg-[#EDF1FA] text-[#111D3B]">
      {/* Section 1: Full-Length Light Mural Hero */}
      <section className="relative bg-[#F7F9FD] border-b border-[#A9B9D3]/45 overflow-hidden">
        {/* Desktop Full-Length Mural Canvas */}
        <div className="relative w-full lg:min-h-[620px] xl:min-h-[740px] flex flex-col justify-start">
          {/* Desktop Background Mural (Full Width, Uncropped Framing) */}
          {!heroImgFailed ? (
            <img
              src={HERO_MURAL_SRC}
              alt="Full-length sunlit wall mural of Plato, Leonardo da Vinci, Marie Curie, Isaac Newton, and Ada Lovelace with books, atoms, geometry, DNA, and circuits illustrating Logic, Thinking, and Innovation"
              className="hidden lg:block absolute inset-0 w-full h-full object-cover object-[center_65%]"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
            />
          ) : (
            <div className="hidden lg:block absolute inset-0 bg-gradient-to-b from-[#F8FAFE] to-[#EDF1FA]" />
          )}

          {/* Subtle Left-Side Light Wall Scrim (Fades Before Mural Centerpiece) */}
          <div
            className="hidden lg:block absolute inset-0 pointer-events-none bg-gradient-to-r from-[#F7F9FD]/90 via-[#F7F9FD]/45 via-35% to-transparent to-55%"
            aria-hidden="true"
          />

          {/* Hero Copy Positioned Cleanly in Open Upper-Left Wall Space */}
          <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 lg:pt-12 lg:pb-16">
            <div className="max-w-md space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.14em] uppercase text-[#111D3B]/70">
                <AxisOfIntelligenceMark className="w-4 h-4 shrink-0" variant="light" />
                <span className="font-semibold text-[#111D3B]">ZENOXIS</span>
                <span aria-hidden="true">·</span>
                <span className="font-serif italic normal-case tracking-normal text-sm text-[#3978E8]">
                  Ancient Wisdom. Future Intelligence.
                </span>
              </div>

              <div className="space-y-3">
                <h1
                  className="font-display font-bold tracking-tight text-[#111D3B] leading-[1.06]"
                  style={{ fontSize: 'clamp(2.25rem, 3.8vw, 3.5rem)', textWrap: 'balance' }}
                >
                  Think Beyond Knowledge.
                </h1>

                <div className="flex items-center gap-2" aria-hidden="true">
                  <span className="h-1 w-16 bg-[#3978E8] rounded-full" />
                  <span className="h-1 w-8 bg-[#51BCA6] rounded-full" />
                  <span className="h-1 w-4 bg-[#8174D5] rounded-full" />
                </div>

                <p className="font-mono text-xs sm:text-[13px] tracking-[0.16em] uppercase text-[#111D3B]/85 font-semibold pt-0.5">
                  LOGIC · REASON · DISCOVERY · INTELLIGENCE
                </p>
              </div>

              <p className="text-sm sm:text-base text-[#111D3B]/80 leading-relaxed max-w-md">
                Turn books and PDFs into chapter-grounded inquiries and adaptive Grades 4–10
                assessments.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onSelectTab('library')}
                  className="px-6 py-3 rounded-xl bg-[#3978E8] hover:bg-[#2B64CC] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                >
                  <span>Enter Library</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onOpenImporter}
                  className="px-5 py-3 rounded-xl bg-white/95 hover:bg-[#EDF1FA] border border-[#A9B9D3]/70 text-[#111D3B] text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Import a Book</span>
                </button>

                {!user && (
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="px-2 py-2 text-sm font-medium text-[#3978E8] hover:text-[#111D3B] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Sign In with Gmail
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile / Tablet Uncropped Full-Width Mural Below Copy */}
          <div className="lg:hidden w-full border-t border-[#A9B9D3]/35 bg-white">
            {!heroImgFailed ? (
              <img
                src={HERO_MURAL_SRC}
                alt="Full-length sunlit wall mural of great thinkers in history with Logic, Thinking, and Innovation graffiti"
                className="w-full h-auto block"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgFailed(true)}
              />
            ) : (
              <div className="w-full py-12 flex flex-col items-center justify-center bg-[#EDF1FA] text-center px-6">
                <AxisOfIntelligenceMark className="w-12 h-12 mb-2" variant="light" />
                <p className="font-display text-base font-semibold text-[#111D3B]">
                  Logic · Reason · Discovery · Intelligence
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Clean Unboxed Proof Strip Directly Beneath Full-Length Hero */}
        <div className="bg-white/95 border-t border-[#A9B9D3]/45">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#111D3B]">
                {books.length} Volumes
              </div>
              <div className="text-xs text-[#111D3B]/65 mt-1">
                Ready in library with chapter indexing
              </div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#111D3B]">
                Grades 4–10
              </div>
              <div className="text-xs text-[#111D3B]/65 mt-1">
                Calibrated reading and inquiry difficulty
              </div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#3978E8]">
                {totalQuestions} Questions
              </div>
              <div className="text-xs text-[#111D3B]/65 mt-1">
                Source-grounded with textual citations
              </div>
            </div>
            <div>
              <div className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#111D3B]">
                PDF · EPUB · TXT
              </div>
              <div className="text-xs text-[#111D3B]/65 mt-1">
                Full-volume extraction and OCR pipeline
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Four Axes — Logic, Reason, Discovery, Intelligence */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Editorial Statement + 4:3 Study Artwork */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#3978E8] font-medium">
                The Four Cognitive Axes
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111D3B]"
                style={{ textWrap: 'balance' }}
              >
                From passive reading to independent reasoning.
              </h2>
              <p className="text-sm sm:text-base text-[#111D3B]/75 leading-relaxed">
                Conventional exams reward short-term memorization. ZENOXIS structures every chapter
                around four measurable intellectual faculties so students learn how to analyze,
                question, and synthesize.
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#A9B9D3]/50 bg-white">
              {!studyImgFailed ? (
                <img
                  src={prismStudyImg}
                  alt="Open hardcover book beside a faceted glass prism on pale marble"
                  className="w-full aspect-[4/3] object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setStudyImgFailed(true)}
                />
              ) : (
                <div className="w-full aspect-[4/3] flex flex-col items-center justify-center p-8 bg-[#EDF1FA] text-center">
                  <BookOpen className="w-10 h-10 text-[#3978E8] mb-3" />
                  <p className="font-serif italic text-lg text-[#111D3B]">
                    Think Beyond Knowledge
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Numbered Architectural List */}
          <div className="lg:col-span-7 divide-y divide-[#A9B9D3]/50 border-t border-b border-[#A9B9D3]/50">
            {COGNITIVE_PILLARS.map((pillar) => (
              <div
                key={pillar.index}
                className="py-6 sm:py-7 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
              >
                <div className="flex items-start gap-5">
                  <span
                    className="font-mono tabular-nums text-sm font-semibold pt-1 shrink-0"
                    style={{ color: pillar.accentColor }}
                  >
                    {pillar.index}.
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="font-display text-xl font-bold text-[#111D3B]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#111D3B]/75 leading-relaxed max-w-xl">
                      {pillar.summary}
                    </p>
                    <p className="text-xs font-mono text-[#111D3B]/55 pt-1">
                      {pillar.outcome}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenModule(pillar.targetTab)}
                  className="self-start sm:self-center text-xs font-semibold text-[#3978E8] hover:text-[#111D3B] flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Asymmetric Suite Architecture */}
      <section className="bg-white border-y border-[#A9B9D3]/45 py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#8174D5] font-medium">
                ZENOXIS Platform Suite
              </p>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111D3B]"
                style={{ textWrap: 'balance' }}
              >
                Six integrated modules built for books and inquiry.
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenGenerator}
              disabled={!activeBook}
              className="px-4 py-2.5 rounded-xl bg-[#111D3B] hover:bg-[#1C2E5C] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#51BCA6]" />
              <span>Launch ZENOXIS AI</span>
            </button>
          </div>

          {/* Asymmetric Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Wide Card 1: ZENOXIS Library */}
            <button
              type="button"
              onClick={() => onSelectTab('library')}
              className="md:col-span-2 text-left rounded-2xl bg-[#EDF1FA]/70 hover:bg-[#EDF1FA] border border-[#A9B9D3]/55 p-6 sm:p-8 flex flex-col justify-between gap-6 transition-colors cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#111D3B]/60">
                  <span>01 · ZENOXIS Library</span>
                  <span>PDF · EPUB · TXT</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#111D3B]">
                  Full-Book Ingestion &amp; Chapter Organization
                </h3>
                <p className="text-sm text-[#111D3B]/75 leading-relaxed max-w-xl">
                  Extract full chapters across entire volumes—including client-side EPUB parsing and
                  multi-pass scanned PDF transcription—organized for rapid study and question
                  generation.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3978E8]">
                <span>Browse Library ({books.length} books)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 2: ZENOXIS Studio */}
            <button
              type="button"
              onClick={() => handleOpenModule('questionnaire')}
              className="text-left rounded-2xl bg-white hover:bg-[#EDF1FA]/60 border border-[#A9B9D3]/55 p-6 sm:p-8 flex flex-col justify-between gap-6 transition-colors cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-[#111D3B]/60">02 · ZENOXIS Studio</div>
                <h3 className="font-display text-xl font-bold text-[#111D3B]">
                  Chapter Questionnaire Authoring
                </h3>
                <p className="text-sm text-[#111D3B]/75 leading-relaxed">
                  Refine prompts, answer keys, point weights, and source-text citations before
                  publishing.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3978E8]">
                <span>Open Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Card 3: ZENOXIS Think */}
            <button
              type="button"
              onClick={() => handleOpenModule('flashcards')}
              className="text-left rounded-2xl bg-white hover:bg-[#EDF1FA]/60 border border-[#A9B9D3]/55 p-6 sm:p-8 flex flex-col justify-between gap-6 transition-colors cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="text-xs font-mono text-[#111D3B]/60">03 · ZENOXIS Think</div>
                <h3 className="font-display text-xl font-bold text-[#111D3B]">
                  Interactive Concept Mastery
                </h3>
                <p className="text-sm text-[#111D3B]/75 leading-relaxed">
                  Reinforce literary themes, vocabulary, and logical proofs with active recall
                  flashcards.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#51BCA6]">
                <span>Start Active Recall</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Wide Card 4: ZENOXIS Assess + Insight */}
            <div className="md:col-span-2 text-left rounded-2xl bg-[#111D3B] text-[#EDF1FA] border border-[#1E315E] p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono text-[#A9B9D3]">
                  <span>04 · ZENOXIS Assess &amp; Insight</span>
                  <span>Interactive Web Exam · Printable PDF</span>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Adaptive Examinations &amp; Cognitive Skill Insight
                </h3>
                <p className="text-sm text-[#A9B9D3] leading-relaxed max-w-xl">
                  Administer interactive web assessments with AI-assisted rubric feedback, export
                  clean printable worksheets with answer keys, and track mastery in ZENOXIS Insight.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleOpenModule('quiz')}
                  className="inline-flex items-center gap-1.5 text-[#51BCA6] hover:text-white transition-colors cursor-pointer"
                >
                  <span>Take Web Assessment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[#A9B9D3]" aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onSelectTab('insight')}
                  className="inline-flex items-center gap-1.5 text-[#EDF1FA] hover:text-white underline-offset-4 hover:underline cursor-pointer"
                >
                  <span>View Progress Insight</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Teacher & Student Workspaces + Account Sync */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-[#A9B9D3]/55 p-7 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#3978E8]">
                <Users className="w-4 h-4" />
                <span>For Educators</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#111D3B]">
                Teacher Workspace
              </h3>
              <p className="text-sm text-[#111D3B]/75 leading-relaxed">
                Upload full books, scope assessments to specific chapters, calibrate difficulty for
                Grades 4–10, and print classroom-ready worksheets with complete answer keys.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectRoleAndEnter('teacher')}
              className="self-start px-5 py-2.5 rounded-xl bg-[#111D3B] hover:bg-[#1C2E5C] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Teacher Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl bg-white border border-[#A9B9D3]/55 p-7 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#51BCA6]">
                <GraduationCap className="w-4 h-4" />
                <span>For Learners</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#111D3B]">
                Student Workspace
              </h3>
              <p className="text-sm text-[#111D3B]/75 leading-relaxed">
                Read chapter summaries, practice with Think recall cards, complete graded web
                examinations, and track your reasoning growth across every book.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectRoleAndEnter('student')}
              className="self-start px-5 py-2.5 rounded-xl bg-[#3978E8] hover:bg-[#2B64CC] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Student Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Account Conversion Strip */}
        <div className="rounded-2xl bg-[#111D3B] text-[#EDF1FA] border border-[#1E315E] px-6 py-7 sm:px-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <h3 className="font-display text-xl font-bold text-white">
              {user
                ? `Welcome back, ${user.displayName}`
                : 'Save your workspace and exam history'}
            </h3>
            <p className="text-sm text-[#A9B9D3]">
              {user
                ? 'Your workspace mode and assessment attempts sync automatically to your account.'
                : 'Sign in with Gmail or create an account to persist your scores and role across sessions.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-5 py-2.5 rounded-xl bg-[#3978E8] hover:bg-[#2B64CC] text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            {user ? 'Manage Account' : 'Login with Gmail / Sign Up'}
          </button>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="bg-white border-t border-[#A9B9D3]/45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <ZenoxisWordmark variant="light" />
            <p className="text-xs text-[#111D3B]/60">
              Think Beyond Knowledge · Logic · Reason · Discovery · Intelligence
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#111D3B]/70">
            <button
              type="button"
              onClick={() => onSelectTab('library')}
              className="hover:text-[#111D3B] cursor-pointer"
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => handleOpenModule('questionnaire')}
              className="hover:text-[#111D3B] cursor-pointer"
            >
              Studio
            </button>
            <button
              type="button"
              onClick={() => handleOpenModule('quiz')}
              className="hover:text-[#111D3B] cursor-pointer"
            >
              Assess
            </button>
            <button
              type="button"
              onClick={() => handleOpenModule('flashcards')}
              className="hover:text-[#111D3B] cursor-pointer"
            >
              Think
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('insight')}
              className="hover:text-[#111D3B] cursor-pointer"
            >
              Insight
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="hover:text-[#111D3B] cursor-pointer"
            >
              {user ? 'Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
