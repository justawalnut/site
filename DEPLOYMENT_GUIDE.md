# Trading Dashboard - Deployment Guide

## ✅ Completed Steps

### 1. Supabase Database Setup
- **Project Created**: `trading-dashboard`
- **Project ID**: `atnqhsjuqjuuthngxwfs`
- **Region**: ap-south-1 (Mumbai, India)
- **Status**: ACTIVE_HEALTHY
- **Database Host**: `db.atnqhsjuqjuuthngxwfs.supabase.co`
- **Database Version**: PostgreSQL 17.6.1
- **Migrations Applied**: ✅ Both migrations successfully applied
  - `20241120120000_init_postgres` - Initial schema
  - `20241120143000_add_note_attachment_path` - Added attachment path column

### 2. Supabase Connection Details
- **Project URL**: https://atnqhsjuqjuuthngxwfs.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0bnFoc2p1cWp1dXRobmd4d2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNjI1OTMsImV4cCI6MjA3NzYzODU5M30.pWcGm8T5gtmoFdzyJems5p0_18UO0R2-qXMA1FYoOl8`

**⚠️ IMPORTANT**: You need to get your database password from the Supabase dashboard.

To get your database password:
1. Go to https://supabase.com/dashboard/project/atnqhsjuqjuuthngxwfs
2. Navigate to Project Settings > Database
3. Find your database password (you may need to reset it if you didn't save it during project creation)

### 3. GitHub Repository
- **Repository**: https://github.com/justawalnut/site.git
- **Status**: Up to date, all changes pushed ✅

---

## 🚀 Next Steps: Vercel Deployment

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/new
2. Select "Import Git Repository"
3. Choose your GitHub repository: `justawalnut/site`
4. Vercel will auto-detect it as a Next.js project

### Step 2: Configure Environment Variables

Before deploying, add these environment variables in Vercel:

#### Required Environment Variables:

```env
# Database (Replace [YOUR_DB_PASSWORD] with your actual Supabase database password)
DATABASE_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.atnqhsjuqjuuthngxwfs.supabase.co:5432/postgres
DATABASE_POOL_URL=postgresql://postgres:[YOUR_DB_PASSWORD]@db.atnqhsjuqjuuthngxwfs.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1

# NextAuth (will be updated after deployment)
NEXTAUTH_URL=https://your-deployment-url.vercel.app
NEXTAUTH_SECRET=[GENERATED_SECRET_BELOW]

# Ingestion API
INGEST_TOKEN=prod-secure-token-please-change-this

# Timezone
TZ=Asia/Kolkata

# Prisma
PRISMA_TELEMETRY=0
```

**Important Notes:**
- `DATABASE_URL`: Uses port 5432 (direct connection)
- `DATABASE_POOL_URL`: Uses port 6543 (connection pooler with PgBouncer) - recommended for serverless
- `NEXTAUTH_SECRET`: See generated secret below
- `INGEST_TOKEN`: Change this to a secure token for production

### Step 3: Deploy

1. Click "Deploy" in Vercel
2. Wait for the deployment to complete
3. Once deployed, **update the NEXTAUTH_URL** environment variable with your actual deployment URL
4. Trigger a redeployment after updating NEXTAUTH_URL

---

## 🔐 Generated Secrets

Your secure NextAuth secret has been generated. Use this for the `NEXTAUTH_SECRET` environment variable:

```
NEXTAUTH_SECRET=5A/w4dfpFk+LtheEwj+s4qnItGUlwqgN73kq09yebHg=
```

---

## 📝 Post-Deployment Checklist

After deployment:

1. ✅ Update `NEXTAUTH_URL` with your actual Vercel deployment URL
2. ✅ Test the application at your Vercel URL
3. ✅ Verify database connection is working
4. ✅ Test authentication flow
5. ✅ (Optional) Set up custom domain in Vercel
6. ✅ (Optional) Configure GitHub OAuth if needed

---

## 🗄️ Database Schema

Your Supabase database has been set up with the following tables:
- `users` - User accounts
- `accounts` - NextAuth account linking
- `sessions` - NextAuth sessions
- `verification_tokens` - NextAuth verification
- `strategies` - Trading strategies
- `projects` - Strategy projects with readiness scores
- `trades` - Trade execution records
- `daily_pnl` - Daily P&L aggregations
- `notes` - Notes and observations
- `decisions` - Strategy decisions
- `audit_log` - Audit trail

---

## 🔗 Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/atnqhsjuqjuuthngxwfs
- **GitHub Repository**: https://github.com/justawalnut/site
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Import**: https://vercel.com/new

---

## 💡 Tips

1. **Connection Pooling**: For production, always use `DATABASE_POOL_URL` in your application to avoid connection limits
2. **Environment Variables**: Vercel automatically encrypts all environment variables
3. **Redeployment**: Any push to your GitHub main/master branch will trigger an automatic deployment
4. **Preview Deployments**: Vercel creates preview deployments for all pull requests
5. **Logs**: Check Vercel dashboard for build and runtime logs if you encounter issues

---

## 🐛 Troubleshooting

### If deployment fails:
1. Check Vercel build logs for errors
2. Verify all environment variables are set correctly
3. Ensure database connection string is correct
4. Check that Prisma is generating the client during build

### If database connection fails:
1. Verify the database password is correct
2. Check that the Supabase project is in ACTIVE_HEALTHY state
3. Ensure you're using the pooler URL (port 6543) for serverless
4. Check Supabase logs for connection errors

### If authentication fails:
1. Verify NEXTAUTH_URL matches your deployment URL
2. Ensure NEXTAUTH_SECRET is set and is at least 32 characters
3. Check that the database tables were created correctly

---

## 📞 Support

If you encounter any issues:
- **Supabase Support**: https://supabase.com/docs
- **Vercel Support**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

*Generated on: 2025-11-03*
*Database Region: ap-south-1 (Mumbai)*
*Next.js Version: 15.0.3*
