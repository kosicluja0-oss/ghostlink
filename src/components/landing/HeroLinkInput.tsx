import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEHOLDER_TEXT = 'Paste your first affiliate link here to start...';

export function HeroLinkInput() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typedPlaceholder, setTypedPlaceholder] = useState(PLACEHOLDER_TEXT);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = inputValue.trim().length > 0;

  // Typewriter animation effect
  useEffect(() => {
    if (!isTyping) return;

    let currentIndex = 0;
    setTypedPlaceholder('');

    const typeInterval = setInterval(() => {
      if (currentIndex < PLACEHOLDER_TEXT.length) {
        setTypedPlaceholder(PLACEHOLDER_TEXT.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [isTyping]);

  const handleClick = () => {
    if (hasValue) {
      // Store the URL temporarily and redirect to signup
      sessionStorage.setItem('pendingAffiliateLink', inputValue.trim());
      navigate('/auth?mode=signup');
    } else {
      // Trigger typewriter animation
      setIsTyping(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div 
        className={cn(
          "relative flex items-center gap-3 p-2 rounded-xl border bg-card/80 backdrop-blur-sm transition-all duration-300",
          hasValue 
            ? "border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.2)]" 
            : "border-border/50 hover:border-border"
        )}
      >
        {/* Input field */}
        <input
          ref={inputRef}
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={typedPlaceholder}
          className={cn(
            "flex-1 h-12 px-4 bg-transparent text-foreground text-base outline-none",
            "placeholder:text-muted-foreground/60 placeholder:transition-all",
            isTyping && "placeholder:text-muted-foreground/80"
          )}
        />

        {/* Analyze & Track button */}
        <button
          onClick={handleClick}
          className={cn(
            "flex items-center gap-2 px-6 h-12 rounded-lg font-medium text-sm transition-all duration-300 whitespace-nowrap",
            hasValue
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Analyze & Track
          <ArrowRight className={cn(
            "h-4 w-4 transition-transform duration-300",
            hasValue && "translate-x-0.5"
          )} />
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-muted-foreground/70 text-center">
        No credit card required • Free forever tier available
      </p>
    </div>
  );
}
