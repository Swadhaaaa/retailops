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
      }, 2500);

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
        className={`absolute w-[150vmax] h-[150vmax] rounded-full ${blobColorClass} ${
          phase === 'success' ? 'animate-bg-pop-success' : 'animate-blob-expand'
        }`}
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center w-full h-full">
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
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Ripple Rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute w-[240px] h-[240px] rounded-full border border-white/20 animate-ripple-1 opacity-0" />
              <div className="absolute w-[340px] h-[340px] rounded-full border border-white/10 animate-ripple-2 opacity-0" />
              <div className="absolute w-[440px] h-[440px] rounded-full border border-white/5 animate-ripple-3 opacity-0" />
            </div>

            {/* Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute w-2 h-2 bg-white rounded-full top-[35%] left-[32%] animate-particle-float-1" />
              <div className="absolute w-3 h-3 bg-blue-300 rounded-full top-[62%] left-[28%] animate-particle-float-2" />
              <div className="absolute w-1.5 h-1.5 bg-red-300 rounded-full top-[30%] right-[30%] animate-particle-float-3" />
              <div className="absolute w-2.5 h-2.5 bg-white rounded-full top-[68%] right-[34%] animate-particle-float-4" />
            </div>

            {/* Premium center glass bubble */}
            <div className="relative flex flex-col items-center justify-center w-[280px] h-[280px] rounded-full premium-success-bubble animate-bubble-intro">
              <div className="w-20 h-20 flex items-center justify-center mb-1">
                <svg viewBox="0 0 100 100" className="w-14 h-14 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                  <path
                    d="M20 50 L42 72 L80 30"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-draw-check-success"
                  />
                </svg>
              </div>

              <div className="flex flex-col items-center text-center px-4">
                <h2 className="text-lg font-bold font-sora text-white drop-shadow-md animate-type-slide-1 whitespace-nowrap">
                  Logged in successfully
                </h2>
                <p className="text-white/80 text-xs font-semibold tracking-wider uppercase animate-type-slide-2 mt-1">
                  Welcome back
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlobTransition;
