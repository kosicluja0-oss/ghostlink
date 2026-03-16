import { motion } from 'framer-motion';
import { Link2, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

const steps = [
  {
    icon: Link2,
    step: '01',
    title: 'Paste your link',
    description: 'Drop in any affiliate or campaign URL. We generate a unique tracking link in seconds.',
  },
  {
    icon: BarChart3,
    step: '02',
    title: 'Share & track',
    description: 'Share your Ghost Link anywhere. Every click is tracked in real-time with geo and source data.',
  },
  {
    icon: TrendingUp,
    step: '03',
    title: 'Analyze performance',
    description: 'See which links convert, where your traffic comes from, and what\'s actually working.',
  },
  {
    icon: DollarSign,
    step: '04',
    title: 'Scale what works',
    description: 'Double down on winning campaigns. Cut the losers. Grow your revenue with data, not guesswork.',
  },
];

export function WorkflowSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            From link to revenue in 4 steps
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            No complex setup. No dev team needed. Just paste, share, and watch the data roll in.
          </p>
        </div>

        <div className="relative grid md:grid-cols-4 gap-6 md:gap-4">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[3.25rem] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0" />

          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step circle */}
              <div className="relative z-10 h-[4.25rem] w-[4.25rem] rounded-2xl bg-card border border-border flex items-center justify-center mb-5 shadow-[0_4px_20px_hsl(var(--primary)/0.08)] group-hover:border-primary/50 transition-colors">
                <step.icon className="h-6 w-6 text-primary" />
                <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>

              <h3 className="font-semibold text-foreground text-lg mb-1.5">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[220px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
