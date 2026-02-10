import { Ghost, Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VerifyEmail() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative text-center">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Ghost className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight">Ghost Link</span>
        </Link>

        <div className="bg-card border border-white/10 rounded-xl p-8 shadow-xl shadow-black/20">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h1 className="text-2xl font-extrabold text-foreground mb-2">
            Verify your email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            We've sent a confirmation link to your email address.
            Click the link in the email to verify your account and continue to plan selection.
          </p>

          <div className="bg-muted/30 border border-border rounded-lg p-4 text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or try signing up again.
          </div>
        </div>

        <div className="mt-6">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
