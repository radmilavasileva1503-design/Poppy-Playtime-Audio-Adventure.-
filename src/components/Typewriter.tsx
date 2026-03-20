import React, { useState, useEffect } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 50, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    let timer: NodeJS.Timeout;

    const type = () => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
        // Add randomness to speed: between 0.5x and 1.5x of base speed
        const randomSpeed = speed * (0.5 + Math.random());
        timer = setTimeout(type, randomSpeed);
      } else {
        if (onComplete) onComplete();
      }
    };

    timer = setTimeout(type, speed);

    return () => clearTimeout(timer);
  }, [text, speed, onComplete]);

  return <span>{displayedText}</span>;
};
