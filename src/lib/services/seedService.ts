/**
 * This module previously seeded hard-coded demo users into the database.
 * To avoid shipping hard-coded credentials, seeding has been disabled.
 *
 * If you need initial users (e.g. the first owner account), create them
 * via the `/api/users` endpoint or directly in the Supabase dashboard.
 */
export async function seedDefaultUsers(): Promise<void> {
  // No-op by design.
  return Promise.resolve();
}
