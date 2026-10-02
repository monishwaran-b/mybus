import React, { useState } from 'react';
import { useAuth, type LoginCredentials } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/index.ts';
import {
  Bus,
  Shield,
  User as UserIcon,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Info,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';

interface LoginPageProps {
  onSuccess?: (redirectTab: string) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ROLE_SUPER_ADMIN');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Demo accounts definition
  const demoAccounts = [
    {
      role: 'ROLE_SUPER_ADMIN' as UserRole,
      title: 'Super Admin',
      username: 'admin',
      password: 'admin123',
      description: 'Full System, RBAC, Users & Audits',
      badge: 'All Permissions',
      icon: '🛡️',
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
    },
    {
      role: 'ROLE_COLLEGE_ADMIN' as UserRole,
      title: 'College Admin',
      username: 'collegeadmin',
      password: 'admin123',
      description: 'Fleet, Students, Routes & Attendance',
      badge: 'Transport Head',
      icon: '🏢',
      color: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900',
    },
    {
      role: 'ROLE_DRIVER' as UserRole,
      title: 'Bus Driver',
      username: 'driver01',
      password: 'driver123',
      description: 'Assigned Bus (BUS-01), GPS & Trips',
      badge: 'Muthuvelan R.',
      icon: '🚌',
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
    },
    {
      role: 'ROLE_STUDENT' as UserRole,
      title: 'College Student',
      username: 'student01',
      password: 'student123',
      description: 'Pass 211421104001 • Bus & Stops',
      badge: 'Sarah Jenkins',
      icon: '🎓',
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
    },
  ];

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setIdentifier(acc.username);
    setPassword(acc.password);
    setSelectedRole(acc.role);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Username, Student ID, or Email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const credentials: LoginCredentials = {
        username: identifier.trim(),
        password: password,
        role: selectedRole,
      };

      const result = await login(credentials);

      // Inactivity or redirect target
      let targetTab = 'portal';
      if (result.user.role === 'ROLE_SUPER_ADMIN') targetTab = 'portal';
      else if (result.user.role === 'ROLE_COLLEGE_ADMIN' || result.user.role === 'ROLE_ADMIN') targetTab = 'portal';
      else if (result.user.role === 'ROLE_DRIVER') targetTab = 'driver';
      else if (result.user.role === 'ROLE_STUDENT') targetTab = 'portal';

      if (onSuccess) {
        onSuccess(targetTab);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Invalid username or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotMessage(null);

    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your Username, Student ID, or Registered Email.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotIdentifier.trim());
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotError(err.message || 'Unable to process password reset. Please contact admin.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 relative overflow-hidden">
        {/* Ambient Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-500" />

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <Bus className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Secure Authentication & Role-Based Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Sign In to MyBus
          </h1>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log in with your college credentials to access your role-specific dashboard with encrypted BCrypt authentication.
          </p>
        </div>

        {/* Quick Demo Accounts Selection Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant One-Click Demo Profiles</span>
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">Click to prefill</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {demoAccounts.map((acc) => {
              const isSelected = identifier.toLowerCase() === acc.username.toLowerCase();
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/90 ring-2 ring-indigo-500/20 shadow-xs'
                      : acc.color
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{acc.icon}</span>
                    <span className="text-[10px] font-mono font-bold bg-white/80 px-1.5 py-0.5 rounded-md border border-slate-200">
                      {acc.username}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs font-bold text-slate-900 truncate">{acc.title}</div>
                    <div className="text-[10px] text-slate-500 truncate">{acc.badge}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Authentication Failed</div>
              <div className="text-[11px] text-rose-700 mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Student ID Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Username / Student ID / Register Number</span>
              <span className="text-[11px] font-normal text-slate-400">e.g. admin, student01</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter username or student ID"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Password Field with Show/Hide Toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(identifier);
                  setIsForgotModalOpen(true);
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
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
                placeholder="Enter your account password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Remember this device (30-day session)</span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">BCrypt 10-Salt</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating with BCrypt...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Role Redirection Notice */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 space-y-1.5">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
            <span>Automatic Role-Based Redirection:</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500">
            <div>• <strong>Super Admin:</strong> Full Platform & Users</div>
            <div>• <strong>College Admin:</strong> Fleet & Attendance</div>
            <div>• <strong>Driver:</strong> Assigned Bus GPS & Trips</div>
            <div>• <strong>Student:</strong> Personal Bus Pass & ETA</div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Reset Account Password</h3>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your Username, Student ID, or registered email address. The system will safely generate a demo reset link or restore default demo credentials.
            </p>

            {forgotError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {forgotError}
              </div>
            )}

            {forgotMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Account Identifier</label>
                <input
                  type="text"
                  required
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="e.g. admin, student01, or email"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isForgotLoading ? 'Processing...' : 'Send Reset Instructions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
