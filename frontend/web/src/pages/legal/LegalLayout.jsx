import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL, hasPlaceholders } from './legalConfig.js';

/** Shared shell for the public Terms / Privacy pages (no login needed). */
export default function LegalLayout({ title, children }) {
  useEffect(() => {
    document.title = `${title} · ${LEGAL.appName}`;
  }, [title]);

  return (
    <div className="legal-page">
      <article className="legal-card">
        {hasPlaceholders() && (
          <div className="legal-draft" role="alert">
            Draft: company and contact details are not filled in yet
            (frontend/web/src/pages/legal/legalConfig.js).
          </div>
        )}
        <h1>{title}</h1>
        <p className="legal-meta">
          Effective {LEGAL.effectiveDate} · Version {LEGAL.version}
        </p>
        {children}
        <nav className="legal-nav">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/">Back to {LEGAL.appName}</Link>
        </nav>
      </article>
    </div>
  );
}
