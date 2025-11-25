// Poseidon hash of secret = 1234, computed with bn254::hash_1([1234])
const STORED_HASH = "0x027ad43cf6415556989fa626bbea0ad4856e5702e493bd6e2e28af8741fce31d";

export async function provePasswordInBrowser(secretInput) {
  const secret = Number(secretInput);

  if (!Number.isInteger(secret) || secret < 0) {
    throw new Error("Secret must be a non-negative integer");
  }

  const [{ Noir }, { UltraHonkBackend }] = await Promise.all([
    import("@noir-lang/noir_js"),
    import("@aztec/bb.js"),
  ]);

  const res = await fetch("/noir/password.json");

  if (!res.ok) throw new Error("Failed to load password circuit JSON");
  const circuit = await res.json();

  const noir = new Noir(circuit);
  const backend = new UltraHonkBackend(circuit.bytecode);

  let witness;
  try {
    // secret = private input, hashed = public input
    witness = (
      await noir.execute({
        secret,
        hashed: STORED_HASH,
      })
    ).witness;
  } catch (e) {
    throw new Error("Password does not satisfy the circuit (likely incorrect)");
  }

  const { proof, publicInputs } = await backend.generateProof(witness);

  return {
    proof: Array.from(proof), // number[]
    publicInputs: publicInputs.map((i) => i.toString()), // string[]
  };
}
