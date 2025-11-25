"use client";

import { useState } from "react";
import { proveAgeInBrowser } from "../lib/proveAgeInBrowser";

export default function Home() {
  const [age, setAge] = useState("");
  const [localResult, setLocalResult] = useState(null);
  const [serverResult, setServerResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleProveAndVerify = async () => {
    try {
      setLoading(true);
      setError(null);
      setLocalResult(null);
      setServerResult(null);

      // 1. Prove in browser
      // Ensure your proveAgeInBrowser function returns { proofHex, publicInputsHex }
      const local = await proveAgeInBrowser(age);
      setLocalResult(local);
      console.log("Local Proof and Public Inputs:", local);

      // 2. Send Proof AND Public Inputs to backend
      const res = await fetch("/api/verify-age18", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });

      const server = await res.json();

      if (!res.ok) {
        // Handle specific logic errors (e.g., Proof valid, but under 18)
        throw new Error(server.error || `Verification failed: ${res.status}`);
      }

      setServerResult(server);
    } catch (e) {
      console.error(e);
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", maxWidth: 600, margin: "0 auto" }}>
      <h1>ZK Age Check (18+)</h1>

      <label style={{ display: "block", marginBottom: "1rem" }}>
        Age:{" "}
        <input
          type="number"
          min="0"
          max="255"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
      </label>

      <button onClick={handleProveAndVerify} disabled={loading}>
        {loading ? "Proving and verifying…" : "Prove in browser & verify on server"}
      </button>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>Error: {error}</p>}

      {localResult && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Browser (prover)</h2>
          <p>
            <strong>circuitOutput:</strong>{" "}
            {localResult.circuitOutput ? "true (age ≥ 18)" : "false (age < 18)"}
          </p>
          <details>
            <summary>Proof (raw)</summary>
            <code style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {JSON.stringify(localResult.proof)}
            </code>
          </details>

          <details>
            <summary>Public Inputs</summary>
            <code style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(localResult.publicInputs, null, 2)}
            </code>
          </details>
        </section>
      )}

      {serverResult && (
        <section style={{ marginTop: "1.5rem", border: "1px solid #ccc", padding: "10px" }}>
          <h2>Backend Verification</h2>
          <p>
            <strong>Proof Valid:</strong> {serverResult.isValid ? "✅ Yes" : "❌ No"}
          </p>
          {/* If the server sends back an "authorized" boolean based on public inputs */}
          <p>
            <strong> Over 18 ?:</strong>{" "}
            {serverResult.authorized ? "🎉 YES (Over 18)" : "⛔ NO (Under 18)"}
          </p>
        </section>
      )}
    </main>
  );
}
