import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import axios from 'axios';
import { setAuthToken, setUser } from '@/lib/auth';
import logo from '@/assets/logo.png';
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" fillRule="evenodd">
        <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
      </g>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // ── Email / Password ──────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? `${API}/auth/login` : `${API}/auth/signup`;
      const res = await axios.post(endpoint, { email, password });
      setAuthToken(res.data.token);
      setUser(res.data.user);
      toast.success(isLogin ? 'Logged in successfully' : 'Account created successfully');
      navigate('/');
    } catch (err) {
      if (!err.response) {
        toast.error(`Cannot reach backend at ${BACKEND_URL}. Make sure the API server is running.`);
      } else {
        toast.error(err.response?.data?.detail || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    setGoogleError('');
    setGoogleLoading(true);
    try {
      // 1. Firebase popup
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (firebaseErr) {
        if (
          firebaseErr.code === 'auth/popup-closed-by-user' ||
          firebaseErr.code === 'auth/cancelled-popup-request'
        ) {
          return;
        }
        setGoogleError(`Firebase error (${firebaseErr.code}): ${firebaseErr.message}`);
        return;
      }

      // 2. Get ID token
      let idToken;
      try {
        idToken = await result.user.getIdToken(true);
      } catch (tokenErr) {
        setGoogleError(`Token error: ${tokenErr.message}`);
        return;
      }

      // 3. Send to backend using a fresh axios instance so the global 401
      //    interceptor (which calls logout + redirect) doesn't fire here
      let res;
      try {
        res = await axios.create().post(`${API}/auth/google`, { id_token: idToken });
      } catch (backendErr) {
        const detail =
          backendErr.response?.data?.detail ||
          JSON.stringify(backendErr.response?.data) ||
          backendErr.message ||
          'No response from server';
        const status = backendErr.response?.status ?? 'network error';
        setGoogleError(`Backend (${status}): ${detail}`);
        return;
      }

      // 4. Store exactly like email/password login
      setAuthToken(res.data.token);
      setUser(res.data.user);
      toast.success('Signed in with Google');
      navigate('/');
    } finally {
      setGoogleLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Toaster />
      <Card className="w-full max-w-md p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="FinFusion logo" className="h-16 object-contain" />
          </div>
          <p className="text-gray-600">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        {/* Persistent error box — stays visible until dismissed */}
        {googleError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span className="flex-1 break-all">{googleError}</span>
            <button
              onClick={() => setGoogleError('')}
              className="shrink-0 text-red-400 hover:text-red-600 font-bold text-lg leading-none ml-1"
            >×</button>
          </div>
        )}

        {/* Google button */}
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-3 h-11 mb-4 border-slate-300 hover:bg-slate-50 font-medium text-slate-700"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? 'Connecting…' : 'Continue with Google'}
        </Button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400 font-medium uppercase tracking-wide">or</span>
          </div>
        </div>

        {/* Email / password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? 'Loading…' : isLogin ? 'Login' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-blue-600 hover:underline"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        </div>

        {/* Demo accounts */}
        <div className="mt-6 pt-6 border-t space-y-3">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Demo accounts</p>
            <p className="text-xs text-gray-500 mt-1">
              One preloaded account and one clean account for live manual entry
            </p>
          </div>
          <Button
            type="button"
            onClick={() => { setEmail('demo@example.com'); setPassword('demo123'); setIsLogin(true); }}
            variant="outline"
            className="w-full justify-between"
          >
            <span className="font-semibold">Use Preloaded Demo</span>
            <span className="text-xs text-gray-500">demo@example.com</span>
          </Button>
          <Button
            type="button"
            onClick={() => { setEmail('demo2@example.com'); setPassword('demo123'); setIsLogin(true); }}
            variant="outline"
            className="w-full justify-between"
          >
            <span className="font-semibold">Use Empty Demo</span>
            <span className="text-xs text-gray-500">demo2@example.com</span>
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Password for both accounts: demo123
          </p>
        </div>

      </Card>
    </div>
  );
}
