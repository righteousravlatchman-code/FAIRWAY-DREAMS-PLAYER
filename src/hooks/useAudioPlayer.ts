import { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeAudioUrl } from '../lib/audioUtils';

export function useAudioPlayer(onEnded?: () => void) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const onEndedRef = useRef(onEnded);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    const a = new Audio();
    a.crossOrigin = "anonymous";
    a.volume = volume;
    a.style.display = "none";
    document.body.appendChild(a);
    
    const handleTimeUpdate = () => setCurrentTime(a.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(a.duration);
      setIsLoading(false);
      setError(null);
    };
    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      if (onEndedRef.current) onEndedRef.current();
    };
    const handleAudioError = (e: any) => {
      const a = audioRef.current;
      console.error("Audio Error Detail:", {
        code: a?.error?.code,
        message: a?.error?.message,
        src: a?.src,
        networkState: a?.networkState,
        readyState: a?.readyState
      });
      setIsPlaying(false);
      setIsLoading(false);
      
      let msg = "Failed to load audio. ";
      if (a?.error?.code === 4) {
        msg += "The source might be invalid, blocked by CORS, or is not a supported audio format.";
      } else if (a?.error?.code === 3) {
        msg += "Decoding error. The file might be corrupted or in an unsupported format.";
      } else if (a?.error?.code === 2) {
        msg += "Network error. Please check your connection.";
      } else if (a?.error?.code === 1) {
        msg += "Playback aborted.";
      } else {
        msg += "Please check your connection or try another track.";
      }
      setError(`${msg} (Source: ${a?.src || 'Unknown'})`);
    };

    a.addEventListener('timeupdate', handleTimeUpdate);
    a.addEventListener('loadedmetadata', handleLoadedMetadata);
    a.addEventListener('waiting', handleWaiting);
    a.addEventListener('canplay', handleCanPlay);
    a.addEventListener('ended', handleEnded);
    a.addEventListener('error', handleAudioError);

    a.preload = "auto";
    (a as any).playsInline = true;
    (a as any).webkitPlaysInline = true;

    audioRef.current = a;
    setAudio(a);

    // Global interaction listener to resume AudioContext (browser policy)
    const resumeContext = () => {
      if (audioContextRef.current?.state === 'suspended') {
        console.log("Resuming AudioContext from global interaction...");
        audioContextRef.current.resume();
      }
    };
    window.addEventListener('click', resumeContext);
    window.addEventListener('touchstart', resumeContext);
    window.addEventListener('keydown', resumeContext);

    return () => {
      a.removeEventListener('timeupdate', handleTimeUpdate);
      a.removeEventListener('loadedmetadata', handleLoadedMetadata);
      a.removeEventListener('waiting', handleWaiting);
      a.removeEventListener('canplay', handleCanPlay);
      a.removeEventListener('ended', handleEnded);
      a.removeEventListener('error', handleAudioError);
      window.removeEventListener('click', resumeContext);
      window.removeEventListener('touchstart', resumeContext);
      window.removeEventListener('keydown', resumeContext);
      a.pause();
      a.src = "";
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
      audioRef.current = null;
      setAudio(null);
    };
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioRef.current) return;
    
    try {
      if (!audioContextRef.current) {
        console.log("Initializing AudioContext...");
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        const ctx = new AudioContextClass();
        
        const node = ctx.createAnalyser();
        node.fftSize = 512;
        
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(node);
        node.connect(ctx.destination);
        
        audioContextRef.current = ctx;
        setAnalyser(node);
        sourceRef.current = source;
        console.log("AudioContext initialized successfully");
      }
      
      if (audioContextRef.current?.state === 'suspended') {
        console.log("Resuming suspended AudioContext...");
        audioContextRef.current.resume().then(() => {
          console.log("AudioContext resumed successfully");
        });
      }
    } catch (err) {
      console.error("Failed to initialize AudioContext:", err);
    }
  }, []);

  const togglePlay = useCallback(async (fallbackUrl?: string) => {
    const a = audioRef.current;
    if (!a) {
      console.error("Audio element not initialized");
      return;
    }
    
    // Normalize window.location.href for comparison
    const currentSiteUrl = window.location.origin + '/';
    const currentSiteUrlPath = window.location.origin + window.location.pathname;

    // If no src is set, or it's pointing to the site itself, try to use the fallbackUrl
    const isInvalidSrc = !a.src || 
                        a.src === "" || 
                        a.src === window.location.href || 
                        a.src === currentSiteUrl || 
                        a.src === currentSiteUrlPath;

    if (isInvalidSrc) {
      if (fallbackUrl) {
        console.log("No valid source set, using fallbackUrl:", fallbackUrl);
        await playTrack(fallbackUrl);
        return;
      }
      console.warn("No valid audio source set, cannot play. Current src:", a.src);
      setError("No audio signal detected.");
      return;
    }
    
    initAudioContext();
    
    if (isPlaying) {
      console.log("Pausing audio");
      a.pause();
      setIsPlaying(false);
    } else {
      console.log("Attempting to play audio:", a.src);
      try {
        if (audioContextRef.current?.state === 'suspended') {
          console.log("Resuming AudioContext before play...");
          await audioContextRef.current.resume();
        }
        
        const playPromise = a.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log("Playback started successfully");
          setIsPlaying(true);
          setError(null);
        }
      } catch (error: any) {
        console.error("Playback failed:", error);
        setIsPlaying(false);
        if (error.name === 'NotAllowedError') {
          console.warn("Playback blocked by browser. User interaction required.");
        } else {
          setError("Playback failed. Please try again.");
        }
      }
    }
  }, [isPlaying, initAudioContext]);

  const playTrack = useCallback(async (url: string) => {
    const a = audioRef.current;
    if (!a || !url) return;
    
    setIsLoading(true);
    setError(null);
    initAudioContext();
    
    // Normalize URL for comparison and Suno support
    const normalizedUrl = normalizeAudioUrl(url);
    if (!normalizedUrl) {
      console.error("Invalid audio URL after normalization:", url);
      setError("Invalid audio track source.");
      setIsLoading(false);
      return;
    }

    const absoluteUrl = normalizedUrl.startsWith('http') 
      ? normalizedUrl 
      : window.location.origin + (normalizedUrl.startsWith('/') ? '' : '/') + normalizedUrl;

    // Check if absoluteUrl is just the site origin or current page
    const currentSiteUrl = window.location.origin + '/';
    const currentSiteUrlPath = window.location.origin + window.location.pathname;

    if (absoluteUrl === currentSiteUrl || absoluteUrl === currentSiteUrlPath) {
      console.warn("Attempted to play site root or current page as audio", url);
      setError("Invalid track source (Resource is an HTML page).");
      setIsLoading(false);
      return;
    }

    console.log("Switching track to:", absoluteUrl);
    
    setError(null);

    // If it's a new track, load it
    const isNewTrack = a.src !== absoluteUrl;
    if (isNewTrack) {
      a.pause();
      a.crossOrigin = "anonymous";
      a.src = absoluteUrl;
      a.load();
    }
    
    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      // Attempt playback
      await a.play();
      setIsPlaying(true);
      setError(null);
    } catch (err: any) {
      console.error("Primary playback failed:", err);
      
      // Retry without CORS if it was enabled and failed with a loading/CORS error
      // Error code 4 (MEDIA_ERR_SRC_NOT_SUPPORTED) often masks CORS failures
      if (a.crossOrigin === "anonymous") {
        console.warn("CORS/Loading error, retrying without anonymous crossOrigin...");
        setError(null); 
        
        try {
          // 1. Fully strip CORS attributes
          a.removeAttribute('crossorigin');
          a.crossOrigin = null;
          
          // 2. Cold-reset the source to clear browser session errors for this URL
          a.src = '';
          a.load();
          await new Promise(r => setTimeout(r, 100)); // Brief pause for state transition
          
          // 3. Re-assign the source and reload
          a.src = absoluteUrl;
          a.load();
          
          // 4. Wait for a bit of progress or just try play
          // Some browsers need a moment after src change
          await new Promise(r => setTimeout(r, 300));
          
          await a.play();
          setIsPlaying(true);
          setError(null);
          console.log("Playback succeeded after CORS-disabled retry");
        } catch (retryErr: any) {
          console.error("Retry failed:", retryErr);
          if (retryErr?.name !== 'NotAllowedError' && retryErr?.name !== 'AbortError') {
            setIsPlaying(false);
            // More user-friendly error
            const detail = a.error?.message || retryErr?.message || "Unknown load error";
            setError(`Playback Error: ${detail}. The source might be restricted or invalid.`);
          }
        }
      } else if (err?.name !== 'NotAllowedError' && err?.name !== 'AbortError') {
        setIsPlaying(false);
        setError(`Playback failed: ${err?.message || "Unknown error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initAudioContext]);

  const seek = useCallback((time: number) => {
    const a = audioRef.current;
    if (a) {
      a.currentTime = time;
    }
  }, []);

  const updateVolume = useCallback((v: number) => {
    const a = audioRef.current;
    if (a) {
      a.volume = v;
      setVolume(v);
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    volume,
    analyser,
    audio,
    togglePlay,
    playTrack,
    seek,
    updateVolume,
    audioRef
  };
}
