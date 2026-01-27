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

### 2. Run Database Migration

1. In your Supabase project dashboard, go to "SQL Editor"
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor in Supabase
5. Click "Run" to execute the migration

This will create:
- `users` table for authentication
- `bookings` table for booking data
- Necessary indexes and triggers

### 3. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to "Settings" → "API"
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys" → "anon public")

### 4. Configure Environment Variables

1. Open `.env.local` in the project root
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key
```

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
- For production, also consider:
  - Using Supabase Auth instead of custom authentication
  - Implementing Row Level Security (RLS) policies

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure `.env.local` has the correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after updating `.env.local`

### "Failed to fetch bookings/users" errors
- Verify your Supabase project is active
- Check that the migration was run successfully
- Verify your API keys are correct

### Default users not appearing
- Check the browser console for seeding errors
- Manually insert users via Supabase dashboard if needed
