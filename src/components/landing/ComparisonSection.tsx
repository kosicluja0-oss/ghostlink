import { Check, X, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ComparisonItem {
  label: string;
  ghostLink: string;
  industry: string;
  ghostLinkIcon: 'check' | 'dollar';
  industryIcon: 'x' | 'clock' | 'warning' | 'dollar';
}

const comparisonItems: ComparisonItem[] = [
  {
    label: 'Monthly Price',
    ghostLink: '$7.50 - $15',
    industry: '$80 - $150',
    ghostLinkIcon: 'dollar',
    industryIcon: 'dollar',
  },
  {
    label: 'Real-time Tracking',
    ghostLink: 'Instant',
    industry: 'Often delayed',
    ghostLinkIcon: 'check',
    industryIcon: 'clock',
  },
  {
    label: 'Free Tier',
    ghostLink: '25 links included',
    industry: 'Rare / $30+ minimum',
    ghostLinkIcon: 'check',
    industryIcon: 'x',
  },
  {
    label: 'Setup Time',
    ghostLink: 'Under 2 minutes',
    industry: '30+ minutes',
    ghostLinkIcon: 'check',
    industryIcon: 'clock',
  },
  {
    label: 'Revenue Tracking',
    ghostLink: 'Included in Pro',
    industry: 'Extra cost add-on',
    ghostLinkIcon: 'check',
    industryIcon: 'dollar',
  },
  {
    label: 'Hidden Fees',
    ghostLink: 'None - transparent',
    industry: 'Overage charges',
    ghostLinkIcon: 'check',
    industryIcon: 'warning',
  },
];

function GhostLinkIcon({ type }: { type: 'check' | 'dollar' }) {
  if (type === 'check') {
    return <Check className="h-4 w-4 text-success" />;
  }
  return <DollarSign className="h-4 w-4 text-success" />;
}

function IndustryIcon({ type }: { type: 'x' | 'clock' | 'warning' | 'dollar' }) {
  switch (type) {
    case 'x':
      return <X className="h-4 w-4 text-destructive" />;
    case 'clock':
      return <Clock className="h-4 w-4 text-warning" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-warning" />;
    case 'dollar':
      return <DollarSign className="h-4 w-4 text-destructive" />;
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function ComparisonSection() {
  return (
    <section id="comparison" className="py-20 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Ghost Link?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how we compare to industry standards
          </p>
        </motion.div>

        {/* Comparison Cards */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* Ghost Link Card */}
          <motion.div variants={itemVariants} whileHover={{ y: -4, boxShadow: '0 8px 30px hsl(var(--primary) / 0.15)' }} transition={{ duration: 0.3 }}>
            <Card className="border-primary/50 shadow-lg shadow-primary/10 relative overflow-hidden h-full">
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl text-foreground">
                  Ghost Link
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparisonItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-success/10 flex items-center justify-center">
                      <GhostLinkIcon type={item.ghostLinkIcon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-medium text-foreground">{item.ghostLink}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Industry Average Card */}
          <motion.div variants={itemVariants} whileHover={{ y: -4, boxShadow: '0 8px 30px hsl(0 0% 100% / 0.05)' }} transition={{ duration: 0.3 }}>
            <Card className="border-border bg-card/50 h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl text-muted-foreground">
                  Industry Average
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparisonItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex-shrink-0 h-6 w-6 rounded-full bg-muted/20 flex items-center justify-center">
                      <IndustryIcon type={item.industryIcon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-sm font-medium text-muted-foreground">{item.industry}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Mobile "vs" indicator - only visible on mobile when cards stack */}
        <div className="md:hidden flex justify-center -my-3 relative z-10">
          <div className="bg-background px-4 py-1 rounded-full border border-border text-sm text-muted-foreground font-medium">
            vs
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Link to="/auth?mode=signup">
            <Button variant="glow" size="lg">
              Start Free →
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
