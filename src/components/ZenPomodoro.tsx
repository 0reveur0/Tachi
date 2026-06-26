import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Leaf } from 'lucide-react';

interface ZenPomodoroProps {
  getHeaders: () => Record<string, string>;
  setStatusMessage: (msg: string) => void;
}

export const ZenPomodoro: React.FC<ZenPomodoroProps> = ({
  getHeaders,
  setStatusMessage,
}) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [zenPoints, setZenPoints] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch current zen points on mount
  useEffect(() => {
    const fetchZenPoints = async () => {
      try {
        const response = await fetch('/api/user/zen-points', { headers: getHeaders() });
        if (response.ok) {
          const res = await response.json();
          setZenPoints(res.zenPoints || 0);
        }
      } catch {
        // silent fail
      }
    };
    fetchZenPoints();
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleComplete = async () => {
    setIsRunning(false);
    setShowComplete(true);
    try {
      const response = await fetch('/api/user/zen-points', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ increment: 10 }),
      });
      if (response.ok) {
        const res = await response.json();
        setZenPoints(res.zenPoints || 0);
        setStatusMessage('Your mind is clear. You earned 10 Zen Points.');
      }
    } catch {
      // silent
    }
  };

  const toggleTimer = () => {
    if (timeLeft === 1) {
      setTimeLeft(25 * 60);
      setShowComplete(false);
    }
    setIsRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    setShowComplete(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 animate-fade-in text-[#2D3B32]">
      <div className="border-b border-dashed border-[#2D3B32]/10 pb-4">
        <h2 className="text-xs uppercase font-mono font-bold tracking-widest text-[#2D3B32]/50">Mindful Focus Ritual</h2>
        <h3 className="text-xl font-serif text-[#2D3B32] font-semibold mt-1">
          ✦ Zen Pomodoro / Chánh Niệm Tập Trung ✦
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Timer */}
        <div className="lg:col-span-7 bg-[#FAF7F0] border border-[#2D3B32]/12 p-8 rounded-xl space-y-8 shadow-xs h-auto min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden pb-6">
          {/* Decorative leaf SVG */}
          <div className="absolute top-4 right-4 w-24 h-24 pointer-events-none opacity-10 select-none text-[#2D3B32]/20 z-1">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
              <path d="M 50 90 C 50 65 50 35 50 10" />
              <path d="M 50 75 Q 35 65 30 55" />
              <path d="M 50 75 Q 65 65 70 55" />
              <path d="M 50 55 Q 30 45 25 35" />
              <path d="M 50 55 Q 70 45 75 35" />
            </svg>
          </div>

          <div className="text-center space-y-4 z-10">
            <span className="text-[9px] uppercase font-mono tracking-[0.25em] text-[#2D3B32]/40 block">
              Session {sessionCount}
            </span>

            <div className="font-serif text-5xl sm:text-6xl md:text-7xl text-[#2D3B32] font-normal tracking-tight tabular-nums">
              {formatTime(timeLeft)}
            </div>

            <p className="text-xs text-[#2D3B32]/60 italic font-serif">
              {isRunning ? 'Breathe deeply. Focus on one thing.' : 'Ready to begin your mindful session.'}
            </p>
          </div>

          <div className="flex items-center gap-4 z-10">
            <button
              onClick={toggleTimer}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer border shadow-sm hover:shadow-md ${
                isRunning
                  ? 'bg-[#8E4A3E] text-[#FDFBF7] border-[#8E4A3E] hover:bg-[#7A3D33]'
                  : 'bg-[#6B8467] text-[#FDFBF7] border-[#6B8467] hover:bg-[#4E634A]'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause' : 'Start Session'}
            </button>

            <button
              onClick={resetTimer}
              className="flex items-center gap-2 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest bg-transparent text-[#2D3B32]/60 border border-[#2D3B32]/20 hover:bg-[#2D3B32]/5 transition-all duration-300 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {showComplete && (
            <div className="mt-4 p-4 bg-[#6B8467]/10 border border-[#6B8467]/30 rounded-xl text-center animate-fade-in z-10">
              <p className="font-serif italic text-sm text-[#2D3B32]">
                "Your mind is clear. You earned 10 Zen Points."
              </p>
              <button
                onClick={() => {
                  setShowComplete(false);
                  setTimeLeft(25 * 60);
                  setSessionCount((c) => c + 1);
                }}
                className="mt-3 text-[10px] uppercase font-bold tracking-widest text-[#6B8467] hover:text-[#4E634A] underline cursor-pointer"
              >
                Begin Next Session
              </button>
            </div>
          )}
        </div>

        {/* Right: Zen Points & Stats */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#E2EAE0]/40 border border-[#2D3B32]/10 p-6 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-[#2D3B32]/70">
              <Leaf className="w-4 h-4 text-[#6B8467]" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Zen Points</span>
            </div>

            <div className="text-center py-4">
              <span className="font-serif text-4xl text-[#2D3B32] font-bold">{zenPoints}</span>
              <p className="text-[9px] uppercase font-mono tracking-widest text-[#2D3B32]/40 mt-1">
                Total accumulated points
              </p>
            </div>

            <div className="border-t border-dashed border-[#2D3B32]/10 pt-3 text-[10px] text-[#2D3B32]/50 font-mono space-y-1">
              <p>1 session = 10 Zen Points</p>
              <p>Reach 100 points for a mindful milestone.</p>
            </div>
          </div>

          <div className="bg-[#FAF7F0] border border-[#2D3B32]/10 p-6 rounded-xl">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#2D3B32] mb-3">About Pomodoro</h4>
            <p className="text-xs text-[#2D3B32]/70 leading-relaxed font-serif italic">
              The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks. Each completed session earns you Zen Points, rewarding your discipline and focus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
