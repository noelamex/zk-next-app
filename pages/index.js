"use client";

import { useState } from "react";
import { proveAgeInBrowser } from "../lib/proveAgeInBrowser";
import { provePasswordInBrowser } from "../lib/provePasswordInBrowser";
import { proveMerkleInBrowser } from "../lib/proveMerkleInBrowser";

export default function Home() {
  const [age, setAge] = useState("");
  const [localResult, setLocalResult] = useState(null);
  const [serverResult, setServerResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [passwordResult, setPasswordResult] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [email, setEmail] = useState("");
  const [merkleResult, setMerkleResult] = useState(null);
  const [merkleLoading, setMerkleLoading] = useState(false);
  const [merkleError, setMerkleError] = useState(null);

  const handleMerkleProve = async () => {
    try {
      setMerkleLoading(true);
      setMerkleError(null);
      setMerkleResult(null);

      const proofPayload = await proveMerkleInBrowser(email);

      const res = await fetch("/api/verify-merkle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proofPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Backend error: ${res.status}`);
      }

      setMerkleResult(data);
    } catch (e) {
      console.error(e);
      setMerkleError(e.message || "Merkle proof failed");
    } finally {
      setMerkleLoading(false);
    }
  };

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
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-center mb-8">Zero-Knowledge Proofs Demo</h1>

      {/* Age Check Section */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mt-0 mb-2">Age Verification (18+)</h2>
        <p className="text-gray-600 mb-4">
          Prove you&apos;re 18 or older without revealing your exact age.
        </p>

        <label className="block mb-2 font-medium">Enter your age:</label>
        <input
          type="number"
          min="0"
          max="255"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter age"
        />

        <button
          onClick={handleProveAndVerify}
          disabled={loading}
          className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {loading ? "Proving and verifying…" : "Prove & Verify"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            <strong>Error:</strong> {error}
            <br />
            <small>Proof generation failed – age must be ≥ 18</small>
          </div>
        )}

        {localResult && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-500 rounded">
            <h3 className="text-lg font-semibold mt-0 mb-2">✓ Browser Proof Generated</h3>
            <details className="mt-2">
              <summary className="cursor-pointer font-medium hover:text-blue-600">
                View Proof (raw)
              </summary>
              <code className="block mt-2 p-2 bg-white rounded text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(localResult.proof)}
              </code>
            </details>

            <details className="mt-2">
              <summary className="cursor-pointer font-medium hover:text-blue-600">
                View Public Inputs
              </summary>
              <code className="block mt-2 p-2 bg-white rounded text-sm whitespace-pre-wrap">
                {JSON.stringify(localResult.publicInputs, null, 2)}
              </code>
            </details>
          </div>
        )}

        {serverResult && (
          <div
            className={`mt-4 p-4 rounded ${
              serverResult.isValid
                ? "bg-green-50 border border-green-500"
                : "bg-red-50 border border-red-500"
            }`}
          >
            <h3 className="text-lg font-semibold mt-0 mb-2">Backend Verification Result</h3>
            <p className="my-2">
              <strong>Proof Valid:</strong> {serverResult.isValid ? "✅ Yes" : "❌ No"}
            </p>
            <p className="my-2">
              <strong>Status:</strong>{" "}
              {serverResult.isValid ? "🎉 Authorized (18+)" : "⛔ Not Authorized"}
            </p>
          </div>
        )}
      </section>

      {/* Password Proof Section */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mt-0 mb-2">Password Proof (Poseidon)</h2>
        <p className="text-gray-600 mb-4">
          Prove you know the correct secret without revealing it.
        </p>

        <label className="block mb-2 font-medium">Secret (integer):</label>
        <input
          type="number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter secret number"
        />

        <button
          onClick={handlePasswordProve}
          disabled={passwordLoading}
          className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {passwordLoading ? "Proving & verifying…" : "Prove Password"}
        </button>

        {passwordError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            <strong>Error:</strong> {passwordError}
          </div>
        )}

        {passwordResult && (
          <div
            className={`mt-4 p-4 rounded ${
              passwordResult.authenticated
                ? "bg-green-50 border border-green-500"
                : "bg-red-50 border border-red-500"
            }`}
          >
            <h3 className="text-lg font-semibold mt-0 mb-2">Verification Result</h3>
            <p className="my-2">
              <strong>Proof Valid:</strong> {passwordResult.isValid ? "✅ Yes" : "❌ No"}
            </p>
            <p className="my-2">
              <strong>Authenticated:</strong>{" "}
              {passwordResult.authenticated ? "🎉 Success" : "❌ Failed"}
            </p>
          </div>
        )}
      </section>

      {/* Merkle Proof Section */}
      <section className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mt-0 mb-2">Allowlist Membership (Merkle Proof)</h2>
        <p className="text-gray-600 mb-4">
          Prove that your email is in the allowlist without revealing anything else.
        </p>

        <label className="block mb-2 font-medium">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="alice@example.com"
        />

        <button
          onClick={handleMerkleProve}
          disabled={merkleLoading}
          className="w-full mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {merkleLoading ? "Proving & verifying…" : "Prove membership"}
        </button>

        {merkleError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            <strong>Error:</strong> {merkleError}
          </div>
        )}

        {merkleResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-500 rounded">
            <h3 className="text-lg font-semibold mt-0 mb-2">Verification Result</h3>
            <p className="my-2">
              <strong>Proof Valid:</strong> {merkleResult.isValid ? "✅ Yes" : "❌ No"}
            </p>
            <p className="my-2">
              <strong>In Allowlist:</strong> {merkleResult.inAllowlist ? "✅ Yes" : "❌ No"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
