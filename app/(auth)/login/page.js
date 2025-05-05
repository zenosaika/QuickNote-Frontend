"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Spinner from '@/app/components/Spinner';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Form submission loading
  const router = useRouter();
  const { user, isLoading: authLoading, checkUserSession } = useAuth(); // Auth context loading
  const searchParams = useSearchParams();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      console.log("Login Page Effect: User already logged in, redirecting to /transcribe");
      router.replace('/transcribe');
    }
  }, [user, authLoading, router]);

  // Show success message on redirect from registration
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please log in.');
    }
  }, [searchParams]);

  // Handle form submission
  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        let errorMsg = 'Login failed. Please check your credentials.';
        if (response.status === 400 || response.status === 422) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg;
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      console.log('Login API call successful. Checking session and redirecting...');

      await checkUserSession(); 
      router.push('/transcribe');

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setPassword('');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black">
        <Spinner className="text-blue-400 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black px-4 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-900/50">

        <h2 className="text-3xl font-bold text-center text-white mb-2">Welcome Back!</h2>
        <p className="text-center text-blue-200 text-sm mb-6">Login to access your transcriptions.</p>

        {successMessage && (
          <p className="text-sm text-green-300 bg-green-900/70 border border-green-700/80 px-4 py-3 rounded-lg text-center">
            {successMessage}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-300 bg-red-900/70 border border-red-700/80 px-4 py-3 rounded-lg text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-4 py-2.5 border border-blue-800/70 rounded-lg shadow-sm placeholder-gray-500
                         text-white bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                         disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-2.5 border border-blue-800/70 rounded-lg shadow-sm placeholder-gray-500
                         text-white bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                         disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white
                         bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800
                         disabled:opacity-60 disabled:cursor-not-allowed transition duration-300 ease-in-out transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <>
                  <Spinner className="text-white w-4 h-4" />
                  <span>Logging In...</span>
                </>
              ) : (
                'Log In'
              )}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-blue-200/80 mt-8">
          Don't have an account?
          <Link href="/register" className="font-medium text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 transition duration-150 ease-in-out">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}