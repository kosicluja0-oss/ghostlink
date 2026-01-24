import { useMemo } from 'react';

interface PasswordStrength {
  hasLength: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  score: number;
  isStrong: boolean;
}

export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    const hasLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);
    const score = [hasLength, hasNumber, hasSymbol].filter(Boolean).length;
    const isStrong = hasLength && hasNumber && hasSymbol;
    
    return { hasLength, hasNumber, hasSymbol, score, isStrong };
  }, [password]);
}
