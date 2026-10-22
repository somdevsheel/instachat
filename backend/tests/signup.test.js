/**
 * ======================================================
 * SIGN-UP TESTS (incl. no account enumeration)
 * ======================================================
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

// Capture outgoing email instead of using SMTP (must run before the
// app is loaded, since sendEmail creates its transport per call).
const nodemailer = require('nodemailer');
const sent = [];
nodemailer.createTransport = () => ({
  sendMail: async (mail) => {
    sent.push(mail);
    return { messageId: String(sent.length) };
  },
});

const { startTestApp } = require('./helpers/app');
const User = require('../src/models/user.model');
const Otp = require('../src/models/Otp.model');

let ctx, api;

before(async () => {
  ctx = await startTestApp();
  ({ api } = ctx);
  await User.create({
    name: 'Existing',
    username: 'existing',
    email: 'taken@signup.dev',
    password: 'password123',
    isVerified: true,
  });
});

after(async () => {
  await ctx.stop();
});

const codeFrom = (mail) => (mail.text.match(/\b(\d{6})\b/) || [])[1];

test('new email: OTP is emailed and the account can be created', async () => {
  sent.length = 0;
  const r = await api('POST', '/api/v1/auth/register/request-otp', { body: { email: 'new@signup.dev' } });
  assert.equal(r.status, 200);
  const otp = codeFrom(sent[0]);
  assert.match(otp, /^\d{6}$/);

  const v = await api('POST', '/api/v1/auth/register/verify-otp', {
    body: { email: 'new@signup.dev', otp, password: 'password123', username: 'newbie', fullName: 'New Bie', acceptedTerms: true },
  });
  assert.equal(v.status, 201);
});

test('registered email gets the SAME response, and a notice instead of a code', async () => {
  sent.length = 0;
  const fresh = await api('POST', '/api/v1/auth/register/request-otp', { body: { email: 'another@signup.dev' } });
  const taken = await api('POST', '/api/v1/auth/register/request-otp', { body: { email: 'taken@signup.dev' } });

  assert.equal(taken.status, fresh.status);
  assert.deepEqual(taken.json, fresh.json, 'responses must be indistinguishable');

  const notice = sent.find((m) => m.to === 'taken@signup.dev');
  assert.ok(notice, 'owner is told by email');
  assert.equal(codeFrom(notice), undefined, 'no usable code is sent');
  assert.match(notice.text, /already have one/);
  assert.equal(await Otp.countDocuments({ email: 'taken@signup.dev', purpose: 'register' }), 0);
});

test('verifying with a registered email looks like any wrong code', async () => {
  const body = (email) => ({ email, otp: '123456', password: 'password123', username: 'someone', fullName: 'Some One', acceptedTerms: true });
  const taken = await api('POST', '/api/v1/auth/register/verify-otp', { body: body('taken@signup.dev') });
  const unknown = await api('POST', '/api/v1/auth/register/verify-otp', { body: body('nobody@signup.dev') });
  assert.equal(taken.status, 400);
  assert.deepEqual(taken.json.message, unknown.json.message);
});
