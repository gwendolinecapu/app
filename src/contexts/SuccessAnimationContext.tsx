import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface SuccessAnimationContextType {
  isPlaying: boolean;
  play: () => void;
}

const SuccessAnimationContext = createContext<SuccessAnimationContextType | undefined>(undefined);

export const useSuccessAnimation = () => {
  const context = useContext(SuccessAnimationContext);
  if (!context) {
    throw new Error('useSuccessAnimation must be used within a SuccessAnimationProvider');
  }
  return context;
};

export const SuccessAnimationProvider = ({ children }: { children: React.ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const animationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // MEMORY LEAK FIX: Cleanup animation timeout on unmount
  React.useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const play = useCallback(() => {
    setIsPlaying(true);
    // Reset after animation duration
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, 3000); // Lottie animation is ~3s
  }, []);

  const value = useMemo(() => ({ isPlaying, play }), [isPlaying, play]);

  return (
    <SuccessAnimationContext.Provider value={value}>
      {children}
    </SuccessAnimationContext.Provider>
  );
};