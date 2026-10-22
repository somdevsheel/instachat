import React from 'react';
import LegalLayout from './LegalLayout.jsx';
import { LEGAL } from './legalConfig.js';

export default function TermsPage() {
  const { appName, company, supportEmail, governingLaw } = LEGAL;

  return (
    <LegalLayout title="Terms of Use">
      <p>
        These terms are an agreement between you and {company} about your use of {appName}. By
        creating an account or using {appName}, you agree to them and to our{' '}
        <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>1. Who can use {appName}</h2>
      <ul>
        <li>You must be at least 13 years old, or older if your country requires it, and able to agree to these terms.</li>
        <li>You must not use {appName} if we've previously banned you, or if the law prohibits you from using it.</li>
      </ul>

      <h2>2. Your account</h2>
      <ul>
        <li>Give accurate information and keep your password secure. You're responsible for what happens on your account.</li>
        <li>Don't impersonate anyone, or create accounts to get around a ban or a block.</li>
        <li>If you think someone else has access, change your password and use "Log out of all devices" (Settings → Security).</li>
      </ul>

      <h2>3. Your content</h2>
      <ul>
        <li>You own the content you post. You give us a worldwide, non-exclusive, royalty-free licence to host, store, display and distribute it only to operate and provide {appName}, according to your settings. The licence ends when you delete the content or your account, except for copies in backups, which expire on their normal schedule.</li>
        <li>Only post content you have the right to share.</li>
        <li>Content you share in a conversation, or that others repost while it's public, may be seen by the people you shared it with.</li>
      </ul>

      <h2>4. What you must not do</h2>
      <ul>
        <li>Harass, bully, threaten or incite violence against anyone, or post hate speech.</li>
        <li>Post sexual content involving minors (we report this to the authorities), non-consensual intimate images, or graphic violence.</li>
        <li>Spam, run scams, or sell illegal or regulated goods (including on the marketplace).</li>
        <li>Share other people's private information without their consent.</li>
        <li>Infringe copyright, trademarks or other rights.</li>
        <li>Interfere with the service: hacking, scraping, bypassing rate limits or security, or automated access without our permission.</li>
        <li>Break any law that applies to you.</li>
      </ul>

      <h2>5. Reports and enforcement</h2>
      <p>
        You can report content or accounts in the app. We review reports, and we may remove content, warn,
        suspend (temporarily) or ban (permanently) accounts that break these terms or put others at risk. Where
        practical, we'll tell you what we did and why. If you think we got it wrong, contact{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>

      <h2>6. Marketplace, groups and events</h2>
      <p>
        Marketplace listings, groups and events are created by users. {appName} isn't a party to any sale or
        arrangement between users, doesn't process payments, and doesn't guarantee listings or events. Take
        sensible precautions when meeting people or exchanging goods.
      </p>

      <h2>7. Ending your use</h2>
      <p>
        You can delete your account at any time (Settings → Account → Delete account). This permanently removes
        your data as described in the Privacy Policy. We may end or suspend your access if you seriously or
        repeatedly break these terms, or if we have to by law.
      </p>

      <h2>8. The service "as is"</h2>
      <p>
        We work to keep {appName} available and secure, but we provide it "as is", without guarantees that it
        will always be available or error-free, to the extent the law allows. We're not responsible for content
        posted by other users.
      </p>

      <h2>9. Liability</h2>
      <p>
        To the extent the law allows, {company} isn't liable for indirect or consequential losses, or for
        losses caused by other users. Nothing in these terms limits liability that can't legally be limited, or
        your rights as a consumer.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update these terms. For important changes we'll notify you in advance, in the app or by email.
        If you keep using {appName} after the changes take effect, you accept them.
      </p>

      <h2>11. Governing law and contact</h2>
      <p>
        These terms are governed by the laws of {governingLaw}, without affecting any rights you have under
        the consumer laws of the country where you live. Contact:{' '}
        <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
      </p>
    </LegalLayout>
  );
}
