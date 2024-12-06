import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VIBES, MAX_VIBES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface UserProfile {
  display_name: string;
  bio: string | null;
  vibes: string[];
}

export default function Profile() {
  const { user } = usePrivy();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    display_name: "",
    bio: "",
    vibes: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("users")
          .select("display_name, bio, vibes")
          .eq("privy_id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            display_name: data.display_name || "",
            bio: data.bio || "",
            vibes: data.vibes || [],
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if display name is valid
      if (!profile.display_name?.match(/^[a-z0-9_]+$/)) {
        throw new Error(
          "Display name can only contain lowercase letters, numbers, and underscores"
        );
      }

      if (!profile.bio?.trim()) {
        throw new Error("Please provide a short bio");
      }

      if (!profile.vibes || profile.vibes.length !== MAX_VIBES) {
        throw new Error(`Please select exactly ${MAX_VIBES} vibes`);
      }

      // Check if display name is taken
      const { data: existingUsers } = await supabase
        .from("users")
        .select("privy_id")
        .eq("display_name", profile.display_name)
        .neq("privy_id", user!.id);

      if (existingUsers && existingUsers.length > 0) {
        throw new Error("This display name is already taken");
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("users")
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
          vibes: profile.vibes,
          updated_at: new Date().toISOString(),
        })
        .eq("privy_id", user!.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVibeSelect = (vibe: string) => {
    setProfile((current) => {
      if (current.vibes.includes(vibe)) {
        return {
          ...current,
          vibes: current.vibes.filter((v) => v !== vibe),
        };
      }
      if (current.vibes.length >= MAX_VIBES) {
        return current;
      }
      return {
        ...current,
        vibes: [...current.vibes, vibe],
      };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your profile information
          </p>
        </div>

        {/* Email Info */}
        <div className="p-4 rounded-lg border space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email</span>
          </div>
          <p>{user?.email?.address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profile.display_name}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    display_name: e.target.value.toLowerCase(),
                  })
                }
                placeholder="e.g., john_doe"
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                placeholder="Tell us about yourself..."
                className="resize-none min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Your Vibes ({profile.vibes?.length || 0}/{MAX_VIBES})
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {VIBES.map(({ emoji }) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant={
                      profile.vibes?.includes(emoji) ? "default" : "outline"
                    }
                    className={cn(
                      "h-12 text-2xl flex items-center justify-center",
                      profile.vibes?.includes(emoji) && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      const newVibes = profile.vibes?.includes(emoji)
                        ? profile.vibes.filter((v) => v !== emoji)
                        : [...(profile.vibes || []), emoji].slice(0, MAX_VIBES);
                      setProfile({ ...profile, vibes: newVibes });
                    }}
                    disabled={
                      (profile.vibes?.length || 0) >= MAX_VIBES &&
                      !profile.vibes?.includes(emoji)
                    }
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
