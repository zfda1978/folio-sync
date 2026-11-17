import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Play,
  Layers,
  Trash2,
} from 'lucide-react';
import {
  BloomsLevel,
  Book,
  CognitiveDimension,
  Questionnaire,
  QuizAttempt,
  WorkspaceRole,
} from '../types';
import { formatDimensionLabel, inferCognitiveDimension } from '../utils/textParser';

interface InsightViewProps {
  books: Book[];
  questionnaires: Questionnaire[];
  attempts: QuizAttempt[];
  masteredCardIds: string[];
  workspaceRole: WorkspaceRole;
  onStartAssessment: () => void;
  onClearHistory: () => void;
}

const DIMENSIONS: CognitiveDimension[] = ['logical', 'rational', 'critical', 'innovative'];
const BLOOMS: BloomsLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

export const InsightView: React.FC<InsightViewProps> = ({
  books,
  questionnaires,
  attempts,
  masteredCardIds,
  workspaceRole,
  onStartAssessment,
  onClearHistory,
}) => {
  const totalQuestions = questionnaires.reduce((sum, q) => sum + q.questions.length, 0);
  const averageAccuracy =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length)
      : 0;
  const totalStudySeconds = attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0);

  // Build real accuracy breakdown per Cognitive Dimension from recorded attempts
  const questionMap = new Map<string, (typeof questionnaires)[number]['questions'][number]>();
  questionnaires.forEach((q) => {
    q.questions.forEach((item) => questionMap.set(item.id, item));
  });

  const dimensionStats = DIMENSIONS.map((dim) => {
    let attempted = 0;
    let passed = 0;
    let authored = 0;

    questionnaires.forEach((q) => {
      q.questions.forEach((item) => {
        if (inferCognitiveDimension(item) === dim) authored++;
      });
    });

    attempts.forEach((att) => {
      Object.values(att.answers).forEach((record) => {
        const qItem = questionMap.get(record.questionId);
        if (!qItem) return;
        if (inferCognitiveDimension(qItem) === dim) {
          attempted++;
          if (record.isCorrect) passed++;
        }
      });
    });

    return {
      dimension: dim,
      label: formatDimensionLabel(dim),
      authored,
      attempted,
      accuracy: attempted > 0 ? Math.round((passed / attempted) * 100) : null,
    };
  });

  const bloomsStats = BLOOMS.map((lvl) => {
    let authored = 0;
    let attempted = 0;
    let passed = 0;

    questionnaires.forEach((q) => {
      q.questions.forEach((item) => {
        if (item.bloomsLevel === lvl) authored++;
      });
    });

    attempts.forEach((att) => {
      Object.values(att.answers).forEach((record) => {
        const qItem = questionMap.get(record.questionId);
        if (qItem && qItem.bloomsLevel === lvl) {
          attempted++;
          if (record.isCorrect) passed++;
        }
      });
    });

    return {
      level: lvl,
      authored,
      attempted,
      accuracy: attempted > 0 ? Math.round((passed / attempted) * 100) : null,
    };
  });

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3978E8]">
            ZENOXIS Insight · {workspaceRole === 'teacher' ? 'Curriculum & Cohort Analytics' : 'Personal Cognitive Progress'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D3B] mt-1">
            Cognitive Skill &amp; Assessment Progress
          </h1>
          <p className="text-xs sm:text-sm text-[#111D3B]/65 mt-1">
            Measured exclusively from completed ZENOXIS Assess examinations and Think mastery sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {attempts.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-3.5 py-2 text-xs font-semibold text-[#111D3B]/70 hover:text-rose-600 bg-white border border-[#A9B9D3]/55 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset History</span>
            </button>
          )}
          <button
            onClick={onStartAssessment}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Take Assessment</span>
          </button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#A9B9D3]/50 space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#111D3B]/55">
            Completed Exams
          </div>
          <div className="font-mono tabular-nums text-3xl font-bold text-[#111D3B]">
            {attempts.length}
          </div>
          <div className="text-xs text-[#111D3B]/60">
            Across {books.length} library volume{books.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#A9B9D3]/50 space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#111D3B]/55">
            Mean Accuracy
          </div>
          <div className="font-mono tabular-nums text-3xl font-bold text-[#3978E8]">
            {attempts.length > 0 ? `${averageAccuracy}%` : '—'}
          </div>
          <div className="text-xs text-[#111D3B]/60">
            {attempts.length > 0 ? 'Recorded exam score average' : 'Complete an exam to record'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#A9B9D3]/50 space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#111D3B]/55">
            Think Mastery
          </div>
          <div className="font-mono tabular-nums text-3xl font-bold text-[#51BCA6]">
            {masteredCardIds.length}
            <span className="text-base font-normal text-[#111D3B]/45"> / {totalQuestions}</span>
          </div>
          <div className="text-xs text-[#111D3B]/60">Concepts marked mastered</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#A9B9D3]/50 space-y-1">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-[#111D3B]/55">
            Time in Assessment
          </div>
          <div className="font-mono tabular-nums text-3xl font-bold text-[#111D3B]">
            {attempts.length > 0 ? formatDuration(totalStudySeconds) : '0s'}
          </div>
          <div className="text-xs text-[#111D3B]/60">Active reasoning duration</div>
        </div>
      </div>

      {/* Reasoning Dimensions & Bloom Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#A9B9D3]/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[#111D3B] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#3978E8]" />
              <span>Cognitive Reasoning Profile</span>
            </h2>
            <span className="text-[11px] font-mono text-[#111D3B]/55">4 Dimensions</span>
          </div>

          <div className="space-y-4">
            {dimensionStats.map((d) => {
              const barPct = d.accuracy !== null ? d.accuracy : 0;
              return (
                <div key={d.dimension} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#111D3B]">{d.label}</span>
                    <span className="font-mono tabular-nums text-[#111D3B]/70">
                      {d.accuracy !== null
                        ? `${d.accuracy}% (${d.attempted} answered)`
                        : `${d.authored} authored · unattempted`}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#EDF1FA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3978E8] rounded-full transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#A9B9D3]/50 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[#111D3B] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8174D5]" />
              <span>Bloom&apos;s Taxonomy Progression</span>
            </h2>
            <span className="text-[11px] font-mono text-[#111D3B]/55">6 Levels</span>
          </div>

          <div className="space-y-3">
            {bloomsStats.map((b) => (
              <div key={b.level} className="flex items-center gap-3 text-xs">
                <span className="w-24 capitalize font-semibold text-[#111D3B] shrink-0">
                  {b.level}
                </span>
                <div className="flex-1 h-2 bg-[#EDF1FA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#8174D5] rounded-full transition-all duration-300"
                    style={{ width: `${b.accuracy ?? 0}%` }}
                  />
                </div>
                <span className="w-28 text-right font-mono tabular-nums text-[#111D3B]/65 shrink-0">
                  {b.accuracy !== null ? `${b.accuracy}%` : `${b.authored} Qs`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attempt Log */}
      <div className="bg-white rounded-2xl border border-[#A9B9D3]/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#A9B9D3]/40 flex items-center justify-between">
          <h2 className="font-bold text-base text-[#111D3B]">Assessment History</h2>
          <span className="text-xs font-mono tabular-nums text-[#111D3B]/55">
            {attempts.length} record{attempts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {attempts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-[#111D3B]">
              No Recorded Assessments Yet
            </p>
            <p className="text-xs text-[#111D3B]/60 max-w-md mx-auto">
              Complete an interactive exam in ZENOXIS Assess to track your reasoning accuracy across Logical, Rational, Critical, and Innovative dimensions.
            </p>
            <button
              onClick={onStartAssessment}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#51BCA6] hover:bg-[#3FA590] rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start First Assessment</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#A9B9D3]/35">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#111D3B]">
                    {att.questionnaireTitle || 'ZENOXIS Assessment'}
                  </div>
                  <div className="text-xs text-[#111D3B]/60 flex flex-wrap items-center gap-2">
                    <span>{att.bookTitle || 'Source Volume'}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">
                      {new Date(att.date).toLocaleDateString()}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3 h-3" />
                      {formatDuration(att.timeSpentSeconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="font-mono tabular-nums text-base font-bold text-[#111D3B]">
                      {att.percentage}%
                    </div>
                    <div className="font-mono tabular-nums text-[11px] text-[#111D3B]/55">
                      {att.score} / {att.totalPoints} pts
                    </div>
                  </div>
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      att.percentage >= 70 ? 'text-[#51BCA6]' : 'text-[#8174D5]'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
