import { UltraHonkBackend, Fr } from "@aztec/bb.js";
import fs from "fs";
import path from "path";

// Load Merkle circuit
const merkleCircuitPath = path.join(process.cwd(), "public", "noir", "merkle.json");
const merkleCircuit = JSON.parse(fs.readFileSync(merkleCircuitPath, "utf8"));

// Load allowlist root (trusted root)
const allowlistPath = path.join(process.cwd(), "data", "merkle_allowlist.json");
const allowlist = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
const trustedRootHex = allowlist.root;

// Single backend instance reused across requests
const backend = new UltraHonkBackend(merkleCircuit.bytecode, { threads: 1 });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end();
  }

  try {
    const { proof, publicInputs } = req.body || {};

    if (!proof || !publicInputs) {
      return res.status(400).json({ error: "Missing proof or public inputs" });
    }

    // proof: number[] -> Uint8Array
    const proofBytes = new Uint8Array(proof);

    // publicInputs: string[] -> Fr[]
    const publicInputsFr = publicInputs.map((s) => Fr.fromString(s));

    const proofForBackend = {
      proof: proofBytes,
      publicInputs: publicInputsFr,
    };

    // 1. Verify zk proof
    const isValidProof = await backend.verifyProof(proofForBackend);
    if (!isValidProof) {
      return res.status(400).json({ error: "Invalid Merkle proof" });
    }

    // 2. Check that the public root in the proof matches our trusted root
    // main(leaf, siblings, indices, root: pub Field) -> root is the only public value,
    // so it should be publicInputsFr[0].
    const proofRootStr = publicInputsFr[0].toString();
    const trustedRootStr = Fr.fromString(trustedRootHex).toString();

    if (proofRootStr !== trustedRootStr) {
      return res.status(400).json({ error: "Root mismatch" });
    }

    // If we reach here: proof is valid AND root matches the allowlist.
    return res.status(200).json({
      isValid: true,
      inAllowlist: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}
