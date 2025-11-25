use dep::poseidon::poseidon::bn254;

fn main(secret: Field, hashed: pub Field) {
    // Hash a single Field element with Poseidon over BN254
    let computed = bn254::hash_1([secret]);

    assert(computed == hashed);
}
