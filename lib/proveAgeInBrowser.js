// --- Prover: browser-only, no verification here ---
export async function proveAgeInBrowser(age) {
  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 255) {
    throw new Error("Age must be an integer between 0 and 255");
  }

  // 3. Dynamic import ensures bb.js loads AFTER we set the polyfill above
  const [{ Noir }, { UltraHonkBackend }] = await Promise.all([
    import("@noir-lang/noir_js"),
    import("@aztec/bb.js"),
  ]);

  const res = await fetch("/noir/age18.json");
  if (!res.ok) throw new Error("Failed to load circuit JSON");
  const circuit = await res.json();

  const noir = new Noir(circuit);
  const backend = new UltraHonkBackend(circuit.bytecode);

  const { witness, returnValue } = await noir.execute({ age: parsedAge });

  const { proof, publicInputs } = await backend.generateProof(witness);

  const payload = {
    proof: Array.from(proof), // number []
    publicInputs: publicInputs.map((i) => i.toString()), // string []
    circuitOutput: !!returnValue, // boolean
  };

  return payload;
}
