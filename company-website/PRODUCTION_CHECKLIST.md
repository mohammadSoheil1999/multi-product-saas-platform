# Production checklist

- [ ] Production PostgreSQL configured and migrations reviewed
- [ ] Automated daily, off-server backups and retention configured
- [ ] Restore drill completed and documented
- [ ] HTTPS, canonical domain, HSTS, CSP and proxy headers verified
- [ ] Strong `AUTH_SECRET` generated and rotated through a secret manager
- [ ] Production payment adapter configured; mock payment refused/disabled
- [ ] Payment webhook signature and duplicate-event handling tested
- [ ] Transactional email domain/provider configured
- [ ] Private S3-compatible object storage, scanning and retention configured
- [ ] Redis-backed distributed rate limiting and CAPTCHA provider configured
- [ ] Error monitoring and structured log collection configured
- [ ] First administrator secured with MFA/provider controls
- [ ] Development accounts and sample content removed
- [ ] Demo apps isolated, resettable, and free of sensitive information
- [ ] Privacy policy and terms reviewed by qualified counsel
- [ ] Cancellation, renewal, refund, and failed-payment flows tested
- [ ] Arabic and Hebrew RTL tested by native readers
- [ ] Keyboard, screen-reader, mobile, tablet and ultra-wide testing complete
- [ ] Database restore and disaster-recovery procedure tested

Never treat a backup as operational until a clean restore has succeeded.
