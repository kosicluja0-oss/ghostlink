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

  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={cn(
          "relative flex items-center gap-2 p-1.5 rounded-2xl border transition-all duration-200",
          "bg-[#0a0a0a]",
          isFocused || hasValue
            ? "border-white/20 shadow-[0_0_20px_hsl(var(--primary)/0.15)]" 
            : "border-white/[0.08] hover:border-white/[0.12]"
        )}
      >
        {/* Input field */}
        <input
          ref={inputRef}
          type="url"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={typedPlaceholder}
          className={cn(
            "flex-1 h-11 px-4 bg-transparent text-foreground text-sm outline-none",
            "placeholder:text-muted-foreground/50 placeholder:transition-all",
            isTyping && "placeholder:text-muted-foreground/70"
          )}
        />

        {/* Analyze & Track button */}
        <button
          onClick={handleClick}
          className={cn(
            "flex items-center gap-2 px-5 h-11 rounded-xl font-medium text-sm transition-all duration-200 whitespace-nowrap",
            hasValue
              ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]"
              : "bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground"
          )}
        >
          Analyze & Track
          <ArrowRight className={cn(
            "h-4 w-4 transition-transform duration-200",
            hasValue && "translate-x-0.5"
          )} />
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-muted-foreground/60 text-center">
        No credit card required • Free forever tier available
      </p>
    </div>
  );
}
