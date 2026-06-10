import React, { useState, useEffect } from 'react';

const STATUS_TEXTS = [
  'Verifying credentials...',
  'Opening dashboard...'
];

const BlobTransition = ({ selectedSubRole, loggedUser, onComplete }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'success'
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    if (phase !== 'loading') return undefined;

    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev < STATUS_TEXTS.length - 1) {
          return prev + 1;
        }
        clearInterval(textInterval);
        return prev;
      });
    }, 180);

    return () => clearInterval(textInterval);
  }, [phase]);

  // Keep the post-login feedback brief so the dashboard opens quickly.
  useEffect(() => {
    if (phase === 'loading' && loggedUser) {
      const timer = setTimeout(() => {
        setPhase('success');
      }, 180);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [loggedUser, phase]);

  useEffect(() => {
    if (phase === 'success') {
      const timer = setTimeout(() => {
        onComplete();
      }, 450);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [phase, onComplete]);

  // User gets red transition blob, Business and Admin get navy.
  const isVendor = selectedSubRole === 'vendor';
  const blobColorClass = isVendor ? 'bg-brandRed' : 'bg-brandNavy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      <div
        className={`absolute w-[150vmax] h-[150vmax] rounded-full ${blobColorClass} animate-blob-expand`}
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center">
        {phase === 'loading' ? (
          <div className="flex flex-col items-center justify-center space-y-6 animate-slide-up-fade">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-white/20" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white animate-spin-custom" />
              <div className="w-3.5 h-3.5 bg-brandRed rounded-full" />
            </div>

            <p className="text-lg font-medium font-sora tracking-wide transition-all duration-300 min-h-[28px] opacity-90">
              {STATUS_TEXTS[currentTextIndex]}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center animate-slide-up-fade">
            <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center shadow-lg mb-8 animate-scale-in">
              <svg viewBox="0 0 100 100" className="w-10 h-10 text-white">
                <path
                  d="M20 50 L42 72 L80 30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw-check"
                />
              </svg>
            </div>

            <h2 className="text-4xl font-extrabold font-sora mb-3">
              You're in!
            </h2>
            <p className="text-white/70 text-sm mb-1.5 font-medium">
              Successfully authenticated as
            </p>
            <p className="text-white font-bold font-sora text-[15px] mb-12">
              {loggedUser?.email}
            </p>

            <div className="w-64">
              <p className="text-[11px] text-white/60 font-medium mb-3">
                Redirecting to dashboard...
              </p>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full animate-fill-progress"
                  style={{ animationDuration: '450ms' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlobTransition;
