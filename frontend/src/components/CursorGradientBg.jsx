import React, { useState, useRef, useEffect } from 'react';

const CursorGradientBg = ({ children, selectedRole }) => {
  const containerRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [interpolatedPos, setInterpolatedPos] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef(null);

  const lerp = (start, end, factor) => start + (end - start) * factor;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('mouseleave', () => {
      if (container) {
        setMousePos({ x: container.offsetWidth / 2, y: container.offsetHeight / 2 });
      }
    });

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', () => {});
    };
  }, []);

  // Smooth interpolation loop
  useEffect(() => {
    const animate = () => {
      setInterpolatedPos((prev) => ({
        x: lerp(prev.x, mousePos.x, 0.08),
        y: lerp(prev.y, mousePos.y, 0.08),
      }));
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos]);

  // Determine gradient colors based on the selected role
  let gradientBackground = 'radial-gradient(circle, rgba(201, 235, 255, 0.75) 0%, rgba(213, 197, 255, 0.55) 35%, rgba(199, 210, 254, 0.25) 70%, transparent 100%)';
  if (selectedRole === 'vendor') {
    gradientBackground = 'radial-gradient(circle, rgba(227, 24, 55, 0.22) 0%, rgba(239, 68, 68, 0.13) 35%, rgba(254, 202, 202, 0.05) 70%, transparent 100%)';
  } else if (selectedRole === 'admin') {
    gradientBackground = 'radial-gradient(circle, rgba(15, 27, 76, 0.22) 0%, rgba(139, 156, 199, 0.14) 35%, rgba(139, 156, 199, 0.06) 70%, transparent 100%)';
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        background: '#FFFFFF',
      }}
    >
      {/* Grid overlay - static */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.035) 1px, transparent 1px)`,
          backgroundSize: '6rem 4rem',
          zIndex: 1,
        }}
      />

      {/* Animated gradient glow - follows cursor */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${interpolatedPos.x}px`,
          top: `${interpolatedPos.y}px`,
          width: '350px',
          height: '350px',
          transform: 'translate(-50%, -50%)',
          background: gradientBackground,
          filter: 'blur(90px)',
          zIndex: 0,
          transition: 'none',
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default CursorGradientBg;
