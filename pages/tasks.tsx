import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TASKS } from "@/constants/tasks";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { awardPoints } from "@/lib/points";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLLM } from "@/hooks/useLLM";
import { Loader2, Upload } from "lucide-react";
import { TaskId } from "@/constants/tasks";
import { useToast } from "@/hooks/use-toast";

interface UserStats {
  num_points: number;
  completed_tasks: string[];
}

export default function Tasks() {
  const { login, authenticated, user, getAccessToken } = usePrivy();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskId | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { verifyTaskProof } = useLLM();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("users")
        .select("num_points, completed_tasks")
        .eq("privy_id", user.id)
        .single();

      if (data) {
        setUserStats(data);
      }
      setIsLoading(false);
    };

    fetchUserStats();
  }, [user]);

  const handleTaskCheck = async (taskId: TaskId) => {
    if (!user || !userStats) return;

    const task = TASKS[taskId];
    if (!task.require_proof) return;

    const isCompleted = userStats.completed_tasks?.includes(taskId);
    if (isCompleted) return;

    setSelectedTask(taskId);
    setProofDialogOpen(true);
  };

  const handleProofSubmit = async () => {
    if (!selectedImage || !selectedTask) return;

    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      formData.append("taskId", selectedTask);

      const token = await getAccessToken();
      const response = await fetch("/api/verify-task", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to verify task");
      const { isValid } = await response.json();

      if (isValid) {
        const result = await awardPoints(user.id, selectedTask);
        if (result) {
          setUserStats((prev) => ({
            ...prev!,
            num_points: result.totalPoints,
            completed_tasks: [...(prev?.completed_tasks || []), selectedTask],
          }));
        }
        setProofDialogOpen(false);
        toast({
          title: "Success!",
          description: "Task completed successfully!",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Told you you'd get caught",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error verifying proof:", error);
      toast({
        title: "Error",
        description: "Failed to verify proof",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
      setSelectedImage(null);
    }
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
        <h1 className="text-2xl font-semibold mb-3">Stop lurking! 👀</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Sign up to start earning ⭐ and completing tasks
        </p>
        <Button onClick={login} size="lg">
          Sign up
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="grid gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="text-muted-foreground">
          Tasks are a way to explore the local culture. Complete tasks to earn
          ⭐ and unlock surprises 🤭
        </p>
      </div>

      <div className="border-b mb-8" />

      {/* Points Display */}
      <div className="mb-8 p-6 rounded-lg border bg-card">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">Your ⭐</h2>
          <p className="text-4xl font-bold">{userStats?.num_points || 0}</p>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Tasks</h2>
        <div className="grid gap-4">
          {Object.values(TASKS).map((task) => {
            const isCompleted = userStats?.completed_tasks?.includes(task.id);
            const isClickable = task.require_proof && !isCompleted;
            return (
              <div
                key={task.id}
                onClick={() => isClickable && handleTaskCheck(task.id)}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  isCompleted
                    ? "bg-primary/5 border-primary/20 cursor-default"
                    : isClickable
                    ? "cursor-pointer hover:bg-accent/50"
                    : "cursor-default"
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "h-6 w-6 rounded border flex items-center justify-center transition-colors",
                      isCompleted ? "bg-primary border-primary" : "border-input"
                    )}
                  >
                    {isCompleted && (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <h3
                        className={cn(
                          "font-medium",
                          isCompleted && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </h3>
                      <p
                        className={cn(
                          "text-sm text-muted-foreground",
                          isCompleted && "line-through"
                        )}
                      >
                        {task.description}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {task.points} ⭐
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-lg p-4 md:p-6">
          <DialogHeader>
            <DialogTitle className="text-l md:text-xl">
              Thought you're just gonna get away with it?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground text-center">
              Upload photo proof 😈
            </p>
            <div className="flex flex-col items-center gap-3 w-full">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold hover:file:bg-accent"
              />
            </div>
            <Button
              onClick={handleProofSubmit}
              disabled={!selectedImage || isVerifying}
              className="w-full h-12 text-base"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Upload className="mr-3 h-5 w-5" />
                  Submit Proof
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
