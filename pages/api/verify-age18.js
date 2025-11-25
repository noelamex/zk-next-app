import { UltraHonkBackend, Fr } from "@aztec/bb.js";
import fs from "fs";
import path from "path";

const circuitPath = path.join(process.cwd(), "public/noir/age18.json");
const circuit = JSON.parse(fs.readFileSync(circuitPath, "utf8"));

const backend = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

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

    const isValidProof = await backend.verifyProof(proofForBackend);

    if (!isValidProof) {
      return res.status(400).json({ error: "Invalid Proof" });
    }

    return res.status(200).json({
      isValid: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}
