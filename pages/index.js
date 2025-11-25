"use client";

import { useState } from "react";
import { proveAgeInBrowser } from "../lib/proveAgeInBrowser";
import { provePasswordInBrowser } from "../lib/provePasswordInBrowser";

export default function Home() {
  const [age, setAge] = useState("");
  const [localResult, setLocalResult] = useState(null);
  const [serverResult, setServerResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // for password demo
  const [password, setPassword] = useState("");
  const [passwordResult, setPasswordResult] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const handlePasswordProve = async () => {
    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordResult(null);

      const local = await provePasswordInBrowser(password);
      console.log("Local Password Proof and Public Inputs:", local);

      const res = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Backend error: ${res.status}`);
      }

      const data = await res.json();
      setPasswordResult(data);
    } catch (e) {
      console.error(e);
      setPasswordError(e.message || "Password proof failed");
    } finally {
      setPasswordLoading(false);
    }
  };

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

      {error && (
        <p style={{ color: "red", marginTop: "1rem" }}>
          Error: {error}
          <br />
          Proof generation failed – does not satisfy age ≥ 18
        </p>
      )}

      {localResult && (
        <section style={{ marginTop: "1.5rem" }}>
          <h2>Browser (prover)</h2>
          <p>
            <strong>Proof:</strong> generated successfully in browser
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
          <p>
            <strong>Authorized:</strong>{" "}
            {serverResult.isValid ? "🎉 YES (Over 18)" : "⛔ NO (Under 18)"}
          </p>
        </section>
      )}
      <section style={{ marginTop: "2rem" }}>
        <h2>Password Proof (Poseidon)</h2>
        <p>Prove you know the correct secret without revealing it.</p>

        <label>
          Secret (integer):{" "}
          <input type="number" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>

        <div style={{ marginTop: "0.5rem" }}>
          <button onClick={handlePasswordProve} disabled={passwordLoading}>
            {passwordLoading ? "Proving & verifying…" : "Prove password"}
          </button>
        </div>

        {passwordError && <p style={{ color: "red", marginTop: "0.5rem" }}>{passwordError}</p>}

        {passwordResult && (
          <div style={{ marginTop: "0.5rem" }}>
            <p>Proof Logic Valid: {passwordResult.isValid ? "✅ Yes" : "❌ No"}</p>
            <p>Authenticated: {passwordResult.authenticated ? "🎉 YES" : "❌ NO"}</p>
          </div>
        )}
      </section>
    </main>
  );
}
