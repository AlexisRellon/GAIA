import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="fixed top-4 right-4 z-[100]">
        <ThemeToggle />
      </div>
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <ShieldCheck size={20} />
            <span className="text-sm font-semibold uppercase tracking-wide">Privacy Policy</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Data, Your Safety</h1>
          <p className="text-muted-foreground">
            This policy explains how AGAILA handles personal information submitted through citizen reports.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Last updated: May 26, 2026</p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-md border border-border p-6 sm:p-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
            <p className="text-sm text-muted-foreground">
              AGAILA collects limited personal information to verify hazard reports, coordinate follow-up,
              and improve community safety. The system is designed to follow the Philippine Data Privacy Act
              of 2012 (RA 10173).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Information we collect</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Name and contact number</li>
              <li>Hazard type and description</li>
              <li>Location you provide (map pin or device location)</li>
              <li>Optional photo evidence and related metadata (such as timestamp)</li>
              <li>Submission metadata needed for security and abuse prevention</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">How we use the information</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Verify and triage hazard reports</li>
              <li>Contact reporters if follow-up is required</li>
              <li>Provide situational awareness to authorized responders</li>
              <li>Maintain audit logs for system integrity and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data sharing</h2>
            <p className="text-sm text-muted-foreground">
              We share report data only with authorized personnel involved in hazard verification and response
              (for example, LGU responders and validators). We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Security and protection</h2>
            <p className="text-sm text-muted-foreground">
              AGAILA applies access controls and stores sensitive fields using encryption. Administrative access
              is restricted and logged to support accountability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Retention</h2>
            <p className="text-sm text-muted-foreground">
              We retain personal data only as long as needed for verification, operational follow-up, and audit
              requirements. Where possible, records are anonymized or minimized when personal data is no longer required.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your rights</h2>
            <p className="text-sm text-muted-foreground">
              You may request access to your data, corrections, or deletion consistent with applicable laws and
              operational requirements. Contact the AGAILA administrators or your local LGU for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Changes to this policy</h2>
            <p className="text-sm text-muted-foreground">
              We may update this policy to reflect system changes. The latest version is always available at /privacy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
