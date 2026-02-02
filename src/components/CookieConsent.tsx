import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COOKIE_CONSENT_KEY = 'ghost-link-cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for smoother UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-xl p-4 md:p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon & Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-foreground font-medium">
                  We use cookies to enhance your experience
                </p>
                <p className="text-xs text-muted-foreground">
                  We use essential cookies for authentication and preferences. By clicking "Accept", you 
                  consent to our use of cookies.{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Learn more
                  </Link>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDecline}
                className="flex-1 md:flex-none"
              >
                Decline
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleAccept}
                className="flex-1 md:flex-none"
              >
                Accept
              </Button>
            </div>

            {/* Close button for mobile */}
            <button 
              onClick={handleDecline}
              className="absolute top-2 right-2 md:hidden p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
