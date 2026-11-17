import React, { useState } from 'react';
import { X, LogOut, AlertCircle, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { useAuth, AuthProviderKind } from '../context/AuthContext';
import { AxisOfIntelligenceMark } from './ZenoxisLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDER_LABELS: Record<AuthProviderKind, string> = {
  google: 'Gmail / Google',
  password: 'Email Account',
};

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    signingInProvider,
    authError,
    emailNeedsConfig,
    clearAuthError,
    signInWithGmail,
    signInWithEmail,
    signUpWithEmail,
    signOutAll,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localValidationError, setLocalValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetFormState = () => {
    setLocalValidationError(null);
    clearAuthError();
  };

  const handleClose = () => {
    resetFormState();
    onClose();
  };

  const handleGoogleLogin = async () => {
    resetFormState();
    const ok = await signInWithGmail();
    if (ok) onClose();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFormState();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setLocalValidationError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setLocalValidationError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setLocalValidationError('Please enter your name.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalValidationError('Passwords do not match.');
        return;
      }
      const ok = await signUpWithEmail(fullName, trimmedEmail, password);
      if (ok) {
        setPassword('');
        setConfirmPassword('');
        onClose();
      }
    } else {
      const ok = await signInWithEmail(trimmedEmail, password);
      if (ok) {
        setPassword('');
        onClose();
      }
    }
  };

  const handleSignOut = async () => {
    await signOutAll();
    onClose();
  };

  const displayError = localValidationError || authError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111D3B]/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="zenoxis-login-title"
    >
      <div className="bg-white w-full max-w-md rounded-2xl border border-[#A9B9D3]/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#111D3B] text-[#EDF1FA] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AxisOfIntelligenceMark className="w-7 h-7 shrink-0" variant="dark" />
            <div>
              <h2 id="zenoxis-login-title" className="font-display text-lg font-bold tracking-tight">
                {user
                  ? 'ZENOXIS Account'
                  : mode === 'signup'
                    ? 'Create ZENOXIS Account'
                    : 'Sign In to ZENOXIS'}
              </h2>
              <p className="text-xs text-[#A9B9D3]">
                {user
                  ? 'Your workspace profile and assessment history are synced.'
                  : 'Sign in with Gmail or create an account with your email.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[#A9B9D3] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close sign-in dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Active User Panel */}
          {user && (
            <div className="bg-[#EDF1FA] border border-[#A9B9D3]/50 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.displayName}
                    className="w-11 h-11 rounded-full object-cover border border-[#A9B9D3] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#3978E8] text-white font-display font-bold flex items-center justify-center shrink-0">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#111D3B] truncate">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-[#111D3B]/65 truncate">
                    {user.email || PROVIDER_LABELS[user.provider]}
                  </p>
                  <p className="text-[11px] font-mono text-[#3978E8] mt-0.5">
                    {PROVIDER_LABELS[user.provider]}
                  </p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-[#111D3B] bg-white hover:bg-[#111D3B] hover:text-white border border-[#A9B9D3]/60 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {displayError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium leading-relaxed">{displayError}</p>
                {emailNeedsConfig && (
                  <p className="text-[11px] text-red-800/80">
                    In Firebase Console (<span className="font-mono">skilled-script-t5v9p</span>), open{' '}
                    <strong>Authentication → Sign-in method → Email/Password</strong> and enable it.
                  </p>
                )}
              </div>
            </div>
          )}

          {!user && (
            <>
              {/* Continue with Gmail */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={signingInProvider !== null}
                className="w-full px-4 py-3 rounded-xl bg-white hover:bg-[#EDF1FA] border border-[#A9B9D3]/80 text-[#111D3B] font-semibold text-sm flex items-center justify-between transition-colors disabled:opacity-60 cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 1.73 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.87 6.16-4.87z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.71 2.88c2.17-2 3.71-4.95 3.71-8.7z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.71-2.88c-1.08.72-2.45 1.16-4.22 1.16-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                  </svg>
                  <span>Continue with Gmail</span>
                </span>
                <span className="text-xs font-mono text-[#111D3B]/55">
                  {signingInProvider === 'google' ? 'Connecting...' : 'Google'}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-[#A9B9D3]/45" />
                <span className="shrink mx-3 text-[11px] font-mono uppercase tracking-wider text-[#111D3B]/50">
                  or with email
                </span>
                <div className="flex-grow border-t border-[#A9B9D3]/45" />
              </div>

              {/* Mode Switcher: Sign In vs Sign Up */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#EDF1FA] rounded-xl border border-[#A9B9D3]/45">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    resetFormState();
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-[#111D3B] text-white'
                      : 'text-[#111D3B]/70 hover:text-[#111D3B]'
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    resetFormState();
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-[#111D3B] text-white'
                      : 'text-[#111D3B]/70 hover:text-[#111D3B]'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Email Login / Sign Up Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="zenoxis-auth-name"
                      className="block text-xs font-medium text-[#111D3B]/80 mb-1"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#111D3B]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="zenoxis-auth-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ada Lovelace"
                        autoComplete="name"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[#A9B9D3]/70 bg-white text-[#111D3B] placeholder:text-[#111D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3978E8]/40 focus:border-[#3978E8]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="zenoxis-auth-email"
                    className="block text-xs font-medium text-[#111D3B]/80 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#111D3B]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="zenoxis-auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      autoComplete="email"
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[#A9B9D3]/70 bg-white text-[#111D3B] placeholder:text-[#111D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3978E8]/40 focus:border-[#3978E8]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="zenoxis-auth-password"
                    className="block text-xs font-medium text-[#111D3B]/80 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#111D3B]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="zenoxis-auth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      minLength={6}
                      required
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[#A9B9D3]/70 bg-white text-[#111D3B] placeholder:text-[#111D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3978E8]/40 focus:border-[#3978E8]"
                    />
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="zenoxis-auth-confirm"
                      className="block text-xs font-medium text-[#111D3B]/80 mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#111D3B]/45 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="zenoxis-auth-confirm"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        minLength={6}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-[#A9B9D3]/70 bg-white text-[#111D3B] placeholder:text-[#111D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3978E8]/40 focus:border-[#3978E8]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signingInProvider !== null}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#3978E8] hover:bg-[#2B64CC] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <span>
                    {signingInProvider === 'password'
                      ? mode === 'signup'
                        ? 'Creating Account...'
                        : 'Signing In...'
                      : mode === 'signup'
                        ? 'Create Account'
                        : 'Sign In'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-xs text-[#111D3B]/60 hover:text-[#111D3B] underline-offset-4 hover:underline cursor-pointer"
                >
                  Continue locally as guest
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
