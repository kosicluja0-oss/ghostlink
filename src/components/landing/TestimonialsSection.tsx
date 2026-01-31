import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  avatar: string | null;
  content: string;
  rating: number;
  isPlaceholder: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Beta User',
    role: 'Affiliate Marketer',
    avatar: null,
    content: 'Your testimonial could be here. Join our beta program and share your experience with Ghost Link.',
    rating: 5,
    isPlaceholder: true,
  },
  {
    id: 2,
    name: 'Beta User',
    role: 'Content Creator',
    avatar: null,
    content: 'We\'re collecting feedback from our early adopters. Be one of the first to share your success story.',
    rating: 5,
    isPlaceholder: true,
  },
  {
    id: 3,
    name: 'Beta User',
    role: 'Digital Agency',
    avatar: null,
    content: 'Help us shape the future of link tracking. Your feedback matters and could be featured here.',
    rating: 5,
    isPlaceholder: true,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating ? 'fill-warning text-warning' : 'text-muted'
          }`}
        />
      ))}
    </div>
  );
}

function AvatarPlaceholder({ name }: { name: string }) {
  return (
    <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
      <span className="text-lg font-semibold text-primary/50">
        {name.charAt(0)}
      </span>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 px-4 bg-card/30">
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
            What Our Users Say
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join our growing community of marketers and creators
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.id} variants={itemVariants}>
              <Card
                className={`h-full ${
                  testimonial.isPlaceholder
                    ? 'border-dashed border-border/70 bg-card/50'
                    : 'border-border'
                }`}
              >
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <Quote
                    className={`h-8 w-8 mb-4 ${
                      testimonial.isPlaceholder
                        ? 'text-muted/30'
                        : 'text-primary/30'
                    }`}
                  />

                  {/* Content */}
                  <p
                    className={`text-sm leading-relaxed mb-6 ${
                      testimonial.isPlaceholder
                        ? 'text-muted-foreground/70 italic'
                        : 'text-foreground'
                    }`}
                  >
                    "{testimonial.content}"
                  </p>

                  {/* Rating */}
                  <div className="mb-4">
                    <StarRating rating={testimonial.isPlaceholder ? 0 : testimonial.rating} />
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <AvatarPlaceholder name={testimonial.name} />
                    )}
                    <div>
                      <div
                        className={`font-medium ${
                          testimonial.isPlaceholder
                            ? 'text-muted-foreground/70'
                            : 'text-foreground'
                        }`}
                      >
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            Are you a beta user?{' '}
            <a
              href="mailto:feedback@ghostlink.app"
              className="text-primary hover:underline"
            >
              Share your feedback
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
