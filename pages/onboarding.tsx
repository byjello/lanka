import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { VIBES, MAX_VIBES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const { user } = usePrivy();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);

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
        router.push("/");
      } else {
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, router]);

  const handleVibeSelect = (vibe: string) => {
    setSelectedVibes((current) => {
      if (current.includes(vibe)) {
        return current.filter((v) => v !== vibe);
      }
      if (current.length >= MAX_VIBES) {
        return current;
      }
      return [...current, vibe];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (!bio?.trim()) {
        throw new Error("Please provide a short bio");
      }

      if (selectedVibes.length !== MAX_VIBES) {
        throw new Error(`Please select exactly ${MAX_VIBES} vibes`);
      }

      // Check if display name is taken
      const { data: existingUsers } = await supabase
        .from("users")
        .select("display_name")
        .eq("display_name", displayName);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("This display name is already taken");
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({
          display_name: displayName,
          bio: bio,
          vibes: selectedVibes,
        })
        .eq("privy_id", user.id);

      if (updateError) throw updateError;

      // Redirect to main app
      router.push("/");
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
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

          <div className="space-y-2">
            <Label>
              Your Vibes ({selectedVibes.length}/{MAX_VIBES})
            </Label>
            <p className="text-xs text-muted-foreground">
              Pick {MAX_VIBES} vibes that represent you
            </p>
            <div className="grid grid-cols-4 gap-2">
              {VIBES.map(({ emoji }) => (
                <Button
                  key={emoji}
                  type="button"
                  variant={
                    selectedVibes.includes(emoji) ? "default" : "outline"
                  }
                  className={cn(
                    "h-12 text-2xl flex items-center justify-center",
                    selectedVibes.includes(emoji) && "ring-2 ring-primary"
                  )}
                  onClick={() => handleVibeSelect(emoji)}
                  disabled={
                    selectedVibes.length >= MAX_VIBES &&
                    !selectedVibes.includes(emoji)
                  }
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </div>

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
