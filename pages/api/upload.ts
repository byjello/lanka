import { NextApiRequest, NextApiResponse } from "next";
import { verifyPrivyToken } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const privyId = await verifyPrivyToken(req);
    if (!privyId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = "/tmp";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    return new Promise((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Form parse error:", err);
          res.status(500).json({ error: "Failed to parse form" });
          return resolve(undefined);
        }

        try {
          const file = files.file?.[0];
          if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return resolve(undefined);
          }

          const buffer = fs.readFileSync(file.filepath);
          //truncate filename to 100 characters
          const fileName = `task-proofs/${privyId}/${Date.now()}-${file.originalFilename.slice(
            0,
            1
          )}`;

          const { data, error } = await supabase.storage
            .from("uploads")
            .upload(fileName, buffer, {
              contentType: file.mimetype || "image/jpeg",
              upsert: false,
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from("uploads")
            .getPublicUrl(fileName);

          // Clean up the temporary file
          fs.unlinkSync(file.filepath);

          res.status(200).json({ url: urlData.publicUrl });
          return resolve(undefined);
        } catch (error) {
          console.error("Upload error:", error);
          res.status(500).json({ error: "Failed to upload file" });
          return resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ error: "Failed to handle request" });
  }
}
