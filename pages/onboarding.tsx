import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const { user } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("display_name")
        .eq("privy_id", user.id)
        .single();

      if (userData?.display_name) {
        // User already onboarded
        router.push("/modern");
      } else {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!user?.id) {
        throw new Error("Authentication error. Please try logging in again.");
      }

      // Check if display name is valid
      if (!displayName.match(/^[a-z0-9_]+$/)) {
        throw new Error(
          "Display name can only contain lowercase letters, numbers, and underscores"
        );
      }

      // Check if display name is taken
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("display_name")
        .eq("display_name", displayName);

      if (checkError) {
        throw new Error("Error checking display name availability");
      }

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("This display name is already taken");
      }

      // Update user profile
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          bio: bio,
          updated_at: new Date().toISOString(),
        })
        .eq("privy_id", user.id)
        .select("*");

      if (updateError || !updateData || updateData.length === 0) {
        throw new Error("Failed to update profile. Please try again.");
      }

      // Success! Redirect to main app
      router.push("/modern");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Welcome to Jelloverse!</h1>
          <p className="text-muted-foreground mt-2">
            Let's set up your profile before we begin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value.toLowerCase())}
              placeholder="e.g., john_doe"
              className="h-9"
              required
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              className="resize-none"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Complete Setup"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
