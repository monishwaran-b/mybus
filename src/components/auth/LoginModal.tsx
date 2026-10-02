import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { UserRole } from '../../types/index.ts';
import { Bus, X, Shield, Lock, ArrowRight, Eye, EyeOff, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
  onSuccessRedirect?: (targetRole: UserRole) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'ROLE_SUPER_ADMIN',
  onSuccessRedirect,
}) => {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
    setError(null);
    if (newRole === 'ROLE_SUPER_ADMIN') {
      setIdentifier('admin');
      setPassword('admin123');
    } else if (newRole === 'ROLE_COLLEGE_ADMIN' || newRole === 'ROLE_ADMIN') {
      setIdentifier('collegeadmin');
      setPassword('admin123');
    } else if (newRole === 'ROLE_DRIVER') {
      setIdentifier('driver01');
      setPassword('driver123');
    } else if (newRole === 'ROLE_STUDENT') {
      setIdentifier('student01');
      setPassword('student123');
    } else if (newRole === 'ROLE_PARENT') {
      setIdentifier('parent01');
      setPassword('student123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login({
        username: identifier.trim(),
        password,
        role,
      });
      if (onSuccessRedirect) {
        onSuccessRedirect(res.user.role);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotIdentifier.trim() || identifier.trim());
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg(err.message || 'Unable to reset password. Please contact administrator.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-[#090e1a] border border-slate-800 p-6 sm:p-8 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7067ff] to-[#26d9ff] mx-auto flex items-center justify-center text-white shadow-lg shadow-[#7067ff]/20">
            <Bus className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-white">Sign In to MyBus</h2>
          <p className="text-xs text-slate-400">
            Secure BCrypt Authentication & Role-Based Access Control
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => handleRoleSelect('ROLE_SUPER_ADMIN')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
              role === 'ROLE_SUPER_ADMIN'
                ? 'bg-[#7067ff] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Super
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('ROLE_COLLEGE_ADMIN')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
              role === 'ROLE_COLLEGE_ADMIN' || role === 'ROLE_ADMIN'
                ? 'bg-[#7067ff] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('ROLE_DRIVER')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
              role === 'ROLE_DRIVER'
                ? 'bg-[#7067ff] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Driver
          </button>
          <button
            type="button"
            onClick={() => handleRoleSelect('ROLE_STUDENT')}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate ${
              role === 'ROLE_STUDENT'
                ? 'bg-[#7067ff] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Student
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Username / Student ID / Email</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. admin, student01"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#7067ff]"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(identifier);
                  setIsForgotOpen(true);
                }}
                className="text-[11px] text-[#26d9ff] hover:underline cursor-pointer"
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
                placeholder="Enter password"
                className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#7067ff]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#7067ff] hover:bg-[#6056f0] text-white text-xs font-bold transition-all shadow-lg shadow-[#7067ff]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating with BCrypt...' : 'Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Pre-seeded credentials summary box */}
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Fictional Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 font-mono">
            <div>• Super Admin: <span className="text-white">admin</span> / <span className="text-slate-300">admin123</span></div>
            <div>• College Admin: <span className="text-white">collegeadmin</span> / <span className="text-slate-300">admin123</span></div>
            <div>• Driver: <span className="text-white">driver01</span> / <span className="text-slate-300">driver123</span></div>
            <div>• Student: <span className="text-white">student01</span> / <span className="text-slate-300">student123</span></div>
          </div>
        </div>

        {/* Forgot password inner dialog */}
        {isForgotOpen && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-slate-200 font-semibold">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Password Assistance</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setForgotMsg(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            {forgotMsg ? (
              <p className="text-[11px] text-emerald-400">{forgotMsg}</p>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="Enter username or student ID"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleForgotSubmit}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold text-xs transition-colors"
                >
                  Retrieve / Reset Demo Password
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
