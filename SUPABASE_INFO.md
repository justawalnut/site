# Supabase Project Information

## Project Details
- **Project Name**: trading-dashboard
- **Project ID**: atnqhsjuqjuuthngxwfs
- **Region**: ap-south-1 (Mumbai, India)
- **Status**: ACTIVE_HEALTHY
- **PostgreSQL Version**: 17.6.1

## Connection Information
- **Database Host**: db.atnqhsjuqjuuthngxwfs.supabase.co
- **Database Name**: postgres
- **Database User**: postgres
- **Direct Connection Port**: 5432
- **Connection Pooler Port**: 6543 (Recommended for serverless)

## URLs
- **Project Dashboard**: https://supabase.com/dashboard/project/atnqhsjuqjuuthngxwfs
- **API URL**: https://atnqhsjuqjuuthngxwfs.supabase.co
- **Database Settings**: https://supabase.com/dashboard/project/atnqhsjuqjuuthngxwfs/settings/database

## API Keys
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bnFoc2p1cWp1dXRobmd4d2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjI1OTMsImV4cCI6MjA3NzYzODU5M30.pWcGm8T5gtmoFdzyJems5p0_18UO0R2-qXMA1FYoOl8`

## Database Schema Status
✅ All migrations applied successfully:
1. `20241120120000_init_postgres` - Initial database schema
2. `20241120143000_add_note_attachment_path` - Added attachment path to notes

## Tables Created
- users
- accounts (NextAuth)
- sessions (NextAuth)
- verification_tokens (NextAuth)
- strategies
- projects
- trades
- daily_pnl
- notes
- decisions
- audit_log

## Next Steps
1. Get your database password from the Supabase dashboard
2. Use the password to complete the DATABASE_URL in Vercel
3. Deploy to Vercel using the DEPLOYMENT_GUIDE.md

## Important Notes
- Cost: $0/month (Free tier)
- Use DATABASE_POOL_URL (port 6543) for Vercel deployment to avoid connection limits
- Database password is not stored - retrieve it from Supabase dashboard
