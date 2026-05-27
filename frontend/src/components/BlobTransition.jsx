import React, { useState, useEffect } from 'react';

const STATUS_TEXTS = [
  'Verifying credentials…',
  'Checking access rights…',
  'Establishing secure session…',
  'Almost there…'
];

const BlobTransition = ({ selectedSubRole, loggedUser, onComplete }) => {
  const [phase, setPhase] = useState('loading'); // 'loading' | 'success'
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  // Cycle through the status messages
  useEffect(() => {
    if (phase !== 'loading') return;

    const textInterval = setInterval(() => {
      setCurrentTextIndex((prev) => {
        if (prev < STATUS_TEXTS.length - 1) {
          return prev + 1;
        }
        clearInterval(textInterval);
        return prev;
      });
    }, 500);

    return () => clearInterval(textInterval);
  }, [phase]);

  // Transition to success phase when loggedUser is available and minimum loading time is met
  useEffect(() => {
    if (phase === 'loading' && loggedUser) {
      // Minimum loading time: wait until at least text index 3 is shown (1.5 seconds, matching slow circle expansion)
      const minTime = currentTextIndex >= 3 ? 0 : (3 - currentTextIndex) * 500;
      
      const timer = setTimeout(() => {
        setPhase('success');
      }, minTime);

      return () => clearTimeout(timer);
    }
  }, [loggedUser, currentTextIndex, phase]);

  // Trigger onComplete after success phase is shown for 5 seconds (matching progress bar)
  useEffect(() => {
    if (phase === 'success') {
      const timer = setTimeout(() => {
        onComplete();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Vendor gets red transition blob, Business and Admin get navy
  const isVendor = selectedSubRole === 'vendor';
  const blobColorClass = isVendor ? 'bg-brandRed' : 'bg-brandNavy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Full screen expanding blob circle */}
      <div
        className={`absolute w-[150vmax] h-[150vmax] rounded-full ${blobColorClass} animate-blob-expand`}
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-white text-center">
        {phase === 'loading' ? (
          <div className="flex flex-col items-center justify-center space-y-6 animate-slide-up-fade">
            {/* Custom Spinner: track, spinning arc, and red center dot */}
            <div className="relative flex items-center justify-center w-16 h-16">
              {/* Track */}
              <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
              {/* Spinner arc */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white border-r-white animate-spin-custom"></div>
              {/* Red center dot */}
              <div className="w-3.5 h-3.5 bg-brandRed rounded-full"></div>
            </div>

            {/* Cycling Status Text */}
            <p className="text-lg font-medium font-sora tracking-wide transition-all duration-300 min-h-[28px] opacity-90">
              {STATUS_TEXTS[currentTextIndex]}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center animate-slide-up-fade">
            {/* White Tick Circle inside success screen */}
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

            {/* Headings */}
            <h2 className="text-4xl font-extrabold font-sora mb-3">
              You're in!
            </h2>
            <p className="text-white/70 text-sm mb-1.5 font-medium">
              Successfully authenticated as
            </p>
            <p className="text-white font-bold font-sora text-[15px] mb-12">
              {loggedUser?.email}
            </p>

            {/* Bottom Progress Bar & Redirect Info */}
            <div className="w-64">
              <p className="text-[11px] text-white/60 font-medium mb-3">
                Redirecting to dashboard...
              </p>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full animate-fill-progress" 
                  style={{ animationDuration: '3s' }}
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
