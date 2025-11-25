import fs from "fs";
import path from "path";

const allowlistPath = path.join(process.cwd(), "data", "merkle_allowlist.json");
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));

export default function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  const userData = allowlist.users[email];
  if (!userData) {
    return res.status(404).json({ error: "Email not in allowlist" });
  }

  // Include root so the client can pass it into Noir as the public input
  return res.status(200).json({
    leaf: userData.leaf,
    siblings: userData.siblings,
    indices: userData.indices,
    root: allowlist.root,
  });
}
