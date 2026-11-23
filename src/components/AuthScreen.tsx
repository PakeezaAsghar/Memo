import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { api } from '../lib/api';
import { useWorkspace } from '../context/WorkspaceContext';
import { BrandMark } from './BrandMark';

type AuthView = 'login' | 'register' | 'verify' | 'forgot' | 'reset';

export function AuthScreen() {
  const { setSessionUser, notify } = useWorkspace();
  const [view, setView] = useState<AuthView>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await api.login(email, password);
      await setSessionUser(res.token, res.user);
      notify(`Welcome back, ${res.user.name.split(' ')[0]}`);
    } catch (err) {
      const e2 = err as Error & { payload?: Record<string, unknown> };
      if (e2.payload?.requiresVerification) {
        setPreviewCode(
          typeof e2.payload.verificationPreviewCode === 'string'
            ? e2.payload.verificationPreviewCode
            : null
        );
        setView('verify');
        setInfo('Please verify your email to continue.');
      } else {
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail === 'clarie@myspace.app') {
          setError('No account found for clarie@myspace.app. Did you mean claire@myspace.app?');
        } else {
          setError(e2.message);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await api.login('claire@myspace.app', 'MySpace2026!');
      await setSessionUser(res.token, res.user);
      notify('Opened Claire’s sample workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const res = await api.register(name, email, password);
      setPreviewCode(res.verificationPreviewCode || null);
      setInfo('Account created! Enter the verification code below to unlock your space.');
      setView('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.verifyEmail(email, code);
      await setSessionUser(res.token, res.user);
      notify('Email verified! Welcome to Memo.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.forgotPassword(email);
      setPreviewCode(res.resetPreviewCode || null);
      setInfo('Reset code ready. Enter it with your new password.');
      setView('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request reset.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api.resetPassword(email, code, newPassword);
      setInfo(res.message);
      setPassword('');
      setCode('');
      setPreviewCode(null);
      setView('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg-main)] text-[var(--text-main)]">
      {/* Left side: Forms on crystal-clear sage botanical backdrop */}
      <div
        className="flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-cover bg-center"
        style={{
          backgroundImage: "url('/assets/aistudio/607352699797516201-25kb_f8c84fe5.jpg')",
        }}
      >
        <div className="flex items-center justify-between">
          <BrandMark />
        </div>

        <div className="w-full max-w-[400px] mx-auto my-8">
          {view === 'login' && (
            <div>
              <h1 className="font-editorial text-[32px] leading-tight text-[#1E221A]">
                Welcome back to your space
              </h1>
              <p className="text-[14px] font-medium text-[#343A2F] mt-2">
                Sign in to access your notes, files, journal, and daily plans.
              </p>

              <form
                onSubmit={handleLogin}
                className="mt-6 space-y-4 rounded-[20px] p-6 bg-[var(--bg-card)]/52 dark:bg-[var(--bg-card)]/68 border border-white/75 dark:border-white/15 shadow-[0_14px_36px_rgba(57,54,47,0.10)]"
              >
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] dark:text-[var(--text-main)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-[44px] pl-3.5 pr-10 rounded-[11px] bg-white/45 dark:bg-[var(--bg-card)]/45 border border-white/85 dark:border-white/20 text-[14px] text-[#1E221A] dark:text-[var(--text-main)] placeholder:text-[#4C5446] dark:placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#3B4E33] transition-colors"
                    />
                    <User className="w-4 h-4 text-[#343A2F] dark:text-[var(--text-main)]/75 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-semibold text-[#23281F] dark:text-[var(--text-main)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setInfo(null);
                        setView('forgot');
                      }}
                      className="text-[12px] font-semibold text-[#3B4E33] dark:text-[var(--sage-dark)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-[44px] pl-3.5 pr-10 rounded-[11px] bg-white/45 dark:bg-[var(--bg-card)]/45 border border-white/85 dark:border-white/20 text-[14px] text-[#1E221A] dark:text-[var(--text-main)] placeholder:text-[#4C5446] dark:placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#3B4E33] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#343A2F] dark:text-[var(--text-main)]/75 hover:text-[#1E221A] transition-colors"
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-[13px] text-[var(--error)] bg-[var(--blush)]/75 border border-[var(--error)]/30 rounded-[10px] px-3 py-2">
                    {error}
                  </p>
                )}
                {info && (
                  <p className="text-[13px] text-[#3B4E33] dark:text-[var(--sage-dark)] bg-[var(--sage-soft)]/90 rounded-[10px] px-3 py-2">
                    {info}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-[44px] rounded-[11px] bg-gradient-to-r from-[#A9B79A] via-[var(--sage)] to-[var(--sage-dark)] hover:brightness-95 border border-white/60 dark:border-white/20 text-white text-[14px] font-semibold shadow-[0_6px_16px_rgba(100,118,91,0.24)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? 'Signing in…' : 'Sign in'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-4 border-t border-white/55 dark:border-white/15">
                  <button
                    type="button"
                    onClick={handleDemoSignIn}
                    disabled={busy}
                    className="group memo-bounce-btn relative overflow-visible w-full h-[42px] rounded-[11px] bg-white/65 dark:bg-[var(--bg-card)]/65 border border-white/85 dark:border-white/20 hover:bg-white/85 dark:hover:bg-[var(--bg-card)]/85 text-[13px] font-semibold text-[#1E221A] dark:text-[var(--text-main)] transition-colors flex items-center justify-center gap-2"
                  >
                    <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
                      <span className="memo-ripple-ring memo-ripple-ring-1" />
                      <span className="memo-ripple-ring memo-ripple-ring-2" />
                      <span className="memo-ripple-ring memo-ripple-ring-3" />
                    </span>
                    <span className="relative z-10 inline-flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#3B4E33] dark:text-[var(--sage-dark)] transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none" />
                      Explore Claire’s Workspace (claire@myspace.app)
                    </span>
                  </button>
                </div>

                <p className="pt-1 text-center text-[13px] font-normal text-[#525A4B] dark:text-[var(--text-main)]/70">
                  New to Memo?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setInfo(null);
                      setView('register');
                    }}
                    className="font-semibold text-[#3B4E33] dark:text-[var(--sage-dark)] hover:underline"
                  >
                    Create an account
                  </button>
                </p>
              </form>
            </div>
          )}

          {view === 'register' && (
            <div>
              <h1 className="font-editorial text-[32px] leading-tight text-[#1E221A]">
                Create your personal corner
              </h1>
              <p className="text-[14px] font-medium text-[#343A2F] mt-2">
                Set up a private workspace with your own isolated notes, files, and tracker data.
              </p>
              <form
                onSubmit={handleRegister}
                className="mt-6 space-y-4 rounded-[20px] p-6 bg-[var(--bg-card)]/52 dark:bg-[var(--bg-card)]/68 border border-white/75 dark:border-white/15 shadow-[0_14px_36px_rgba(57,54,47,0.10)]"
              >
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] dark:text-[var(--text-main)] mb-1.5">
                    Full name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Claire Lin"
                      className="w-full h-[44px] pl-3.5 pr-10 rounded-[11px] bg-white/45 dark:bg-[var(--bg-card)]/45 border border-white/85 dark:border-white/20 text-[14px] text-[#1E221A] dark:text-[var(--text-main)] placeholder:text-[#4C5446] dark:placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#3B4E33] transition-colors"
                    />
                    <User className="w-4 h-4 text-[#343A2F] dark:text-[var(--text-main)]/75 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] dark:text-[var(--text-main)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full h-[44px] pl-3.5 pr-10 rounded-[11px] bg-white/45 dark:bg-[var(--bg-card)]/45 border border-white/85 dark:border-white/20 text-[14px] text-[#1E221A] dark:text-[var(--text-main)] placeholder:text-[#4C5446] dark:placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#3B4E33] transition-colors"
                    />
                    <Mail className="w-4 h-4 text-[#343A2F] dark:text-[var(--text-main)]/75 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] dark:text-[var(--text-main)] mb-1.5">
                    Password (6+ characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full h-[44px] pl-3.5 pr-10 rounded-[11px] bg-white/45 dark:bg-[var(--bg-card)]/45 border border-white/85 dark:border-white/20 text-[14px] text-[#1E221A] dark:text-[var(--text-main)] placeholder:text-[#4C5446] dark:placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[#3B4E33] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#343A2F] dark:text-[var(--text-main)]/75 hover:text-[#1E221A] transition-colors"
                    >
                      {showPassword ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-[13px] text-[var(--error)] bg-[var(--blush)]/75 border border-[var(--error)]/30 rounded-[10px] px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-[44px] rounded-[11px] bg-gradient-to-r from-[#A9B79A] via-[var(--sage)] to-[var(--sage-dark)] hover:brightness-95 border border-white/60 dark:border-white/20 text-white text-[14px] font-semibold shadow-[0_6px_16px_rgba(100,118,91,0.24)] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? 'Creating account…' : 'Create account'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="pt-1 text-center text-[13px] font-medium text-[#2A3025] dark:text-[var(--text-main)]/85">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setView('login');
                    }}
                    className="font-semibold text-[#3B4E33] dark:text-[var(--sage-dark)] hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            </div>
          )}

          {view === 'verify' && (
            <div>
              <div className="w-11 h-11 rounded-[12px] bg-[var(--sage-soft)] text-[#3B4E33] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="font-editorial text-[30px] leading-tight text-[#1E221A]">Verify your email</h1>
              <p className="text-[14px] font-medium text-[#343A2F] mt-2">
                Enter the 6-digit verification code for <strong>{email}</strong>.
              </p>
              {previewCode && (
                <div className="mt-4 p-3 rounded-[10px] bg-[var(--pale-yellow)] border border-[var(--border-color)] text-[12px] text-[var(--text-main)]">
                  Local verification code: <strong className="font-mono-num">{previewCode}</strong>
                </div>
              )}
              <form onSubmit={handleVerify} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] mb-1.5">
                    6-digit code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] font-mono-num text-[15px] tracking-widest text-[#1E221A] dark:text-[var(--text-main)] focus:outline-none focus:border-[#3B4E33]"
                  />
                </div>
                {error && (
                  <p className="text-[13px] text-[var(--error)] bg-[var(--blush)]/75 rounded-[8px] px-3 py-2">
                    {error}
                  </p>
                )}
                {info && (
                  <p className="text-[13px] text-[#3B4E33] bg-[var(--sage-soft)] rounded-[8px] px-3 py-2">
                    {info}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-[40px] rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[14px] font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {busy ? 'Verifying…' : 'Verify & enter workspace'}
                </button>
              </form>
              <div className="mt-4 flex items-center justify-between text-[13px] font-medium">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.resendVerification(email);
                      setPreviewCode(res.verificationPreviewCode || null);
                      setInfo('A new verification code was generated.');
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to resend.');
                    }
                  }}
                  className="font-semibold text-[#3B4E33] hover:underline"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-[#2F352A] hover:underline"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          {view === 'forgot' && (
            <div>
              <div className="w-11 h-11 rounded-[12px] bg-[var(--lavender)] text-[#574970] flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h1 className="font-editorial text-[30px] leading-tight text-[#1E221A]">Forgot password</h1>
              <p className="text-[14px] font-medium text-[#343A2F] mt-2">
                Enter your email address and we will issue a 6-digit password reset code.
              </p>
              <form onSubmit={handleForgot} className="mt-6 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] mb-1.5">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[#1E221A] dark:text-[var(--text-main)] focus:outline-none focus:border-[#3B4E33]"
                  />
                </div>
                {error && (
                  <p className="text-[13px] text-[var(--error)] bg-[var(--blush)]/75 rounded-[8px] px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-[40px] rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[14px] font-semibold transition-colors"
                >
                  {busy ? 'Generating…' : 'Send reset code'}
                </button>
              </form>
              <button
                type="button"
                onClick={() => setView('login')}
                className="mt-5 text-[13px] font-medium text-[#2F352A] hover:underline"
              >
                Back to sign in
              </button>
            </div>
          )}

          {view === 'reset' && (
            <div>
              <div className="w-11 h-11 rounded-[12px] bg-[var(--blush)] text-[var(--rose)] flex items-center justify-center mb-4">
                <KeyRound className="w-5 h-5" />
              </div>
              <h1 className="font-editorial text-[30px] leading-tight text-[#1E221A]">Reset password</h1>
              <p className="text-[14px] font-medium text-[#343A2F] mt-2">
                Enter your reset code and choose a new password for <strong>{email}</strong>.
              </p>
              {previewCode && (
                <div className="mt-4 p-3 rounded-[10px] bg-[var(--pale-yellow)] border border-[var(--border-color)] text-[12px] text-[#1E221A]">
                  Local reset code: <strong className="font-mono-num">{previewCode}</strong>
                </div>
              )}
              <form onSubmit={handleReset} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] mb-1.5">
                    Reset code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] font-mono-num text-[14px] text-[#1E221A] dark:text-[var(--text-main)] focus:outline-none focus:border-[#3B4E33]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#23281F] mb-1.5">
                    New password (6+ characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[#1E221A] dark:text-[var(--text-main)] focus:outline-none focus:border-[#3B4E33]"
                  />
                </div>
                {error && (
                  <p className="text-[13px] text-[var(--error)] bg-[var(--blush)]/45 rounded-[8px] px-3 py-2">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-[40px] rounded-[9px] bg-[var(--sage)] hover:bg-[var(--sage-dark)] text-white text-[14px] font-semibold transition-colors"
                >
                  {busy ? 'Updating…' : 'Update password'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-[12px] font-medium text-[#2F352A]">
          Everything you save stays private to your account.
        </p>
      </div>

      {/* Right side: Cozy editorial desk illustration */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[var(--bg-secondary)] border-l border-[var(--border-color)]">
        <div className="flex justify-end">
          <span className="font-hand text-[22px] text-[var(--sage-dark)]">
            Dream big, plan well.
          </span>
        </div>
        <div className="max-w-xl mx-auto w-full">
          <div className="rounded-[16px] overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-[0_18px_40px_rgba(57,54,47,0.08)]">
            <img
              src="/src/assets/images/desk_editorial_1795116544232.jpg"
              alt="Cozy personal desk with open notebook, flowers, and laptop"
              referrerPolicy="no-referrer"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <p className="font-editorial text-[24px] text-[var(--text-main)] mt-6 text-center leading-snug">
            “A little progress each day adds up to big results.”
          </p>
          <p className="text-[13px] text-[var(--text-secondary)] mt-2 text-center">
            Notes, files, study plans, journal reflections, and finances — thoughtfully gathered in one calm workspace.
          </p>
        </div>
        <div />
      </div>
    </div>
  );
}
