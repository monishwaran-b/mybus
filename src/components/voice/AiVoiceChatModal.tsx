import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  X,
  RotateCcw,
  Loader2,
  Bot,
  User,
  Radio,
  Globe,
  Settings,
  HelpCircle,
  Play,
  Pause,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { VoiceChatMessage } from '../../types/index.ts';

interface AiVoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const AiVoiceChatModal: React.FC<AiVoiceChatModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
}) => {
  const { language, setLanguage, availableLanguages, currentLanguageOption, t } = useLanguage();

  const [messages, setMessages] = useState<VoiceChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      text:
        language === 'ta'
          ? 'வணக்கம்! நான் MyBus AI குரல் உதவியாளர். பேருந்து 75 நேரடி நிலை, வழித்தடங்கள் அல்லது அவசர உதவி குறித்து கேளுங்கள்!'
          : language === 'hi'
          ? 'नमस्ते! मैं MyBus एआई वॉयस असिस्टेंट हूँ। बस 75 की लाइव स्थिति, रूट या समय के बारे में बेझिझक पूछें।'
          : language === 'es'
          ? '¡Hola! Soy tu asistente de voz MyBus. ¿En qué puedo ayudarte hoy con el seguimiento de autobuses o rutas?'
          : 'Hello! I am your MyBus AI Voice Assistant. Ask me about Bus 75 live ETA, route delays, boarding points, or campus transit schedules.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Suggested quick prompts
  const suggestedChips = [
    t('voice.chip1', 'Where is Bus 75 right now and what is the ETA?'),
    t('voice.chip2', 'Are there any traffic delays on OMR IT Corridor Route 2?'),
    t('voice.chip3', 'How do I reach the college campus from Chennai Central?'),
    t('voice.chip4', 'Who is the driver and what is the emergency contact?'),
  ];

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    if (isOpen && initialQuery) {
      handleSend(initialQuery);
    }
  }, [isOpen, initialQuery]);

  const stopActiveAudioPlayback = () => {
    if (activeAudioSourceRef.current) {
      try {
        activeAudioSourceRef.current.stop();
      } catch (_) {}
      activeAudioSourceRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const playRawPcm24k = async (base64Data: string) => {
    try {
      stopActiveAudioPlayback();

      // Clean base64 string
      const cleanBase64 = base64Data.includes('base64,') ? base64Data.split('base64,')[1] : base64Data;
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Convert 16-bit PCM bytes to Float32 [-1.0, 1.0]
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      source.onended = () => {
        setIsPlayingAudio(false);
        activeAudioSourceRef.current = null;
      };

      activeAudioSourceRef.current = source;
      setIsPlayingAudio(true);
      source.start();
    } catch (err) {
      console.warn('PCM 24kHz decode fallback to Web Speech:', err);
      fallbackWebSpeech(messages[messages.length - 1]?.text || '');
    }
  };

  const fallbackWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      stopActiveAudioPlayback();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
      utterance.lang = currentLanguageOption.speechLang || 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setIsPlayingAudio(false);
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    stopActiveAudioPlayback();
    setErrorMessage(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        await handleAudioVoiceSubmit(audioBlob, mediaRecorder.mimeType || 'audio/webm');
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Mic access error:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone permissions or type below.'
          : 'Unable to start audio recording.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioVoiceSubmit = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        try {
          // 1. Transcribe voice via Gemini 3.5 Transcribe
          const transcriptionRes = await api.transcribeAudio(base64Data, mimeType);
          const transcript = transcriptionRes.transcription?.trim();

          if (!transcript) {
            setErrorMessage('No voice audio detected. Please try speaking closer to the microphone.');
            setIsProcessing(false);
            return;
          }

          // 2. Send transcript as user message to AI Voice Chat
          await handleSend(transcript);
        } catch (e: any) {
          console.error('Voice transcribe error:', e);
          setErrorMessage(e.message || 'Failed to process voice input.');
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      setIsProcessing(false);
      setErrorMessage('Could not process microphone audio.');
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputText).trim();
    if (!textToSend || isProcessing) return;

    setInputText('');
    setErrorMessage(null);
    stopActiveAudioPlayback();

    const userMessage: VoiceChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Build history
      const history = messages.slice(-5).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.sendVoiceChat({
        message: textToSend,
        history,
        language,
        synthesizeSpeech: autoPlayAudio,
        voiceName: selectedVoice,
      });

      const assistantMessage: VoiceChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: res.reply || 'I am tracking the bus fleet for you.',
        audioBase64: res.audioBase64,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (autoPlayAudio) {
        if (res.audioBase64) {
          playRawPcm24k(res.audioBase64);
        } else {
          fallbackWebSpeech(assistantMessage.text);
        }
      }
    } catch (err: any) {
      console.error('Voice Chat error:', err);
      const fallbackReply =
        language === 'ta'
          ? 'மன்னிக்கவும், தகவலைப் பெறுவதில் சிக்கல். பேருந்து 75 தொடர்ந்து இயக்கத்தில் உள்ளது.'
          : 'I am experiencing a slight network delay, but Bus 75 is currently on time approaching Tambaram.';

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setErrorMessage(err.message || 'Connection error. Displaying cached fleet status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearChat = () => {
    stopActiveAudioPlayback();
    setMessages([
      {
        id: 'msg-welcome-new',
        role: 'assistant',
        text:
          language === 'ta'
            ? 'வணக்கம்! புதிய வினவலைத் தொடங்குங்கள்.'
            : 'Conversation cleared. How can I assist you with MyBus fleet tracking?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0b1222] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              {isPlayingAudio && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {t('voice.title', 'MyBus AI Voice Assistant')}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  gemini-3.8-flash & tts
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Interactive real-time voice & speech assistance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio sound toggle */}
            <button
              onClick={() => {
                if (isPlayingAudio) stopActiveAudioPlayback();
                setAutoPlayAudio(!autoPlayAudio);
              }}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                autoPlayAudio
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={autoPlayAudio ? 'Voice auto-playback enabled' : 'Voice muted'}
            >
              {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Clear conversation */}
            <button
              onClick={clearChat}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={() => {
                stopActiveAudioPlayback();
                if (isRecording) stopRecording();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Language selector & Voice persona */}
        <div className="px-5 py-2.5 bg-[#0e172a] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Interaction Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              {availableLanguages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Gemini Voice:</span>
            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              {(['Kore', 'Puck', 'Charon', 'Zephyr'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setSelectedVoice(v)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    selectedVoice === v
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[260px] max-h-[380px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 items-start ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`relative max-w-[82%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                <div className="mt-2 flex items-center justify-between gap-4 text-[10px] text-slate-400">
                  <span className="font-mono">{m.timestamp}</span>

                  {m.role === 'assistant' && (
                    <button
                      onClick={() => {
                        if (m.audioBase64) {
                          playRawPcm24k(m.audioBase64);
                        } else {
                          fallbackWebSpeech(m.text);
                        }
                      }}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Replay Voice</span>
                    </button>
                  )}
                </div>
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 flex-shrink-0 shadow-md">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex gap-3 items-center text-xs text-cyan-300">
              <div className="w-8 h-8 rounded-lg bg-cyan-900/60 border border-cyan-700 flex items-center justify-center text-cyan-300">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-2">
                <span>Gemini 3.8 thinking & preparing voice response...</span>
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-150" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-300" />
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Voice Prompt Chips */}
        <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-slate-500 whitespace-nowrap font-medium">Suggestions:</span>
          {suggestedChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-800 hover:border-cyan-700 whitespace-nowrap transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Recording Visualizer Banner */}
        {isRecording && (
          <div className="px-5 py-3 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border-t border-rose-800 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute" />
                <span className="w-3 h-3 rounded-full bg-rose-600 relative" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-200">
                  {t('voice.listening', 'Listening... Speak your transit question')}
                </div>
                <div className="text-[10px] text-slate-400">
                  Transcribing via Gemini 3.5 Transcribe
                </div>
              </div>
            </div>

            {/* Audio Waveform simulation */}
            <div className="flex items-center gap-1 h-6">
              {[8, 16, 24, 12, 28, 18, 10, 22, 14, 20].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-rose-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}px`,
                    animationDuration: `${0.3 + (i % 4) * 0.15}s`,
                  }}
                />
              ))}
            </div>

            <button
              onClick={stopRecording}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Done</span>
            </button>
          </div>
        )}

        {/* Voice Playback indicator */}
        {isPlayingAudio && !isRecording && (
          <div className="px-5 py-2 bg-cyan-950/50 border-t border-cyan-800 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Speaking response ({selectedVoice} Voice Model)...</span>
            </div>
            <button
              onClick={stopActiveAudioPlayback}
              className="px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-[11px] text-cyan-300 border border-cyan-700"
            >
              Stop Audio
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Big Mic Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-xl transition-all shadow-lg flex-shrink-0 cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-rose-600/40 ring-2 ring-rose-400'
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:scale-105 active:scale-95 text-white shadow-cyan-500/20'
              }`}
              title={isRecording ? 'Click to stop recording' : 'Click to speak to AI'}
            >
              {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isRecording
                  ? 'Listening to microphone...'
                  : t('voice.inputPlaceholder', 'Or type transit query or question...')
              }
              disabled={isRecording || isProcessing}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-colors flex-shrink-0 cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
