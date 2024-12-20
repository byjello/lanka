import { supabase } from "./supabase";
import { TASKS } from "@/constants/tasks";

export async function awardPoints(
  privyId: string,
  taskId: keyof typeof TASKS,
  shouldCheckIfCompleted = true
) {
  try {
    // Get current user data
    console.log("Awarding points for task:", taskId);
    const { data: user } = await supabase
      .from("users")
      .select("num_points, completed_tasks")
      .eq("privy_id", privyId)
      .single();

    if (!user) throw new Error("User not found");

    // Check if task is already completed (skip check for repeatable tasks)
    const task = TASKS[taskId];
    if (
      shouldCheckIfCompleted &&
      !task.repeatable &&
      user.completed_tasks?.includes(taskId)
    ) {
      return; // Task already completed and is not repeatable
    }

    const newPoints = (user.num_points || 0) + task.points;
    // Add to completed_tasks array - allow duplicates for repeatable tasks
    const newCompletedTasks = [...(user.completed_tasks || []), taskId];

    // Update user with new points and completed task
    const { error } = await supabase
      .from("users")
      .update({
        num_points: newPoints,
        completed_tasks: newCompletedTasks,
      })
      .eq("privy_id", privyId);

    if (error) throw error;
    console.log("Awarded points for task:", taskId);

    return { points: task.points, totalPoints: newPoints };
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
}

export async function deductPoints(
  privyId: string,
  taskId: keyof typeof TASKS
) {
  try {
    // Get current user data
    console.log("Deducting points for task:", taskId);
    const { data: user } = await supabase
      .from("users")
      .select("num_points, completed_tasks")
      .eq("privy_id", privyId)
      .single();

    if (!user) throw new Error("User not found");

    const task = TASKS[taskId];
    const newPoints = Math.max(0, (user.num_points || 0) - task.points); // Prevent negative points

    // Remove only the most recent instance of this task ID
    let newCompletedTasks = [...(user.completed_tasks || [])];
    if (!task.repeatable) {
      // For non-repeatable tasks, remove all instances
      newCompletedTasks = newCompletedTasks.filter((t) => t !== taskId);
    } else {
      // For repeatable tasks, remove only the last instance
      const lastIndex = newCompletedTasks.lastIndexOf(taskId);
      if (lastIndex !== -1) {
        newCompletedTasks.splice(lastIndex, 1);
      }
    }

    // Update user with new points and modified completed tasks
    const { error } = await supabase
      .from("users")
      .update({
        num_points: newPoints,
        completed_tasks: newCompletedTasks,
      })
      .eq("privy_id", privyId);

    if (error) throw error;
    console.log("Deducted points for task:", taskId);

    return { points: -task.points, totalPoints: newPoints };
  } catch (error) {
    console.error("Error deducting points:", error);
    throw error;
  }
}
