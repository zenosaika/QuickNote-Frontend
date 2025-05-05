"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Spinner from '@/app/components/Spinner';
import { useAuth } from '@/app/context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/transcribe');
    }
  }, [user, authLoading, router]);

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const registrationData = {
      email: email,
      password: password,
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        let errorMsg = 'Registration failed. Please try again.';
        if (response.status === 400) {
          try {
            const errorData = await response.json();
            if (errorData.detail?.includes("REGISTER_USER_ALREADY_EXISTS")) {
              errorMsg = "An account with this email already exists.";
            } else {
              errorMsg = errorData.detail || errorMsg;
            }
          } catch (_) {}
        } else if (response.status === 422) {
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail?.[0]?.msg || "Invalid input provided.";
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      console.log('Registration successful');
      router.push('/login?registered=true');

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setPassword('');
      setConfirmPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black">
        <Spinner className="text-blue-400 w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black px-4 py-12">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-900/50">

        <h2 className="text-3xl font-bold text-center text-white mb-2">Create Your Account</h2>
        <p className="text-center text-blue-200 text-sm mb-6">Join us to start transcribing effortlessly.</p>

        {error && (
          <p className="text-sm text-red-300 bg-red-900/70 border border-red-700/80 px-4 py-3 rounded-lg text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-1.5">Email Address</label>
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
            <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-1.5">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-2.5 border border-blue-800/70 rounded-lg shadow-sm placeholder-gray-500
                         text-white bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                         disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              placeholder="Create a password"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-200 mb-1.5">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="appearance-none block w-full px-4 py-2.5 border border-blue-800/70 rounded-lg shadow-sm placeholder-gray-500
                         text-white bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm
                         disabled:opacity-70 disabled:cursor-not-allowed transition duration-150 ease-in-out"
              placeholder="Retype your password"
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
                  <span>Registering...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-blue-200/80 mt-8">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300 hover:underline underline-offset-2 transition duration-150 ease-in-out">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}