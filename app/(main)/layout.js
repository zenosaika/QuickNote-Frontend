"use client";

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation'; 
import Spinner from '../components/Spinner';

export default function MainAppLayout({ children }) {
  const { user, isLoading} = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
        <Spinner className="text-blue-500 w-8 h-8" />
        <p className="mt-3 text-white">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black text-white">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}