import { useState, useEffect, useRef } from 'react';

interface AnimatedValueProps {
  value: string | number;
  className?: string;
  duration?: number;
}

export function AnimatedValue({ value, className, duration = 400 }: AnimatedValueProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef<number | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    const valStr = String(value);
    const prevStr = String(prevRef.current);
    prevRef.current = value;

    if (valStr === prevStr) return;

    const parseNum = (s: string) => {
      const match = s.match(/[\d,.]+/);
      return match ? parseFloat(match[0].replace(/,/g, '')) : null;
    };

    const targetNum = parseNum(valStr);
    const startNum = parseNum(prevStr);

    if (targetNum === null || startNum === null || isNaN(targetNum) || isNaN(startNum)) {
      setDisplayValue(value);
      return;
    }

    const prefix = valStr.match(/^[^0-9]*/)?.[0] || '';
    const suffix = valStr.match(/[^0-9.]*$/)?.[0] || '';
    const decimals = valStr.includes('.') ? (valStr.split('.')[1]?.replace(/[^0-9]/g, '').length || 0) : 0;
    const useCommas = valStr.includes(',');

    const fmt = (n: number) => {
      let f = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
      if (useCommas) {
        const [int, dec] = f.split('.');
        f = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec ? '.' + dec : '');
      }
      return prefix + f + suffix;
    };

    const startTime = performance.now();
    const diff = targetNum - startNum;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(fmt(startNum + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}
