use dep::poseidon::poseidon::bn254;

fn main() -> pub Field {
    let secret = 1234;
    let h = bn254::hash_1([secret]);
    h
}
