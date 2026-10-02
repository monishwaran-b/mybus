import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2, Copy, Check, Sparkles, X, Upload, AlertCircle } from 'lucide-react';
import { api } from '../../services/api.ts';

interface VoiceTranscriberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscriptionComplete?: (text: string) => void;
  title?: string;
  subtitle?: string;
}

export const VoiceTranscriberModal: React.FC<VoiceTranscriberModalProps> = ({
  isOpen,
  onClose,
  onTranscriptionComplete,
  title = 'Voice Input & Audio Transcription',
  subtitle = 'Powered by Gemini 3.5 Transcribe. Speak into your microphone to dictate notes, transit questions, or incident reports.',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      handleCancel();
    }
  }, [isOpen]);

  const startRecording = async () => {
    setErrorMessage(null);
    setTranscription('');
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        await processAudioBlob(audioBlob, mediaRecorder.mimeType || 'audio/webm');
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : 'Unable to start microphone recording. You can also upload an audio file below.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      clearInterval(timerRef.current);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setIsTranscribing(false);
    setErrorMessage(null);
  };

  const processAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await api.transcribeAudio(base64Data, mimeType);
          setTranscription(res.transcription || 'No speech detected.');
          if (onTranscriptionComplete && res.transcription) {
            onTranscriptionComplete(res.transcription);
          }
        } catch (e: any) {
          console.error('Transcription error:', e);
          setErrorMessage(e.message || 'Failed to transcribe audio with Gemini 3.5 Transcribe.');
        } finally {
          setIsTranscribing(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (e: any) {
      setIsTranscribing(false);
      setErrorMessage('Failed to read recorded audio data.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setTranscription('');
    processAudioBlob(file, file.type || 'audio/webm');
  };

  const handleCopy = () => {
    if (!transcription) return;
    navigator.clipboard.writeText(transcription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0d1527] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {title}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  gemini-3.5-transcribe
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleCancel();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Central Recording Stage */}
        <div className="py-6 flex flex-col items-center justify-center bg-slate-900/60 border border-slate-800 rounded-xl mb-4">
          {!isRecording && !isTranscribing && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={startRecording}
                className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500 to-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-500/30 flex items-center justify-center text-white group cursor-pointer"
                title="Click to Record"
              >
                <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </button>
              <div className="text-center">
                <span className="text-sm font-semibold text-white">Click Microphone to Speak</span>
                <p className="text-xs text-slate-400 mt-0.5">Dictate in English, Tamil, Hindi, or any language</p>
              </div>
            </div>
          )}

          {isRecording && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full bg-rose-500/40 animate-pulse" />
                <button
                  onClick={stopRecording}
                  className="relative z-10 w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
                  title="Stop Recording"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>

              {/* Dynamic waveform visualizer */}
              <div className="flex items-center gap-1.5 h-8">
                {[12, 24, 18, 30, 16, 28, 22, 14, 26, 20].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 bg-rose-400 rounded-full animate-pulse"
                    style={{
                      height: `${h}px`,
                      animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                    }}
                  />
                ))}
              </div>

              <div className="text-center">
                <div className="text-base font-mono font-bold text-rose-300">
                  Recording: {formatSeconds(recordingDuration)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Click the red square when you finish speaking</p>
              </div>
            </div>
          )}

          {isTranscribing && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
              <div className="text-center">
                <span className="text-sm font-semibold text-white">Transcribing with Gemini 3.5...</span>
                <p className="text-xs text-slate-400 mt-0.5">Analyzing speech nuances and punctation</p>
              </div>
            </div>
          )}
        </div>

        {/* Audio File Upload Fallback */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
          <span>Or upload pre-recorded audio:</span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Select Audio File</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="audio/*"
            className="hidden"
          />
        </div>

        {/* Transcription Output Area */}
        {transcription && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Transcribed Text:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 leading-relaxed font-sans max-h-40 overflow-y-auto select-text">
              {transcription}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  if (onTranscriptionComplete) {
                    onTranscriptionComplete(transcription);
                  }
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 text-center"
              >
                Apply Transcribed Text
              </button>
              <button
                onClick={() => {
                  setTranscription('');
                  startRecording();
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
              >
                Record Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
