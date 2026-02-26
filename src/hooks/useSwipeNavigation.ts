import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ORDER = ['/dashboard', '/links', '/integrations', '/settings'];

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      touchStart.current = null;

      // Only trigger on horizontal swipes (dx > 80px, and more horizontal than vertical)
      if (Math.abs(dx) < 80 || Math.abs(dy) > Math.abs(dx) * 0.7) return;

      const currentIndex = NAV_ORDER.indexOf(location.pathname);
      if (currentIndex === -1) return;

      if (dx < 0 && currentIndex < NAV_ORDER.length - 1) {
        // Swipe left → next page
        navigate(NAV_ORDER[currentIndex + 1]);
      } else if (dx > 0 && currentIndex > 0) {
        // Swipe right → previous page
        navigate(NAV_ORDER[currentIndex - 1]);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate, location.pathname]);
}
