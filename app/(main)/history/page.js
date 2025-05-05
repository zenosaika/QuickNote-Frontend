"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Spinner from '@/app/components/Spinner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  try {
    const utcDateString = dateString.includes('T')
        ? (dateString.endsWith('Z') ? dateString : dateString + 'Z')
        : dateString.replace(' ', 'T') + 'Z';

    const date = new Date(utcDateString);

    if (isNaN(date.getTime())) {
      console.error("Could not parse date:", dateString);
      return dateString;
    }

    return date.toLocaleString('en-US', { 
        timeZone: 'Asia/Bangkok',
        dateStyle: 'medium',
        timeStyle: 'short'
    });
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return dateString;
  }
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchHistory = async () => {
    if (authLoading || !user) {
       setIsLoading(false);
       return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/history', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        let errorMsg = `Failed to fetch history (Status: ${response.status})`;
        if (response.status === 401) {
          errorMsg = "Authentication error. Please log in again.";
        } else {
          try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorData.message || errorMsg;
          } catch (_) {}
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("Fetched History:", data);
      setHistory(Array.isArray(data) ? data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : []);

    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'An unexpected error occurred while fetching history.');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchHistory();
    }
  }, [user, authLoading, fetchHistory]);

  const handleDelete = async (id, filename) => {
    if (!confirm(`Are you sure you want to delete the transcription for "${filename || 'this item'}"? This action cannot be undone.`)) {
      return;
    }

    console.log(`Attempting to delete transcription ${id}`);
    setError('');

    try {
      const response = await fetch(`/api/transcription/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        let errorMsg = `Failed to delete (Status: ${response.status})`;
        if (response.status === 401) errorMsg = "Authentication error.";
        else if (response.status === 403) errorMsg = "You don't have permission to delete this.";
        else if (response.status === 404) errorMsg = "Transcription not found.";
        else {
          try { errorMsg = (await response.json()).detail || errorMsg } catch (_) { }
        }
        throw new Error(errorMsg);
      }

      setHistory(prevHistory => prevHistory.filter(item => item.id !== id));
      console.log(`Successfully deleted transcription ${id}`);

    } catch (err) {
      console.error('Error deleting transcription:', err);
      setError(`Delete failed: ${err.message}`);
    }
  };

  if (authLoading || (isLoading && history.length === 0)) {
     return (
       <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
         <Spinner className="text-blue-400 w-10 h-10" />
       </div>
     );
  }

  return (
    <div className="space-y-10 pb-20 px-4 md:px-8 lg:px-12">
      <div className="text-center pt-8">
         <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 mb-3">
              Transcription History
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
              Review, view details, or delete your past transcriptions.
          </p>
      </div>

      {error && (
         <div className="max-w-4xl mx-auto p-4 bg-red-900/70 border border-red-700/80 text-red-300 rounded-lg text-sm text-center">
            <strong className="font-semibold">Error:</strong> {error}
         </div>
      )}

      {!isLoading && !error && history.length === 0 && (
         <div className="text-center py-12 px-6 max-w-2xl mx-auto bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-900/50">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
           <h3 className="mt-2 text-xl font-semibold text-white">No History Yet</h3>
           <p className="mt-1 text-base text-blue-200/90">Get started by transcribing your first audio file.</p>
           <div className="mt-6">
             <Link
                href="/transcribe"
                className="inline-flex items-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-lg text-sm font-semibold text-white
                           bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800
                           transition duration-300 ease-in-out transform hover:scale-[1.02]"
             >
                Go to Transcriber
             </Link>
           </div>
         </div>
      )}

      {!isLoading && history.length > 0 && (
        <div className="space-y-4 max-w-4xl mx-auto">
          {history.map((item) => (
            <div key={item.id} className="bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-lg border border-blue-900/50 hover:border-blue-700/80 transition-colors duration-150 ease-in-out overflow-hidden">
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start gap-4">
                 <div className="flex-grow min-w-0">
                    <Link href={`/result/${item.id}`} className="block group">
                        <h3 className="text-lg font-semibold text-cyan-300 truncate group-hover:text-cyan-200 group-hover:underline underline-offset-2" title={item.filename}>
                            {item.filename || 'Untitled Transcription'}
                        </h3>
                    </Link>
                    <p className="text-sm text-blue-200/80 mt-1">
                        {formatDate(item.created_at)}
                    </p>
                 </div>
                 <div className="flex-shrink-0 flex flex-row sm:flex-col items-stretch sm:items-end gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                    <Link
                        href={`/result/${item.id}`}
                        className="text-center text-sm font-medium text-blue-300 hover:text-white whitespace-nowrap px-4 py-1.5 rounded-md bg-gray-700/70 hover:bg-blue-700/80 transition-all duration-150 ease-in-out shadow-sm border border-blue-800/50 hover:border-blue-600"
                    >
                        View Details
                    </Link>
                     <button
                       onClick={() => handleDelete(item.id, item.filename)}
                       title="Delete Transcription"
                       className="text-center text-sm font-medium text-red-300 hover:text-white whitespace-nowrap px-4 py-1.5 rounded-md bg-gray-700/70 hover:bg-red-600/70 transition-all duration-150 ease-in-out shadow-sm border border-red-800/50 hover:border-red-600"
                      >
                       Delete
                     </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}