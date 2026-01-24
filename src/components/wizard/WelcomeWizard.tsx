import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, Sparkles, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BorderBeam } from './BorderBeam';
import { WizardParticles } from './WizardParticles';
import { cn } from '@/lib/utils';

// Platform logos (using simple SVG icons for demo)
const platforms = [
  { 
    id: 'stripe', 
    name: 'Stripe',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
      </svg>
    ),
  },
  { 
    id: 'gumroad', 
    name: 'Gumroad',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 2c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z"/>
      </svg>
    ),
  },
  { 
    id: 'shopify', 
    name: 'Shopify',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M15.337 3.415c-.03-.098-.128-.147-.226-.157-.098-.01-2.049-.157-2.049-.157s-1.354-1.344-1.502-1.492c-.147-.147-.432-.098-.541-.069l-.746.226c-.442-1.275-1.226-2.451-2.599-2.451h-.118C7.156-.235 6.666.001 6.215.305 4.736 1.275 4.049 3.405 3.813 4.503l-2.167.668c-.668.206-.688.226-.775.855C.783 6.693 0 12.93 0 12.93l11.201 2.098 6.049-1.305s-1.884-10.072-1.913-10.308zM10.898 2.4l-1.198.373c0-.393-.049-.981-.196-1.59.481.098.806.628.981 1.218h.413zm-1.943.589l-2.579.794c.255-.981.745-1.962 1.687-2.304.363.344.618.883.765 1.511h.127zM7.998.718c.118 0 .236.029.344.089-.981.471-1.943 1.648-2.265 3.905l-2.049.628C4.49 3.798 5.708.708 7.998.718z"/>
        <path d="M15.111 3.258c-.098-.01-2.049-.157-2.049-.157s-1.354-1.344-1.502-1.492c-.059-.059-.128-.079-.196-.089l-.853 17.42 6.049-1.305s-1.884-10.072-1.913-10.308c-.03-.098-.128-.147-.226-.157l.69 4.088z"/>
      </svg>
    ),
  },
];

type WizardStep = 'welcome' | 'link' | 'source' | 'setup';

interface WelcomeWizardProps {
  userName?: string;
  onComplete: () => void;
}

export const WelcomeWizard = ({ userName = 'Ghost', onComplete }: WelcomeWizardProps) => {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [showParticles, setShowParticles] = useState(true);
  const [linkName, setLinkName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  // Get pending link from localStorage
  const pendingLink = typeof window !== 'undefined' 
    ? localStorage.getItem('pending_initial_link') 
    : null;

  // Auto-transition from welcome to link after 2.5s
  useEffect(() => {
    if (step === 'welcome') {
      const timer = setTimeout(() => {
        setShowParticles(false);
        setStep('link');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    if (step === 'link') {
      setStep('source');
    } else if (step === 'source') {
      setStep('setup');
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    
    // Store completion flag
    localStorage.setItem('has_seen_welcome_wizard', 'true');
    
    // Clean up pending link
    if (pendingLink) {
      localStorage.removeItem('pending_initial_link');
    }
    
    // Delay to allow exit animation
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4"
          >
            <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
              {/* Border Beam Animation */}
              <BorderBeam size={250} duration={10} />

              {/* Content */}
              <div className="relative z-10 p-8">
                <AnimatePresence mode="wait">
                  {/* Welcome Step */}
                  {step === 'welcome' && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center py-8"
                    >
                      <WizardParticles active={showParticles} count={25} />
                      
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", damping: 15 }}
                        className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
                      >
                        <Check className="w-8 h-8 text-success" />
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-semibold text-foreground mb-3"
                      >
                        Welcome to the elite, <span className="text-primary">{userName}</span>.
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-muted-foreground"
                      >
                        Your infrastructure is ready.
                      </motion.p>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"
                      >
                        <Zap className="w-3 h-3 text-primary animate-pulse" />
                        <span>Initializing...</span>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Link Step */}
                  {step === 'link' && (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ type: "spring", damping: 25 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          1
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Name Your Link</h3>
                      </div>

                      {pendingLink && (
                        <div className="mb-6 p-4 rounded-lg bg-muted/50 border border-border">
                          <p className="text-xs text-muted-foreground mb-1">We secured your link:</p>
                          <p className="text-sm font-mono text-foreground truncate">{pendingLink}</p>
                        </div>
                      )}

                      <div className="space-y-4 mb-8">
                        <div className="space-y-2">
                          <Label htmlFor="linkName">Give it a name</Label>
                          <Input
                            id="linkName"
                            placeholder="e.g., Instagram Bio, TikTok Link"
                            value={linkName}
                            onChange={(e) => setLinkName(e.target.value)}
                            className="bg-background"
                          />
                          <p className="text-xs text-muted-foreground">
                            This helps you identify the link in your dashboard
                          </p>
                        </div>
                      </div>

                      <Button 
                        onClick={handleNext}
                        className="w-full group"
                        size="lg"
                      >
                        Next: Connect Revenue
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Source Step */}
                  {step === 'source' && (
                    <motion.div
                      key="source"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ type: "spring", damping: 25 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          2
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Connect Revenue</h3>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6">
                        Select your primary platform for revenue tracking
                      </p>

                      <div className="grid grid-cols-3 gap-3 mb-8">
                        {platforms.map((platform) => (
                          <motion.button
                            key={platform.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedPlatform(platform.id)}
                            className={cn(
                              "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200",
                              selectedPlatform === platform.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                            )}
                          >
                            {selectedPlatform === platform.id && (
                              <motion.div
                                layoutId="platformCheck"
                                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                              >
                                <Check className="w-3 h-3 text-primary-foreground" />
                              </motion.div>
                            )}
                            <div className="opacity-80">{platform.logo}</div>
                            <span className="text-xs font-medium">{platform.name}</span>
                          </motion.button>
                        ))}
                      </div>

                      <Button 
                        onClick={handleNext}
                        className="w-full group"
                        size="lg"
                        disabled={!selectedPlatform}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Setup Step */}
                  {step === 'setup' && (
                    <motion.div
                      key="setup"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ type: "spring", damping: 25 }}
                    >
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                          3
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Final Setup</h3>
                      </div>

                      {/* Custom Domain Preview */}
                      <div className="mb-8">
                        <div className="p-4 rounded-xl border border-dashed border-border/70 bg-muted/20">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">Custom Domain</p>
                              <p className="text-xs text-muted-foreground">Available on Pro plan</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50 border border-border/50">
                            <span className="text-sm text-muted-foreground">https://</span>
                            <span className="text-sm font-medium text-foreground">links.yourbrand.com</span>
                            <Sparkles className="w-3 h-3 text-primary ml-auto" />
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleComplete}
                        className="w-full group"
                        size="lg"
                        variant="glow"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Initialize Dashboard
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Step Indicator */}
                {step !== 'welcome' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center gap-2 mt-6"
                  >
                    {['link', 'source', 'setup'].map((s, i) => (
                      <div
                        key={s}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          s === step 
                            ? "bg-primary" 
                            : ['link', 'source', 'setup'].indexOf(step) > i
                              ? "bg-primary/50"
                              : "bg-muted"
                        )}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
