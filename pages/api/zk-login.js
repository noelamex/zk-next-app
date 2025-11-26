// pages/api/zk-login.js

import { UltraHonkBackend, Fr } from "@aztec/bb.js";
import fs from "fs";
import path from "path";

// ---- Load Circuits Once ----

// Password circuit
const passwordCircuitPath = path.join(process.cwd(), "public/noir/password.json");
const passwordCircuit = JSON.parse(fs.readFileSync(passwordCircuitPath, "utf8"));
const passwordBackend = new UltraHonkBackend(passwordCircuit.bytecode, { threads: 1 });

// Age circuit
const ageCircuitPath = path.join(process.cwd(), "public/noir/age18.json");
const ageCircuit = JSON.parse(fs.readFileSync(ageCircuitPath, "utf8"));
const ageBackend = new UltraHonkBackend(ageCircuit.bytecode, { threads: 1 });

// Merkle circuit
const merkleCircuitPath = path.join(process.cwd(), "public/noir/merkle.json");
const merkleCircuit = JSON.parse(fs.readFileSync(merkleCircuitPath, "utf8"));
const merkleBackend = new UltraHonkBackend(merkleCircuit.bytecode, { threads: 1 });

// Trusted Merkle root
const allowlistPath = path.join(process.cwd(), "data/merkle_allowlist.json");
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
const trustedRoot = allowlist.root;

// ---- Helper to rebuild a proof ----
function rebuildProofObj({ proof, publicInputs }) {
  return {
    proof: new Uint8Array(proof),
    publicInputs: publicInputs.map((x) => Fr.fromString(x)),
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  const { passwordProof, merkleProof, ageProof } = req.body || {};

  if (!passwordProof || !merkleProof || !ageProof) {
    return res.status(400).json({ error: "Missing one or more proofs" });
  }

  try {
    // 1. Verify password proof
    const pw = rebuildProofObj(passwordProof);
    const okPassword = await passwordBackend.verifyProof(pw);
    if (!okPassword) {
      return res.status(401).json({ error: "Invalid password proof" });
    }

    // 2. Verify age proof
    const ag = rebuildProofObj(ageProof);
    const okAge = await ageBackend.verifyProof(ag);
    if (!okAge) {
      return res.status(401).json({ error: "Invalid age proof" });
    }

    // 3. Verify Merkle membership proof
    const mk = rebuildProofObj(merkleProof);
    const okMerkle = await merkleBackend.verifyProof(mk);
    if (!okMerkle) {
      return res.status(401).json({ error: "Invalid merkle proof" });
    }

    // Root check
    const proofRoot = mk.publicInputs[0].toString();
    const trustedRootStr = Fr.fromString(trustedRoot).toString();
    if (proofRoot !== trustedRootStr) {
      return res.status(400).json({ error: "Merkle root mismatch" });
    }

    // ---- All proofs valid → "log in" ----
    // Minimal session: set a signed cookie for 10 minutes
    res.setHeader("Set-Cookie", `zk_session=1; Path=/; HttpOnly; Max-Age=600; SameSite=Strict`);

    return res.status(200).json({ loggedIn: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
