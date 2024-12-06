import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { verifyPrivyToken } from "@/lib/auth";
import { UpdateEventInput } from "@/types/database";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const privyId = await verifyPrivyToken(req);
  if (!privyId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid event ID" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .eq("privy_user_id", privyId)
      .single();

    if (error) return res.status(404).json({ error: "Event not found" });
    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
    const updates: UpdateEventInput = req.body;

    const { data, error } = await supabase
      .from("events")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("privy_user_id", privyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("privy_user_id", privyId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: "Method not allowed" });
}
