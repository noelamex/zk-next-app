// pages/api/protected.js

export default function handler(req, res) {
  // Read cookies from the request
  const cookies = req.headers.cookie || "";

  // Simple cookie parse
  const hasSession = cookies.includes("zk_session=1");

  if (!hasSession) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // If session exists, return protected content
  return res.status(200).json({
    secret: "This is protected content only visible after zk-login.",
    timestamp: Date.now(),
  });
}
