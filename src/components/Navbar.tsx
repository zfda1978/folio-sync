import React from 'react';
import { Plus, User } from 'lucide-react';
import { Book, Questionnaire } from '../types';
import { ZenoxisWordmark } from './ZenoxisLogo';
import { AuthUser } from '../context/AuthContext';

export type ZenoxisTab = 'landing' | 'library' | 'book' | 'questionnaire' | 'quiz' | 'print' | 'flashcards' | 'insight';

interface NavbarProps {
  currentTab: ZenoxisTab;
  onSelectTab: (tab: ZenoxisTab) => void;
  activeBook: Book | null;
  activeQuestionnaire: Questionnaire | null;
  onOpenImporter: () => void;
  user: AuthUser | null;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeBook,
  activeQuestionnaire,
  onOpenImporter,
  user,
  onOpenLogin,
}) => {
  const navItems: Array<{
    id: ZenoxisTab;
    label: string;
    isActive: boolean;
    disabled?: boolean;
  }> = [
    {
      id: 'library',
      label: 'Library',
      isActive: currentTab === 'library' || currentTab === 'book',
    },
    {
      id: 'questionnaire',
      label: 'Studio',
      isActive: currentTab === 'questionnaire',
      disabled: !activeQuestionnaire && !activeBook,
    },
    {
      id: 'quiz',
      label: 'Assess',
      isActive: currentTab === 'quiz' || currentTab === 'print',
      disabled: !activeQuestionnaire,
    },
    {
      id: 'flashcards',
      label: 'Think',
      isActive: currentTab === 'flashcards',
      disabled: !activeQuestionnaire,
    },
    {
      id: 'insight',
      label: 'Insight',
      isActive: currentTab === 'insight',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#A9B9D3]/45 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark Only */}
          <button
            onClick={() => onSelectTab('landing')}
            className="hover:opacity-90 transition-opacity text-left cursor-pointer whitespace-nowrap shrink-0"
            aria-label="ZENOXIS Home"
          >
            <ZenoxisWordmark variant="light" />
          </button>

          {/* Zone 2: Core Product Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Primary Navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.disabled && onSelectTab(item.id)}
                disabled={item.disabled}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.isActive
                    ? 'bg-[#111D3B] text-[#EDF1FA]'
                    : 'text-[#111D3B]/75 hover:text-[#111D3B] hover:bg-[#EDF1FA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Primary Import CTA & Account Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenLogin}
              className="px-3 py-2 text-xs sm:text-sm font-medium text-[#111D3B] bg-[#EDF1FA] hover:bg-[#A9B9D3]/35 border border-[#A9B9D3]/60 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={user ? `Account: ${user.displayName}` : 'Sign In'}
            >
              {user?.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.displayName}
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-4 h-4 text-[#3978E8] shrink-0" />
              )}
              <span className="max-w-[110px] truncate">
                {user ? user.displayName.split(' ')[0] : 'Sign In'}
              </span>
            </button>

            <button
              onClick={onOpenImporter}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3978E8] hover:bg-[#2B64CC] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import Book</span>
            </button>
          </div>
        </div>

        {/* Mobile Compact Nav Row */}
        <div className="flex md:hidden items-center gap-1 pb-2.5 overflow-x-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => !item.disabled && onSelectTab(item.id)}
              disabled={item.disabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors disabled:opacity-40 ${
                item.isActive
                  ? 'bg-[#111D3B] text-[#EDF1FA]'
                  : 'text-[#111D3B]/75 hover:bg-[#EDF1FA]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
