# Supabase Setup Guide

This project uses Supabase as the database backend instead of browser localStorage.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in your project details (name, database password, region)
4. Wait for the project to be created

### 2. Run Database Migrations

1. In your Supabase project dashboard, go to "SQL Editor"
2. Run each migration file in order: `supabase/migrations/001_initial_schema.sql` through `011_enable_rls_and_fix_guest_stats.sql`. For each file: copy the entire SQL content, paste into the SQL Editor, and click "Run".

This will create:
- `users` table for authentication
- `bookings` table for booking data
- Other tables and indexes (blocked_rooms, audit_logs, password_resets, etc.)
- Row Level Security enabled on all public tables (migration 011)

### 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")
   - **service_role key** (under "Project API keys" → "service_role" — keep this secret; never commit it or expose it to the client)

### 4. Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key
```

**Important:** `SUPABASE_SERVICE_ROLE_KEY` must be set for the app to work. It is used only by API routes (server-side) to access the database and bypasses Row Level Security. Never add `NEXT_PUBLIC_` to this variable and never expose it to the client or commit it to version control.

### 5. Create Initial Users

For security, the app no longer ships with hard-coded default credentials.
Create your own owner and receptionist accounts either:
- Via the Supabase dashboard (`users` table), or
- By calling the `/api/users` endpoint with secure passwords.

### 6. Test the Setup

1. Start the development server: `npm run dev`
2. Try logging in with the default credentials
3. Create a test booking to verify data is being saved to Supabase

## Verifying Data in Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Table Editor"
3. You should see:
   - `users` table with the users you created
   - `bookings` table (empty initially, will populate as bookings are created)

## Security Notes

- Passwords are stored as bcrypt hashes via the API – never as plain text.
- **Row Level Security (RLS)** is enabled on all public tables (`users`, `bookings`, `blocked_rooms`, `audit_logs`, `password_resets`). No policies are granted to the anon role, so direct PostgREST access with the anon key cannot read or write any rows. All database access from the app goes through Next.js API routes, which use the service role key and therefore bypass RLS. This keeps sensitive data (e.g. passwords, account numbers) off the public API.
- The **service_role** key must only be used server-side (e.g. in API routes). Never expose it to the client or commit it to version control.

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API → service_role)
- Restart your development server after updating `.env.local`

### "Failed to fetch bookings/users" errors
- Verify your Supabase project is active
- Check that the migration was run successfully
- Verify your API keys are correct

### Default users not appearing
- Check the browser console for seeding errors
- Manually insert users via Supabase dashboard if needed
