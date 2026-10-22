import React from 'react';
import LegalLayout from './LegalLayout.jsx';
import { LEGAL } from './legalConfig.js';

// Written from what the app actually does (see backend/src). If you
// change data practices, update this page and bump the version.
export default function PrivacyPage() {
  const { appName, company, address, contactEmail, hostingRegion, logRetentionDays, backupRetentionDays } = LEGAL;

  return (
    <LegalLayout title="Privacy Policy">
      <p>
        This policy explains what information {appName} collects, how we use it, who can see it,
        and the choices you have. {appName} is operated by {company} ({address}). Questions or
        requests: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h2>1. Information we collect</h2>
      <h3>Information you give us</h3>
      <ul>
        <li><strong>Account:</strong> your name, username, email address and password. Passwords are stored only as a salted hash, never in readable form.</li>
        <li><strong>Optional account details:</strong> phone number, gender and date of birth, if you add them in Settings. These are never shown to other users.</li>
        <li><strong>Profile:</strong> profile photo, bio, a location you type in, and a website link. These are visible on your profile.</li>
        <li><strong>Content:</strong> posts, reels, stories, comments, notes, reactions, reposts, saved items, marketplace listings, groups and events you create or join.</li>
        <li><strong>Messages:</strong> direct and group messages, including photos and videos you send.</li>
        <li><strong>Connections:</strong> who you follow and who follows you, follow requests, and the people you block, mute or add to Close Friends.</li>
        <li><strong>Reports:</strong> content or accounts you report, and the reason.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li><strong>Login activity:</strong> for each sign-in, the type of device and app or browser, the IP address and the time. We keep your last 10 sign-ins from the past 90 days so you can spot sign-ins that weren't you (Settings → Security → Login activity).</li>
        <li><strong>Activity status:</strong> whether you're online and when you were last active.</li>
        <li><strong>Interaction records:</strong> who viewed your stories, and whether messages have been read.</li>
        <li><strong>Push notification token:</strong> if you allow notifications, a token that lets us send them to your device.</li>
        <li><strong>Server logs:</strong> when you use the service, our servers record the IP address, the request made, your user ID and the time, for security and troubleshooting. Logs are kept for {logRetentionDays} days.</li>
      </ul>
      <h3>What we don't collect</h3>
      <p>
        We don't access your contacts or your device's precise (GPS) location, and we don't process payments.
        We don't use advertising or third-party analytics trackers, and we don't sell your personal information.
      </p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>To run {appName}: showing your profile and content, delivering messages and notifications, and building your feeds.</li>
        <li>To keep accounts secure: sign-in verification codes, two-factor authentication, login activity, rate limiting and detecting abuse.</li>
        <li>To enforce our <a href="/terms">Terms</a>: reviewing reports and acting on content or accounts that break the rules.</li>
        <li>To send essential emails: verification codes, security alerts (for example, when your email address changes) and important service notices.</li>
        <li>To diagnose errors and keep the service working.</li>
      </ul>

      <h2>3. Who can see your information</h2>
      <ul>
        <li><strong>Public accounts:</strong> your profile, posts, reels and follower lists can be seen by anyone using {appName}.</li>
        <li><strong>Private accounts:</strong> people who don't follow you see only your name, username, photo, bio and follower counts. They must send a follow request, which you can accept or decline. Your private content is never shown in other people's feeds or search, and can't be reposted.</li>
        <li><strong>Stories</strong> disappear after 24 hours. You can see who viewed and reacted to your stories; others can't.</li>
        <li><strong>Messages</strong> are visible only to the people in the conversation. {appName} staff do not have a tool for reading your private messages. Messages are protected in transit (HTTPS) but are <strong>not end-to-end encrypted</strong>, so they're stored on our servers in a form our systems can read.</li>
        <li><strong>Your settings:</strong> in Settings → Privacy you can turn off <em>Activity status</em> (others won't see when you're online or last active) and <em>Read receipts</em> (others won't see when you've read their messages; group chats always show them). Both work both ways: with a setting off, you won't see other people's either.</li>
        <li><strong>Blocking</strong> hides your profile and content from that person completely, in both directions, and stops all contact. <strong>Muting</strong> just hides someone's posts and stories from your feeds; they aren't told.</li>
        <li><strong>Media links:</strong> photos and videos are delivered through a content delivery network using long, random links that can't be guessed. Anyone who has a link can open that file, so a link someone copies or shares can be opened outside the app.</li>
        <li><strong>Moderators:</strong> authorised {appName} staff can see account details and posted content when reviewing reports or enforcing the Terms.</li>
      </ul>

      <h2>4. Service providers</h2>
      <p>We use trusted providers who process data only on our behalf to run the service:</p>
      <ul>
        <li><strong>Amazon Web Services</strong>: storing and delivering photos and videos (S3, CloudFront) and processing images.</li>
        <li><strong>Database and cache hosting</strong>: storing your account, content and connections.</li>
        <li><strong>Email delivery provider</strong>: sending verification codes and security emails.</li>
        <li><strong>Expo, Apple and Google push services</strong>: delivering push notifications to your device.</li>
        <li><strong>Sentry</strong> (if enabled): error reports, which include a user ID but never request contents or passwords.</li>
      </ul>
      <p>Our data is hosted in {hostingRegion}. If it's processed outside your country, we rely on appropriate legal safeguards for the transfer.</p>
      <p>We may share information if the law requires it, to protect people's safety, or as part of a merger or acquisition (in which case this policy would continue to apply).</p>

      <h2>5. How long we keep information</h2>
      <ul>
        <li>Account information and content: until you delete it, or until you delete your account.</li>
        <li>Stories and notes: 24 hours.</li>
        <li>Verification codes: 5 minutes.</li>
        <li>Login activity: your last 10 sign-ins, up to 90 days.</li>
        <li>Server logs: {logRetentionDays} days. Backups: {backupRetentionDays} days. Deleted data can remain in backups until they expire, and is then gone permanently.</li>
      </ul>

      <h2>6. Your choices and rights</h2>
      <ul>
        <li><strong>Download your data:</strong> Settings → Security → Download your data gives you a copy of your information in a machine-readable file.</li>
        <li><strong>Correct it:</strong> edit your profile and account details at any time. Changing your email address requires a code sent to the new address.</li>
        <li><strong>Delete it:</strong> delete individual posts, stories, reels and messages, or your whole account (Settings → Account → Delete account). Deleting your account permanently removes your profile, content, messages you sent, your conversations, your connections and your media files.</li>
        <li><strong>Control visibility:</strong> private account, activity status, read receipts, block and mute.</li>
        <li><strong>Sessions:</strong> log out of a single device, or of all devices at once (Settings → Security).</li>
      </ul>
      <p>
        Depending on where you live (for example under the EU/UK GDPR, the California Consumer Privacy Act or
        India's Digital Personal Data Protection Act), you may have additional rights, such as objecting to or restricting
        processing, or complaining to a data protection authority. To use any right, email{' '}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. We'll respond within the time the law requires.
      </p>

      <h2>7. Children</h2>
      <p>
        {appName} is not for children under 13, and everyone confirms they're at least 13 when signing up. If
        we learn that a child under 13 has an account, we'll delete it. Some countries set a higher minimum
        age; there, you must meet that age or have a parent's or guardian's permission.
      </p>

      <h2>8. Security</h2>
      <p>
        We protect your information with encryption in transit, hashed passwords, verification codes that
        lock after repeated wrong guesses, optional two-factor authentication, rate limiting, session revocation
        and access controls. No system is perfectly secure; if a breach affects your personal information,
        we'll notify you and the authorities as the law requires.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        If we make important changes, we'll tell you in the app or by email before they take effect, and
        update the version and date at the top.
      </p>

      <h2>10. Contact</h2>
      <p>
        {company}, {address}. Email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </LegalLayout>
  );
}
