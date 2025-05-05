"use client";

import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useAuth } from './context/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const isLoggedIn = !!user;

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black">
        <Navbar />
        <main className="flex-grow flex items-center justify-center text-center px-4">
          <p className="text-blue-300 text-lg animate-pulse">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center text-center px-4 py-20 sm:py-24 lg:py-32">
        <div className="max-w-3xl">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-tight
                         bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500
                         bg-clip-text text-transparent drop-shadow-md">
            Effortless Audio Transcription
          </h1>

          <p className="text-lg sm:text-xl text-blue-200 mb-10 text-balance leading-relaxed">
            Upload your audio files and get accurate, speaker-separated text transcripts in minutes. Perfect for meetings, interviews, lectures, and more.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            {isLoggedIn ? (
              <Link
                href="/transcribe"
                className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-blue-400/40 text-lg"
              >
                Go to Transcriber
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg hover:shadow-blue-400/40 text-lg"
                >
                  Get Started
                </Link>
                <Link
                  href="/login"
                  className="inline-block bg-transparent border-2 border-blue-500 text-blue-300 hover:bg-blue-500 hover:text-white font-semibold py-3 px-10 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md text-lg"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}