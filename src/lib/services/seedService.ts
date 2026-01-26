import { supabaseService } from "./supabaseService";
import { DEFAULT_USERS } from "@/lib/constants/config";

/**
 * Seeds default users into Supabase if they don't already exist.
 * This is called on app initialization.
 */
export async function seedDefaultUsers(): Promise<void> {
  try {
    for (const user of DEFAULT_USERS) {
      const exists = await supabaseService.userExists(user.email);
      if (!exists) {
        try {
          await supabaseService.createUser({
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
          });
          console.log(`Seeded default user: ${user.email}`);
        } catch (createError: any) {
          // Ignore duplicate key errors (user might have been created between check and insert)
          if (createError?.message?.includes("duplicate key") || createError?.code === "23505") {
            console.log(`User ${user.email} already exists, skipping`);
          } else {
            console.error(`Error creating user ${user.email}:`, createError);
          }
        }
      } else {
        console.log(`User ${user.email} already exists, skipping`);
      }
    }
  } catch (error) {
    console.error("Error seeding default users:", error);
    // Don't throw - allow app to continue even if seeding fails
  }
}
