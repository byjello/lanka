import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { verifyPrivyToken } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const privyId = await verifyPrivyToken(req);
  if (!privyId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("privy_id", privyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({ privy_id: privyId })
          .select()
          .single();

        if (createError)
          return res.status(500).json({ error: createError.message });
        return res.status(200).json(newUser);
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data);
  }

  if (req.method === "PUT") {
    const updates = req.body;

    delete updates.privy_id;

    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("privy_id", privyId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  return res.status(405).json({ error: "Method not allowed" });
}
