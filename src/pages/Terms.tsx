import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <Ghost className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground tracking-tight">Ghost Link</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Ghost Link ("Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by these terms, please do not 
              use this service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Description of Service</h2>
            <p>
              Ghost Link is a SaaS platform that provides link tracking, analytics, and conversion tracking 
              services for affiliate marketers and businesses. The Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Link creation and management</li>
              <li>Click tracking and analytics</li>
              <li>Conversion tracking (leads and sales)</li>
              <li>Bridge page functionality</li>
              <li>S2S postback integration</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Promote illegal products or services</li>
              <li>Send spam or unsolicited communications</li>
              <li>Distribute malware or harmful code</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Engage in fraudulent activities</li>
              <li>Track links to adult, gambling, or prohibited content without proper compliance</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Subscription and Billing</h2>
            <p>
              Ghost Link offers free and paid subscription plans. For paid plans:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Billing occurs on a monthly or yearly basis, depending on your selection</li>
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>Price changes will be notified 30 days in advance</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Service Level</h2>
            <p>
              While we strive for 99.9% uptime, we do not guarantee uninterrupted access to the Service. 
              We reserve the right to modify, suspend, or discontinue the Service at any time with 
              reasonable notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Data Ownership</h2>
            <p>
              You retain ownership of all data you upload to the Service. Ghost Link has a limited license 
              to use this data solely for providing the Service. Your tracking data remains confidential 
              and is not shared with third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>
              Ghost Link shall not be liable for any indirect, incidental, special, consequential, or 
              punitive damages, including loss of profits, data, or other intangible losses resulting 
              from your use of the Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of these Terms. Upon 
              termination, your right to use the Service will immediately cease. You may request export 
              of your data within 30 days of termination.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant 
              changes via email or through the Service. Continued use after changes constitutes acceptance 
              of the new Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us through the Support section in your 
              dashboard or email us at support@ghostlink.app.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border mt-12">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Ghost Link. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
