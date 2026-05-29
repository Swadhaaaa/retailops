import React, { useState, useRef, useEffect } from 'react';

const CursorGradientBg = ({ children }) => {
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
          backgroundImage: `linear-gradient(rgba(71, 85, 239, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(71, 85, 239, 0.05) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
          zIndex: 1,
        }}
      />

      {/* Animated gradient glow - follows cursor */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${interpolatedPos.x}px`,
          top: `${interpolatedPos.y}px`,
          width: '400px',
          height: '400px',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(147, 112, 219, 0.12) 0%, rgba(100, 150, 255, 0.06) 30%, transparent 70%)',
          filter: 'blur(80px)',
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
