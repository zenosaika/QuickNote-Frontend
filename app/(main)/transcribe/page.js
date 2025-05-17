"use client";

import { useState, useRef, useEffect } from 'react';
import Spinner from '@/app/components/Spinner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';


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


export default function TranscribePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState([]);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isInfoMessage, setIsInfoMessage] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

   useEffect(() => {
     if (!authLoading && !user) {
       router.push('/login');
     }
   }, [user, authLoading, router]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name)) {
        setSelectedFile(file);
        setFileName(file.name);
        setTranscription([]);
        setSummary('');
        setMessage('');
        setIsInfoMessage(false);
      } else {
        setMessage('Invalid file type. Please select a common audio file (MP3, WAV, M4A, OGG, FLAC, AAC).');
        setIsInfoMessage(false);
        setSelectedFile(null);
        setFileName('');
        setTranscription([]);
        setSummary('');
        if (fileInputRef.current) { fileInputRef.current.value = ''; }
      }
    } else {
        setSelectedFile(null);
        setFileName('');
    }
  };

  const handleTranscribe = async () => {
    if (!selectedFile) {
        setMessage('No file selected.');
        setIsInfoMessage(false);
        return;
    }

    setIsLoading(true);
    setMessage('');
    setIsInfoMessage(false);
    setTranscription([]);
    setSummary('');

    const formData = new FormData();
    formData.append('audio_file', selectedFile);

    try {
      console.log("Sending synchronous transcription request...");
      const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });

      if (!response.ok) {
        let responseMessage = `Request failed. Status: ${response.status}`;
        let isInformational = false;

        if (response.status === 400) { responseMessage = "Bad request. Please check the input file."; }
        else if (response.status === 401) { responseMessage = "Authentication error. Please log in again."; }
        else if (response.status === 413) { responseMessage = "File is too large. Please upload a smaller audio file."; }
        else if (response.status === 500) {
             responseMessage = "Audio processing may take a moment. Please check the history tab for updates.";
             isInformational = true;
             console.error("Server error 500 occurred during transcription request.");
             try { const errorData = await response.json(); console.error("Server error detail (500):", errorData.detail || "No detail provided"); } catch (_) {}
        }
        else if (response.status === 504) {
             responseMessage = "The server took too long to respond. Your file might still be processing. Please check the history page later for results.";
             isInformational = true;
        }
        else if (response.status > 500 && response.status < 600) {
             responseMessage = `The server encountered an error (${response.status}). Please check the history page later for results.`;
             isInformational = true;
             try { const errorData = await response.json(); console.error(`Server error detail (${response.status}):`, errorData.detail || "No detail provided"); } catch (_) {}
        }
        else {
             try { const errorData = await response.json(); responseMessage = errorData.detail || `Request failed with status ${response.status}.`; }
             catch (_) { responseMessage = `Request failed with status ${response.status}.`; }
        }

        setMessage(responseMessage);
        setIsInfoMessage(isInformational);

        const errorToThrow = new Error(responseMessage);
        errorToThrow.isInfo = isInformational;
        throw errorToThrow;
      }

      const data = await response.json();
      console.log("Backend Response (/api/transcribe):", data);

      if (data && data.transcriptions && Array.isArray(data.transcriptions)) { setTranscription(data.transcriptions); }
      else { console.warn("Transcription segments missing or invalid:", data); setTranscription([]); }
      if (data && typeof data.summarized_text === 'string') { setSummary(data.summarized_text); }
      else { console.log("No summary text received or invalid."); setSummary(''); }

      if (!(data?.transcriptions?.length > 0) && !(typeof data?.summarized_text === 'string' && data.summarized_text.length > 0)) {
          setMessage(`Received successful response, but no valid transcription or summary data was found.`);
          setIsInfoMessage(false);
      }

    } catch (err) {
      console.error('Transcription fetch error:', err.message);

      if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
          if (!message) {
              setMessage("Could not connect to the server. It might be busy or unavailable. Please check the history page later, as the process might have started.");
              setIsInfoMessage(true);
          }
      }

      setTranscription([]);
      setSummary('');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };

   if (authLoading) {
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
              Transcribe Audio
          </h1>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
          Upload your audio files and get accurate, speaker-separated text transcripts in minutes. Perfect for meetings, interviews, lectures, and more.
          </p>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-blue-900/50">
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          className="hidden"
          id="audioFile"
          disabled={isLoading}
        />
        <button
          onClick={triggerFileInput}
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-gray-800 disabled:opacity-60 disabled:cursor-not-allowed transition duration-300 ease-in-out transform hover:scale-[1.02] mb-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> </svg>
          {fileName ? 'Change Audio File' : 'Select Audio File'}
        </button>

        {fileName && ( <p className="text-sm text-center text-blue-200/90 mb-5 truncate p-2.5 bg-gray-700/50 border border-blue-800/60 rounded-lg"> Selected: <span className="font-medium text-cyan-300">{fileName}</span> </p> )}

        <button
          onClick={handleTranscribe}
          disabled={!selectedFile || isLoading}
          className={`w-full flex justify-center items-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 focus:ring-offset-gray-800 transition duration-300 ease-in-out transform hover:scale-[1.02] ${!selectedFile || isLoading ? 'bg-gray-600/70 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500'}`} >
          {isLoading ? ( <><Spinner className="text-white w-4 h-4" /><span>Transcribing...</span></> ) : ( <> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> </svg> <span>Start Transcription & Summary</span> </> )}
        </button>

        {message && !isLoading && (
          <div className={`mt-5 p-4 rounded-lg text-sm text-center border ${
              isInfoMessage
              ? 'bg-green-900/70 border-green-700/80 text-green-200'
              : 'bg-red-900/70 border-red-700/80 text-red-300'
          }`}>
            {/* <strong className="font-semibold block mb-1">
                {isInfoMessage ? 'Info:' : 'Error:'}
            </strong> */}
            <span>{message}</span>
            {isInfoMessage && (
                 <Link href="/history" className="block mt-2 font-semibold underline hover:text-green-100">View History</Link>
            )}
          </div>
        )}
      </div>

      {summary && !isLoading && !message && (
        <div className="w-full max-w-4xl mx-auto bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-blue-900/50 mt-10">
          <h2 className="text-2xl font-semibold text-white mb-5 border-b border-blue-800/70 pb-3"> Summary </h2>
          <div className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-cyan-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-code:text-pink-300 prose-code:bg-gray-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-blockquote:border-l-blue-500 prose-blockquote:text-blue-200/90 bg-gray-900/50 p-4 border border-blue-800/60 rounded-lg">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {transcription.length > 0 && !isLoading && !message && (
        <div className="w-full max-w-4xl mx-auto bg-gray-800/60 backdrop-blur-sm rounded-xl shadow-2xl p-6 md:p-8 border border-blue-900/50 mt-10">
          <h2 className="text-2xl font-semibold text-white mb-6 border-b border-blue-800/70 pb-3"> Full Transcription </h2>
          <div className="bg-gray-900/50 p-4 border border-blue-800/60 rounded-lg max-h-[70vh] overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800/50">
            {transcription.map((segment, index) => {
              const speakerColor = getSpeakerColor(segment.speaker_id);
              const startTimeStr = segment.start_timestamp || '??:??';
              const endTimeStr = segment.end_timestamp || '??:??';
              let speakerLabel = `Speaker ${segment.speaker_id}`;
              return (
                <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-x-4 gap-y-2 border-b border-blue-800/50 pb-4 last:border-b-0">
                  <div className="flex-shrink-0 w-full sm:w-48 text-xs text-blue-200/80 flex flex-row sm:flex-col items-center sm:items-start gap-1.5 sm:pt-0.5">
                    <span className="bg-gray-700/60 px-2 py-0.5 rounded whitespace-nowrap font-mono tabular-nums"> {startTimeStr} - {endTimeStr} </span>
                    <span className={`font-semibold px-2 py-0.5 rounded ${speakerColor} bg-black/40 whitespace-nowrap`}> {speakerLabel} </span>
                  </div>
                  <p className={`flex-grow text-base sm:text-lg leading-relaxed ${speakerColor} whitespace-pre-wrap break-words`}> {segment.text_transcript || <span className="italic text-gray-500">(No text transcribed)</span>} </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
