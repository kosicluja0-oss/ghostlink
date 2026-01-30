import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  ArrowRight, 
  Zap, 
  ChevronRight, 
  Loader2, 
  Copy, 
  ExternalLink, 
  Pencil, 
  Save,
  BarChart3,
  DollarSign,
  Target,
  Link2,
  MousePointerClick,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BorderBeam } from './BorderBeam';
import { WizardParticles } from './WizardParticles';
import { WizardProgressBar } from './WizardProgressBar';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getTrackingBaseUrl, getTrackingUrl, getDisplayUrl } from '@/lib/trackingUrl';

// Platform logos - using actual PNG assets
import beehiivLogo from '@/assets/logos/beehiiv.png';
import clickbankLogo from '@/assets/logos/clickbank.png';
import convertkitLogo from '@/assets/logos/convertkit.png';
import digistore24Logo from '@/assets/logos/digistore24.png';
import gohighlevelLogo from '@/assets/logos/gohighlevel.png';
import hotmartLogo from '@/assets/logos/hotmart.png';
import samcartLogo from '@/assets/logos/samcart.png';
import thrivecartLogo from '@/assets/logos/thrivecart.png';
import whopLogo from '@/assets/logos/whop.png';

// Platform data with categories
const platforms = [
  // Payment Processors
  { 
    id: 'stripe', 
    name: 'Stripe',
    category: 'payment',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
      </svg>
    ),
  },
  { 
    id: 'thrivecart', 
    name: 'ThriveCart',
    category: 'payment',
    logoSrc: thrivecartLogo,
  },
  { 
    id: 'samcart', 
    name: 'SamCart',
    category: 'payment',
    logoSrc: samcartLogo,
  },
  // Creator Economy
  { 
    id: 'gumroad', 
    name: 'Gumroad',
    category: 'creator',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm0 2c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z"/>
      </svg>
    ),
  },
  { 
    id: 'whop', 
    name: 'Whop',
    category: 'creator',
    logoSrc: whopLogo,
  },
  { 
    id: 'beehiiv', 
    name: 'Beehiiv',
    category: 'creator',
    logoSrc: beehiivLogo,
  },
  { 
    id: 'convertkit', 
    name: 'ConvertKit',
    category: 'creator',
    logoSrc: convertkitLogo,
  },
  // E-commerce
  { 
    id: 'shopify', 
    name: 'Shopify',
    category: 'ecommerce',
    logo: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M15.337 3.415c-.03-.098-.128-.147-.226-.157-.098-.01-2.049-.157-2.049-.157s-1.354-1.344-1.502-1.492c-.147-.147-.432-.098-.541-.069l-.746.226c-.442-1.275-1.226-2.451-2.599-2.451h-.118C7.156-.235 6.666.001 6.215.305 4.736 1.275 4.049 3.405 3.813 4.503l-2.167.668c-.668.206-.688.226-.775.855C.783 6.693 0 12.93 0 12.93l11.201 2.098 6.049-1.305s-1.884-10.072-1.913-10.308zM10.898 2.4l-1.198.373c0-.393-.049-.981-.196-1.59.481.098.806.628.981 1.218h.413zm-1.943.589l-2.579.794c.255-.981.745-1.962 1.687-2.304.363.344.618.883.765 1.511h.127zM7.998.718c.118 0 .236.029.344.089-.981.471-1.943 1.648-2.265 3.905l-2.049.628C4.49 3.798 5.708.708 7.998.718z"/>
        <path d="M15.111 3.258c-.098-.01-2.049-.157-2.049-.157s-1.354-1.344-1.502-1.492c-.059-.059-.128-.079-.196-.089l-.853 17.42 6.049-1.305s-1.884-10.072-1.913-10.308c-.03-.098-.128-.147-.226-.157l.69 4.088z"/>
      </svg>
    ),
  },
  // Affiliate Networks
  { 
    id: 'clickbank', 
    name: 'ClickBank',
    category: 'affiliate',
    logoSrc: clickbankLogo,
  },
  { 
    id: 'digistore24', 
    name: 'Digistore24',
    category: 'affiliate',
    logoSrc: digistore24Logo,
  },
  { 
    id: 'hotmart', 
    name: 'Hotmart',
    category: 'affiliate',
    logoSrc: hotmartLogo,
  },
  // Automation
  { 
    id: 'gohighlevel', 
    name: 'GoHighLevel',
    category: 'automation',
    logoSrc: gohighlevelLogo,
  },
];

type WizardStep = 'welcome' | 'value' | 'platforms' | 'success';

const WIZARD_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'value', label: 'How It Works' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'success', label: 'Ready' },
];

interface WelcomeWizardProps {
  userName?: string;
  onComplete: () => void;
  onLinkCreated?: () => void;
}

export const WelcomeWizard = ({ userName = 'Ghost', onComplete, onLinkCreated }: WelcomeWizardProps) => {
  const [step, setStep] = useState<WizardStep>('welcome');
  const [showParticles, setShowParticles] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedAlias, setGeneratedAlias] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Editable slug state
  const [editableSlug, setEditableSlug] = useState<string>('');
  const [originalSlug, setOriginalSlug] = useState<string>('');
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [isSavingSlug, setIsSavingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [createdLinkId, setCreatedLinkId] = useState<string | null>(null);

  // Validate slug - only URL-safe characters
  const validateSlug = (slug: string): boolean => {
    const validSlugRegex = /^[a-z0-9-]+$/;
    return validSlugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
  };

  // Handle slug input change
  const handleSlugChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setEditableSlug(sanitized);
    
    if (sanitized.length > 0 && !validateSlug(sanitized)) {
      if (sanitized.length < 3) {
        setSlugError('Slug must be at least 3 characters');
      } else if (sanitized.length > 50) {
        setSlugError('Slug must be 50 characters or less');
      } else {
        setSlugError('Only letters, numbers, and hyphens allowed');
      }
    } else {
      setSlugError(null);
    }
  };

  // Save updated slug to database
  const handleSaveSlug = async () => {
    if (!createdLinkId || !editableSlug || editableSlug === originalSlug) return;
    
    if (!validateSlug(editableSlug)) {
      setSlugError('Invalid slug format');
      return;
    }
    
    setIsSavingSlug(true);
    
    try {
      const { error } = await supabase
        .from('links')
        .update({ custom_alias: editableSlug })
        .eq('id', createdLinkId);
      
      if (error) {
        if (error.code === '23505') {
          setSlugError('This slug is already taken');
        } else {
          toast.error('Failed to update slug');
        }
        setIsSavingSlug(false);
        return;
      }
      
      setOriginalSlug(editableSlug);
      setGeneratedAlias(editableSlug);
      setIsEditingSlug(false);
      toast.success('Slug updated successfully!');
      
      onLinkCreated?.();
    } catch (error) {
      console.error('Error saving slug:', error);
      toast.error('Something went wrong');
    } finally {
      setIsSavingSlug(false);
    }
  };

  const hasSlugChanged = editableSlug !== originalSlug && editableSlug.length > 0;

  // Get pending link from localStorage
  const pendingLink = typeof window !== 'undefined' 
    ? localStorage.getItem('pending_initial_link') 
    : null;

  // Extract domain from pending link for display
  const getPendingLinkDisplay = () => {
    if (!pendingLink) return null;
    try {
      const url = new URL(pendingLink.startsWith('http') ? pendingLink : `https://${pendingLink}`);
      return url.hostname + (url.pathname !== '/' ? url.pathname : '');
    } catch {
      return pendingLink;
    }
  };

  // Navigation handlers
  const handleBack = () => {
    if (step === 'value') setStep('welcome');
    else if (step === 'platforms') setStep('value');
    else if (step === 'success') setStep('platforms');
  };

  const handleStepClick = (stepId: string) => {
    setStep(stepId as WizardStep);
  };

  const handleWelcomeContinue = () => {
    setShowParticles(false);
    setStep('value');
  };

  const handleValueContinue = () => {
    setStep('platforms');
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleInitialize = async () => {
    if (pendingLink) {
      setIsSaving(true);
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('You must be logged in to save your link');
          setIsSaving(false);
          return;
        }

        const alias = 'link-' + Date.now().toString(36);

        const { data, error } = await supabase
          .from('links')
          .insert({
            user_id: session.user.id,
            target_url: pendingLink,
            custom_alias: alias,
            has_bridge_page: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving link:', error);
          if (error.code === '23505') {
            toast.error('This alias is already taken. Please try again.');
          } else {
            toast.error('Failed to save your link');
          }
          setIsSaving(false);
          return;
        }

        localStorage.removeItem('pending_initial_link');
        onLinkCreated?.();
        
        setGeneratedAlias(alias);
        setCreatedLinkId(data.id);
        setEditableSlug(alias);
        setOriginalSlug(alias);
        setStep('success');
      } catch (error) {
        console.error('Error in handleInitialize:', error);
        toast.error('Something went wrong. Please try again.');
        setIsSaving(false);
        return;
      }
      
      setIsSaving(false);
    } else {
      setStep('success');
    }
  };

  const handleSkipPlatforms = () => {
    setSelectedPlatforms([]);
    handleInitialize();
  };

  const handleCopyLink = async () => {
    if (!editableSlug) return;
    
    const ghostLink = getTrackingUrl(editableSlug);
    await navigator.clipboard.writeText(ghostLink);
    setIsCopied(true);
    toast.success('Ghost Link copied to clipboard!');
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleComplete = () => {
    setIsExiting(true);
    localStorage.setItem('has_seen_welcome_wizard', 'true');
    
    setTimeout(() => {
      onComplete();
    }, 500);
  };

  const pendingLinkDisplay = getPendingLinkDisplay();

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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-lg mx-4"
          >
            <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden">
              <BorderBeam size={250} duration={10} />

              {/* Content */}
              <div className="relative z-10 p-8">
                {/* Progress Bar - show on all steps except welcome */}
                {step !== 'welcome' && (
                  <WizardProgressBar
                    steps={WIZARD_STEPS}
                    currentStep={step}
                    onBack={handleBack}
                    onStepClick={handleStepClick}
                    showBackButton={step !== 'success'}
                  />
                )}

                <AnimatePresence mode="wait">
                  {/* Welcome Step */}
                  {step === 'welcome' && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="text-center py-6"
                    >
                      <WizardParticles active={showParticles} count={25} />
                      
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.15, duration: 0.3, ease: "easeOut" }}
                        className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
                      >
                        <Check className="w-8 h-8 text-success" />
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25, duration: 0.25 }}
                        className="text-2xl font-semibold text-foreground mb-3"
                      >
                        Welcome to the elite, <span className="text-primary">{userName}</span>.
                      </motion.h2>

                      {/* Pending URL Chip */}
                      {pendingLinkDisplay && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.25 }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
                        >
                          <Link2 className="w-4 h-4 text-primary" />
                          <span className="text-sm text-primary font-medium truncate max-w-[200px]">
                            {pendingLinkDisplay}
                          </span>
                        </motion.div>
                      )}

                      {/* Value Props */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.25 }}
                        className="mb-8"
                      >
                        <p className="text-sm text-muted-foreground mb-4">What you'll unlock:</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            <span className="text-xs text-muted-foreground text-center">Real-time Tracking</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <DollarSign className="w-6 h-6 text-primary" />
                            <span className="text-xs text-muted-foreground text-center">Revenue Attribution</span>
                          </div>
                          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
                            <Target className="w-6 h-6 text-primary" />
                            <span className="text-xs text-muted-foreground text-center">Smart Analytics</span>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55, duration: 0.25 }}
                      >
                        <Button 
                          onClick={handleWelcomeContinue}
                          className="group"
                          size="lg"
                        >
                          Get Started
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Value Props Step (How It Works) */}
                  {step === 'value' && (
                    <motion.div
                      key="value"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
                        How Ghost Link Works
                      </h3>

                      {/* Flow Diagram */}
                      <div className="space-y-4 mb-8">
                        {/* Step 1: Your URL → Ghost Link */}
                        <div className="flex items-center justify-center gap-3">
                          <div className="flex flex-col items-center">
                            <div className="px-4 py-2 rounded-lg bg-muted/50 border border-border">
                              <span className="text-xs text-muted-foreground block">Your URL</span>
                              <span className="text-sm font-mono text-foreground">shop.com/product</span>
                            </div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-primary shrink-0" />
                          <div className="flex flex-col items-center">
                            <div className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                              <span className="text-xs text-primary block">Ghost Link</span>
                              <span className="text-sm font-mono text-primary">g.lnk/xyz</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow Down */}
                        <div className="flex justify-center">
                          <div className="w-0.5 h-6 bg-border" />
                        </div>

                        {/* Step 2: Click Tracking */}
                        <div className="flex items-center justify-center gap-6">
                          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/30 border border-border/50">
                            <MousePointerClick className="w-5 h-5 text-primary" />
                            <div>
                              <span className="text-xs text-muted-foreground block">Clicks</span>
                              <span className="text-sm font-medium">Tracked</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/30 border border-border/50">
                            <DollarSign className="w-5 h-5 text-success" />
                            <div>
                              <span className="text-xs text-muted-foreground block">Sales</span>
                              <span className="text-sm font-medium">Attributed</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/30 border border-border/50">
                            <TrendingUp className="w-5 h-5 text-chart-1" />
                            <div>
                              <span className="text-xs text-muted-foreground block">EPC</span>
                              <span className="text-sm font-medium">Calculated</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      <p className="text-sm text-muted-foreground text-center mb-8">
                        We track every click and attribute sales back to specific placements, 
                        so you know exactly which links drive revenue.
                      </p>

                      <Button 
                        onClick={handleValueContinue}
                        className="w-full group"
                        size="lg"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}

                  {/* Platforms Step */}
                  {step === 'platforms' && (
                    <motion.div
                      key="platforms"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                        Connect Revenue Platforms
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 text-center">
                        Select the platforms you use (you can add more later)
                      </p>

                      {/* Platform Grid */}
                      <div className="grid grid-cols-4 gap-2 mb-6 max-h-[280px] overflow-y-auto pr-1">
                        {platforms.map((platform) => {
                          const isSelected = selectedPlatforms.includes(platform.id);
                          return (
                            <motion.button
                              key={platform.id}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handlePlatformToggle(platform.id)}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                              )}
                            >
                              {isSelected && (
                                <motion.div
                                  layoutId="platformCheck"
                                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                                >
                                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                </motion.div>
                              )}
                              <div className="w-8 h-8 flex items-center justify-center">
                                {'logoSrc' in platform ? (
                                  <img 
                                    src={platform.logoSrc} 
                                    alt={platform.name} 
                                    className="w-8 h-8 object-contain"
                                  />
                                ) : (
                                  <div className="opacity-80">{platform.logo}</div>
                                )}
                              </div>
                              <span className="text-[10px] font-medium text-center leading-tight">
                                {platform.name}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      <div className="space-y-3">
                        <Button 
                          onClick={handleInitialize}
                          className="w-full group"
                          size="lg"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating your link...
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              {selectedPlatforms.length > 0 
                                ? `Continue with ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}`
                                : 'Initialize Dashboard'
                              }
                            </>
                          )}
                        </Button>
                        
                        <button
                          onClick={handleSkipPlatforms}
                          disabled={isSaving}
                          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 disabled:opacity-50"
                        >
                          Skip for now
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Success Step */}
                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="text-center py-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, duration: 0.3, ease: "easeOut" }}
                        className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
                      >
                        <Check className="w-8 h-8 text-success" />
                      </motion.div>

                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.25 }}
                        className="text-2xl font-semibold text-foreground mb-2"
                      >
                        You're all set!
                      </motion.h2>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.25 }}
                        className="text-muted-foreground mb-6"
                      >
                        Your Ghost Link is live and ready to track.
                      </motion.p>

                      {generatedAlias && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25, duration: 0.25 }}
                          className="mb-6 p-4 rounded-xl bg-muted/50 border border-border"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-muted-foreground">Your Ghost Link</p>
                            {!isEditingSlug && (
                              <button
                                onClick={() => setIsEditingSlug(true)}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center gap-1 p-3 rounded-lg bg-background/50 border border-border/50">
                              <span className="text-xs text-muted-foreground truncate flex-shrink-0">
                                {getTrackingBaseUrl()}/
                              </span>
                              {isEditingSlug ? (
                                <Input
                                  value={editableSlug}
                                  onChange={(e) => handleSlugChange(e.target.value)}
                                  className="h-6 px-1 py-0 text-sm font-mono text-primary bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                  placeholder="your-custom-slug"
                                  autoFocus
                                />
                              ) : (
                                <span className="text-sm font-mono text-primary truncate">
                                  {editableSlug}
                                </span>
                              )}
                            </div>
                            
                            {slugError && isEditingSlug && (
                              <p className="text-xs text-destructive">{slugError}</p>
                            )}
                            
                            {isEditingSlug && hasSlugChanged && !slugError && (
                              <Button
                                onClick={handleSaveSlug}
                                size="sm"
                                disabled={isSavingSlug || !!slugError}
                                className="w-full"
                              >
                                {isSavingSlug ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3 h-3 mr-2" />
                                    Save Custom Slug
                                  </>
                                )}
                              </Button>
                            )}
                            
                            {isEditingSlug && (
                              <button
                                onClick={() => {
                                  setEditableSlug(originalSlug);
                                  setSlugError(null);
                                  setIsEditingSlug(false);
                                }}
                                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Quick Tip */}
                      {generatedAlias && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3, duration: 0.25 }}
                          className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <p className="text-xs text-muted-foreground">
                            <span className="text-primary font-medium">Pro tip:</span> Add this link to your bio, 
                            email signature, or anywhere you share links to start tracking.
                          </p>
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35, duration: 0.25 }}
                        className="space-y-3"
                      >
                        {generatedAlias && (
                          <Button
                            onClick={handleCopyLink}
                            className="w-full group"
                            size="lg"
                            variant="glow"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Ghost Link
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          onClick={handleComplete}
                          variant={generatedAlias ? "outline" : "glow"}
                          className="w-full group"
                          size="lg"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Go to Dashboard
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
