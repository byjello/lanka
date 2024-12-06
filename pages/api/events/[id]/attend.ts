import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { verifyPrivyToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const privyId = await verifyPrivyToken(req);
  if (!privyId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  try {
    // Get current attendees
    const { data: event } = await supabase
      .from("events")
      .select("attendees")
      .eq("id", id)
      .single();

    const currentAttendees = event?.attendees || [];
    const isAttending = currentAttendees.includes(privyId);

    // Update attendees array
    const { error } = await supabase
      .from("events")
      .update({
        attendees: isAttending
          ? currentAttendees.filter((id) => id !== privyId) // Remove user
          : [...currentAttendees, privyId], // Add user
      })
      .eq("id", id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return res.status(500).json({ error: "Failed to update attendance" });
  }
}
