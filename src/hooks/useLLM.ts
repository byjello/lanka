import { TaskId, TASKS } from "@/constants/tasks";
import { usePrivy } from "@privy-io/react-auth";
export function useLLM() {
  const { getAccessToken } = usePrivy();
  const verifyTaskProof = async (
    taskId: TaskId,
    imageUrl: string
  ): Promise<boolean> => {
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/verify-task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          imageUrl,
        }),
      });

      if (!response.ok) throw new Error("Failed to verify task");
      const { isValid } = await response.json();
      return isValid;
    } catch (error) {
      console.error("Error verifying task:", error);
      return false;
    }
  };

  return { verifyTaskProof };
}
