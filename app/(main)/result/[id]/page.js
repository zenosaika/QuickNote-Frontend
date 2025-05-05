"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Spinner from '@/app/components/Spinner';
import { useAuth } from '@/app/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


const getSpeakerColor = (speakerId) => {
    const colors = [
        'text-cyan-300', 'text-pink-300', 'text-lime-300', 'text-yellow-300',
        'text-orange-300', 'text-purple-300', 'text-teal-300', 'text-indigo-300'
    ];
    const fallbackColor = 'text-gray-400';

    try {
        let numericId = NaN;
        if (typeof speakerId === 'number') { numericId = speakerId; }
        else if (typeof speakerId === 'string') {
            const match = speakerId.match(/\d+/);
            if (match) { numericId = parseInt(match[0], 10); }
            else if (speakerId.toLowerCase().includes('unknown')) { return fallbackColor; }
            else {
                let hash = 0;
                for (let i = 0; i < speakerId.length; i++) {
                    const char = speakerId.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char; hash |= 0;
                }
                numericId = Math.abs(hash);
            }
        }
        if (!isNaN(numericId) && numericId >= 0) { return colors[numericId % colors.length] || fallbackColor; }
    } catch (e) { console.error("Error parsing speaker ID for color:", speakerId, e); }
    return fallbackColor;
};


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


export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  const { user, isLoading: authLoading } = useAuth();

  const [resultData, setResultData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Result Page: User not authenticated, redirecting to login.");
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!id) {
        setError("No transcription ID found in the URL.");
        setIsLoading(false);
        return;
    }
    if (authLoading) {
        setIsLoading(true);
        return;
    }
    if (!user) {
        setIsLoading(false);
        return;
    }

    const fetchResult = async () => {
      console.log(`Result Page: Fetching data for ID: ${id}`);
      setIsLoading(true);
      setError('');
      setResultData(null);

      try {
        const response = await fetch(`/api/transcription/${id}`, {
           method: 'GET',
           credentials: 'include',
           headers: {
               'Accept': 'application/json',
           }
        });

        if (!response.ok) {
             let errorMsg = `Error fetching data (Status: ${response.status})`;
             if (response.status === 401) { errorMsg = "Authentication failed. Please log in."; }
             else if (response.status === 403) { errorMsg = "Access denied. You don't have permission to view this."; }
             else if (response.status === 404) { errorMsg = "Transcription not found."; }
             else {
                 try { errorMsg = (await response.json()).detail || errorMsg } catch (_) {}
             }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log("Result Page: Fetched Transcription Detail:", data);

        if (!data || !data.id) {
            throw new Error("Invalid data format received from server (missing ID).");
        }
        if (data.result && data.result.transcriptions && !Array.isArray(data.result.transcriptions)) {
             console.error("Invalid 'transcriptions' format in result:", data.result);
             throw new Error("Invalid transcription segment data received.");
        }

        setResultData(data);

      } catch (err) {
        console.error('Result Page: Error fetching transcription result:', err);
        setError(err.message || 'An unexpected error occurred while fetching details.');
        setResultData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();

  }, [id, user, authLoading]);

  if (isLoading || authLoading) {
      return (
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
              <Spinner className="text-blue-400 w-10 h-10" />
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
             <div className="w-full max-w-2xl text-center p-6 bg-red-900/70 border border-red-700/80 text-red-300 rounded-xl shadow-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                 </svg>
                 <h3 className="mt-3 text-xl font-semibold text-red-100">Error Loading Transcription</h3>
                 <p className="mt-2 text-sm">{error}</p>
                 <div className="mt-6">
                     <Link href="/history" className="font-medium text-blue-300 hover:text-blue-200 hover:underline underline-offset-2 transition duration-150 ease-in-out">
                         &larr; Go back to History
                     </Link>
                 </div>
             </div>
         </div>
      );
  }

  if (!resultData || !resultData.id) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
             <div className="w-full max-w-2xl text-center p-6 bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl border border-blue-900/50">
                 <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                 </svg>
                 <h3 className="mt-3 text-xl font-semibold text-white">Transcription Data Unavailable</h3>
                 <p className="mt-2 text-base text-blue-200/90">
                     The requested transcription details could not be loaded or are invalid.
                 </p>
                 <div className="mt-6">
                     <Link href="/history" className="font-medium text-blue-300 hover:text-blue-200 hover:underline underline-offset-2 transition duration-150 ease-in-out">
                         &larr; Go back to History
                     </Link>
                 </div>
             </div>
         </div>
      );
  }

  const transcriptionSegments = resultData.result?.transcriptions ?? [];
  const summaryText = resultData.summarized_text ?? null;

  return (
    <div className="space-y-10 pb-20 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">

      <div className="pt-8 pb-5 border-b border-blue-800/70">
          <Link href="/history" className="text-sm font-medium text-blue-400 hover:text-blue-300 mb-4 inline-flex items-center gap-1.5 transition-colors duration-150 group">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
             </svg>
             Back to History
          </Link>
         <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 mb-3 break-words">
            {resultData.filename || `Transcription Result`}
         </h1>
         <div className="mt-2 text-sm text-blue-200/80 flex flex-wrap items-center gap-x-4 gap-y-1">
             <span>
                Transcribed: <span className="text-cyan-300 font-medium">{formatDate(resultData.created_at)}</span>
             </span>
             <span>
                Status: <span className="font-medium text-cyan-300 capitalize">{resultData.status || 'N/A'}</span>
             </span>
         </div>
      </div>

      <div className="w-full bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-blue-900/50">
         <h2 className="text-2xl font-semibold text-white mb-5 border-b border-blue-800/70 pb-3">
            Summary
         </h2>
         {summaryText && typeof summaryText === 'string' && summaryText.trim() !== '' ? (
             <div className="prose prose-invert prose-sm sm:prose-base max-w-none
                             prose-headings:text-cyan-300 prose-a:text-blue-400 hover:prose-a:text-blue-300
                             prose-strong:text-white prose-code:text-pink-300 prose-code:bg-gray-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                             prose-blockquote:border-l-blue-500 prose-blockquote:text-blue-200/90
                             bg-gray-900/50 p-4 border border-blue-800/60 rounded-lg">
                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
                     {summaryText}
                 </ReactMarkdown>
             </div>
         ) : (
             <div className="bg-gray-900/50 p-4 border border-blue-800/60 rounded-lg">
                 <p className="text-blue-200/80 italic">No summary is available for this transcription.</p>
             </div>
         )}
      </div>

      <div className="w-full bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-blue-900/50">
        <h2 className="text-2xl font-semibold text-white mb-6 border-b border-blue-800/70 pb-3">
            Full Transcription
        </h2>
        {transcriptionSegments.length === 0 ? (
            <div className="bg-gray-900/50 p-4 border border-blue-800/60 rounded-lg">
               <p className="text-blue-200/80 italic">No transcribed segments were found in this result.</p>
            </div>
        ) : (
           <div className="bg-gray-900/50 p-4 border border-blue-800/60 rounded-lg max-h-[75vh] overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
               {transcriptionSegments.map((segment, index) => {
                   const isValidSegment = segment && typeof segment === 'object';
                   const speakerId = isValidSegment ? segment.speaker_id : 'UNKNOWN';
                   const speakerColor = getSpeakerColor(speakerId);
                   const formatTime = (time) => typeof time === 'number' ? time.toFixed(2) : (time || '??.??');
                   const startTimeStr = formatTime(isValidSegment ? segment.start_time : null);
                   const endTimeStr = formatTime(isValidSegment ? segment.end_time : null);
                   const transcriptText = isValidSegment ? (segment.transcript || '') : '(Invalid segment data)';

                   let speakerLabel = 'Unknown';
                   if (speakerId !== 'UNKNOWN') {
                        if (typeof speakerId === 'number') {
                            speakerLabel = `Speaker ${speakerId}`;
                        } else if (typeof speakerId === 'string') {
                            const match = speakerId.match(/\d+/);
                            if (match) {
                                speakerLabel = `Speaker ${match[0]}`;
                            } else if (!speakerId.toLowerCase().includes('unknown')) {
                                speakerLabel = `ID: ${speakerId}`;
                            }
                        }
                   }

                  return (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-x-4 gap-y-2 border-b border-blue-800/50 pb-4 last:border-b-0">
                      <div className="flex-shrink-0 w-full sm:w-48 text-xs text-blue-200/80 flex flex-row sm:flex-col items-center sm:items-start gap-1.5 sm:pt-0.5">
                        <span className="bg-gray-700/60 px-2 py-0.5 rounded whitespace-nowrap font-mono tabular-nums">
                            {startTimeStr}s - {endTimeStr}s
                        </span>
                        <span className={`font-semibold px-2 py-0.5 rounded ${speakerColor} bg-black/40 whitespace-nowrap`}>
                            {speakerLabel}
                        </span>
                      </div>
                      <p className={`flex-grow text-base sm:text-lg leading-relaxed ${speakerColor} whitespace-pre-wrap break-words`}>
                          {transcriptText || <span className="italic text-gray-500">(Empty segment)</span>}
                      </p>
                    </div>
                  );
                })}
              </div>
        )}
      </div>
    </div>
  );
}
