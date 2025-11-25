// Node script: build a Poseidon-based Merkle tree for your email allowlist.

const fs = require("fs");
const path = require("path");
const circomlib = require("circomlibjs");

const ALLOWLIST = ["alice@example.com", "bob@example.com", "charlie@example.com"];

async function main() {
  const poseidon = await circomlib.buildPoseidon();

  // Helper: string -> Field using Poseidon of a single BigInt derived from UTF-8 bytes
  function emailToLeaf(email) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(email);

    let x = 0n;
    for (const b of bytes) {
      x = (x << 8n) + BigInt(b);
    }

    // Poseidon over a single field input
    const leaf = poseidon([x]);
    const F = poseidon.F;
    return "0x" + F.toString(leaf, 16);
  }

  const poseidonF = poseidon.F;

  // 1. Compute leaves
  const leaves = ALLOWLIST.map((email) => emailToLeaf(email));

  // For a small demo tree, we’ll pad to next power of two (4 leaves)
  const paddedLeaves = [...leaves];
  while ((paddedLeaves.length & (paddedLeaves.length - 1)) !== 0) {
    paddedLeaves.push(leaves[leaves.length - 1]); // repeat last leaf for padding
  }
  console.log("Padded Leaves:", paddedLeaves);

  // 2. Build Merkle tree (bottom-up)
  // tree[level][index] = node hash; level 0 = leaves
  const tree = [];
  tree.push(paddedLeaves);

  while (tree[tree.length - 1].length > 1) {
    const prevLevel = tree[tree.length - 1];
    const nextLevel = [];
    for (let i = 0; i < prevLevel.length; i += 2) {
      const left = BigInt(prevLevel[i]);
      const right = BigInt(prevLevel[i + 1]);
      const parent = poseidon([left, right]);
      nextLevel.push("0x" + poseidonF.toString(parent, 16));
    }
    tree.push(nextLevel);
  }

  const root = tree[tree.length - 1][0];

  // 3. For each leaf, compute Merkle path (siblings + index bits)
  function getMerkleProof(leafIndex) {
    const siblings = [];
    const indices = []; // 0 = left, 1 = right (for the leaf at that level)

    let idx = leafIndex;
    for (let level = 0; level < tree.length - 1; level++) {
      const levelNodes = tree[level];
      const isRight = idx % 2 === 1;
      const pairIndex = isRight ? idx - 1 : idx + 1;

      siblings.push(levelNodes[pairIndex]);
      indices.push(isRight ? 1 : 0);

      idx = Math.floor(idx / 2);
    }

    return { siblings, indices };
  }

  const users = {};
  for (let i = 0; i < ALLOWLIST.length; i++) {
    const email = ALLOWLIST[i];
    const leaf = leaves[i];
    const proof = getMerkleProof(i);
    users[email] = {
      leaf,
      siblings: proof.siblings,
      indices: proof.indices,
    };
  }

  const output = {
    root,
    users,
  };

  const outPath = path.join(__dirname, "..", "data", "merkle_allowlist.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log("Merkle allowlist written to:", outPath);
  console.log("Root:", root);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
