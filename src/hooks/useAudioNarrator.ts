import { useState, useRef, useEffect } from 'react';
import { generateReportAudio, narrateStructuredData } from '../services/geminiService';
import { useToast } from '../components/ToastProvider';

export function useAudioNarrator() {
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const { showToast } = useToast();

  const handleAudioResult = async (result: { audioData: string, script: string }) => {
    const binary = atob(result.audioData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
       float32Array[i] = int16Array[i] / 32768.0;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const buffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
    buffer.getChannelData(0).set(float32Array);
    setAudioBuffer(buffer);
    
    showToast('Narration Ready', 'success');
    playAudio(buffer);
  };

  const narrateText = async (text: string) => {
    if (!text) return;
    setAudioLoading(true);
    try {
      const result = await generateReportAudio(text);
      await handleAudioResult(result);
    } catch (error) {
      console.error("Audio error:", error);
      showToast('Narration failed', 'error');
    } finally {
      setAudioLoading(false);
    }
  };

  const narrateData = async (label: string, data: any) => {
    setAudioLoading(true);
    try {
      const result = await narrateStructuredData(label, data);
      await handleAudioResult(result);
    } catch (error) {
      console.error("Audio error:", error);
      showToast('Narration failed', 'error');
    } finally {
      setAudioLoading(false);
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlaying(false);
    
    source.start(0);
    sourceNodeRef.current = source;
    setIsPlaying(true);
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      setIsPlaying(false);
    }
  };

  const toggleText = (text: string) => {
    if (isPlaying) {
      stopAudio();
    } else if (audioBuffer) {
      playAudio(audioBuffer);
    } else {
      narrateText(text);
    }
  };

  const toggleData = (label: string, data: any) => {
    if (isPlaying) {
      stopAudio();
    } else if (audioBuffer) {
      playAudio(audioBuffer);
    } else {
      narrateData(label, data);
    }
  };

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.stop();
      }
    };
  }, []);

  return {
    audioLoading,
    isPlaying,
    toggleText,
    toggleData,
    stopAudio,
    setAudioBuffer
  };
}
