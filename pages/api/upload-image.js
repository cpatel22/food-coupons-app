import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { fileName, dataUrl } = req.body || {};

    if (!fileName || !dataUrl) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const matches = dataUrl.match(/^data:(image\/.*?);base64,(.*)$/);
    if (!matches) {
      return res.status(400).json({ error: "Invalid image payload" });
    }

    const ext = path.extname(fileName) || ".png";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "images");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, safeName);
    const base64Data = matches[2];
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

    return res.status(200).json({
      url: `/images/${safeName}`,
      name: safeName,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: error.message || "Image upload failed" });
  }
}
