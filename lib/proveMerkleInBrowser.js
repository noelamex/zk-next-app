// lib/proveMerkleInBrowser.js

export async function proveMerkleInBrowser(email) {
  if (!email) {
    throw new Error("Email is required");
  }

  // 1. Ask the backend for *only this user's* Merkle path + root
  const pathRes = await fetch(`/api/merkle-path?email=${encodeURIComponent(email)}`);
  if (!pathRes.ok) {
    const data = await pathRes.json().catch(() => ({}));
    throw new Error(data.error || "Failed to load Merkle path");
  }
  const { leaf, siblings, indices, root } = await pathRes.json();

  // 2. Load Noir circuit + backend
  const [{ Noir }, { UltraHonkBackend }] = await Promise.all([
    import("@noir-lang/noir_js"),
    import("@aztec/bb.js"),
  ]);

  const merkleCircuitRes = await fetch("/noir/merkle.json");
  if (!merkleCircuitRes.ok) throw new Error("Failed to load Merkle circuit JSON");
  const merkleCircuit = await merkleCircuitRes.json();

  const noir = new Noir(merkleCircuit);
  const backend = new UltraHonkBackend(merkleCircuit.bytecode);

  let witness;
  try {
    const { witness: w } = await noir.execute({
      leaf,
      siblings,
      indices,
      root,
    });
    witness = w;
  } catch (e) {
    console.error("Merkle witness generation error:", e);
    throw new Error("Merkle path does not satisfy the circuit");
  }

  // 4. Generate proof
  const { proof, publicInputs } = await backend.generateProof(witness);

  // 5. Make it JSON-safe for POST
  return {
    proof: Array.from(proof), // number[]
    publicInputs: publicInputs.map((i) => i.toString()), // string[]
  };
}
