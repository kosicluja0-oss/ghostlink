import { Link } from 'react-router-dom';
import { Ghost, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <p className="text-lg">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Introduction</h2>
            <p>
              Ghost Link ("we", "our", or "us") respects your privacy and is committed to protecting 
              your personal data. This privacy policy explains how we collect, use, and safeguard your 
              information when you use our link tracking service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-foreground">2.1 Account Information</h3>
            <p>When you register for Ghost Link, we collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Email address</li>
              <li>Display name (optional)</li>
              <li>Profile picture (optional)</li>
              <li>Payment information (processed securely by Stripe)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground">2.2 Tracking Data</h3>
            <p>When clicks occur through your Ghost Links, we collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP address (for geolocation)</li>
              <li>Country/region</li>
              <li>Timestamp</li>
              <li>Referrer source</li>
              <li>User agent (browser/device information)</li>
            </ul>

            <h3 className="text-xl font-medium text-foreground">2.3 Conversion Data</h3>
            <p>When conversions are tracked via postback:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Click ID reference</li>
              <li>Conversion type (lead/sale)</li>
              <li>Conversion value</li>
              <li>Timestamp</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. How We Use Your Information</h2>
            <p>We use collected information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide and maintain the Service</li>
              <li>Display analytics and reports in your dashboard</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send important service notifications</li>
              <li>Provide customer support</li>
              <li>Improve and optimize the Service</li>
              <li>Detect and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Data Storage and Security</h2>
            <p>
              Your data is stored securely using industry-standard encryption. We use:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>TLS/SSL encryption for all data in transit</li>
              <li>Encrypted databases for data at rest</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Data Sharing</h2>
            <p>
              We do not sell your personal data. We may share data with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Payment processors:</strong> Stripe for secure payment handling</li>
              <li><strong>Infrastructure providers:</strong> For hosting and service delivery</li>
              <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Cookies</h2>
            <p>
              We use essential cookies to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintain your login session</li>
              <li>Remember your preferences</li>
              <li>Ensure security of your account</li>
            </ul>
            <p>
              You can control cookie preferences through your browser settings or our cookie consent banner.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Your Rights (GDPR)</h2>
            <p>If you are in the European Economic Area, you have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to processing of your data</li>
              <li><strong>Restriction:</strong> Request limited processing of your data</li>
            </ul>
            <p>
              To exercise these rights, please contact us through the Support section or delete your 
              account in Settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. After account deletion:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Personal data is deleted within 30 days</li>
              <li>Anonymized analytics may be retained for service improvement</li>
              <li>Backup data is purged within 90 days</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Third-Party Links</h2>
            <p>
              Ghost Link tracks clicks to third-party websites. We are not responsible for the privacy 
              practices of these external sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Children's Privacy</h2>
            <p>
              Ghost Link is not intended for users under 16 years of age. We do not knowingly collect 
              personal information from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Contact Us</h2>
            <p>
              For questions about this privacy policy or our data practices, please contact us through 
              the Support section in your dashboard or email us at privacy@ghostlink.app.
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
