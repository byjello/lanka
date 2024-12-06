import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/router";

export function AuthHandler() {
  const { user } = usePrivy();
  const { login } = useLogin();
  const router = useRouter();

  useEffect(() => {
    const syncUser = async () => {
      if (!user) return;

      try {
        // Check if user exists
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("privy_id", user.id)
          .single();

        if (fetchError && fetchError.code === "PGRST116") {
          // User doesn't exist, create them
          const { error: createError } = await supabase.from("users").insert({
            privy_id: user.id,
            username: user.email?.address || undefined,
          });

          if (createError) {
            console.error("Error creating user:", createError);
          } else {
            // Redirect new user to onboarding
            router.push("/onboarding");
          }
        } else if (
          !existingUser?.display_name &&
          router.pathname !== "/onboarding"
        ) {
          // Existing user without display_name should complete onboarding
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error syncing user:", error);
      }
    };

    syncUser();
  }, [user, router]);

  return null;
}
