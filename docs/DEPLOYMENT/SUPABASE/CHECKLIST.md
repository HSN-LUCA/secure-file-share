# Supabase Setup Checklist

## Account & Project Setup
- [ ] Created Supabase account at https://supabase.com
- [ ] Created new project named `secure-file-share`
- [ ] Saved database password securely
- [ ] Selected appropriate region
- [ ] Project provisioning completed (green checkmark)

## Credentials & Connection
- [ ] Copied connection string from Supabase dashboard
- [ ] Extracted and verified all credentials:
  - [ ] Host: `aws-0-[region].pooler.supabase.com`
  - [ ] Port: `6543` (pooler) or `5432` (direct)
  - [ ] Database: `postgres`
  - [ ] User: `postgres.[project-id]`
  - [ ] Password: Saved securely

## Database Setup
- [ ] Set DATABASE_URL environment variable
- [ ] Ran migrations: `npm run db:migrate`
- [ ] Verified all tables created in SQL Editor
- [ ] Tested connection: `npm run db:test`

## Environment Configuration
- [ ] Updated `.env.local` with DATABASE_URL
- [ ] Added DATABASE_URL_DIRECT (optional)
- [ ] Verified no syntax errors in .env.local
- [ ] Tested connection works

## Security
- [ ] Database password is 12+ characters with mixed case/numbers/symbols
- [ ] Password saved in secure location (password manager)
- [ ] IP whitelist configured (optional but recommended)
- [ ] Automated backups enabled
- [ ] No credentials committed to Git

## Verification
- [ ] Sample query executed successfully
- [ ] No errors in Supabase logs
- [ ] All 12+ tables present in database
- [ ] Connection pool working correctly

## Ready for Next Step
- [ ] All items above checked
- [ ] Ready to deploy to Vercel

---

**Credentials Saved Location:**
- Database Password: ___________________
- Connection String: ___________________
- Project ID: ___________________
- Region: ___________________

**Date Completed:** ___________________
