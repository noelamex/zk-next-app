use dep::poseidon::poseidon::bn254;

// Verify a depth-2 Merkle path.
//
// - leaf: the leaf Field (email hash) for the user
// - siblings: 2 sibling nodes, from leaf level up to root-1
// - indices: 2 flags, 0 if our node is left child, 1 if right child
// Returns: the computed root from (leaf, siblings, indices).
fn compute_merkle_root(leaf: Field, siblings: [Field; 2], indices: [Field; 2]) -> Field {
    let mut acc = leaf;

    for i in 0..2 {
        let sib = siblings[i];

        if indices[i] == 0 {
            // current node is LEFT child: parent = H(acc, sib)
            acc = bn254::hash_2([acc, sib]);
        } else {
            // current node is RIGHT child: parent = H(sib, acc)
            acc = bn254::hash_2([sib, acc]);
        }
    }

    acc
}

// Public statement: "this leaf is in the tree with this root"
fn main(leaf: Field, siblings: [Field; 2], indices: [Field; 2], root: pub Field) {
    let computed_root = compute_merkle_root(leaf, siblings, indices);
    assert(computed_root == root);
}
