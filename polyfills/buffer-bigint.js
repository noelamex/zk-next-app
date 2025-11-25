// polyfills/buffer-bigint.js

// This polyfills Node's Buffer BigInt write method for browser environments.
// @aztec/bb.js expects Buffer.writeBigUInt64BE to exist.
// Browser Buffer polyfills do not implement it, so we add a safe version.

(function () {
  if (typeof Buffer === "undefined") return;

  const proto = Buffer.prototype;
  if (proto.writeBigUInt64BE) return; // Already exists (Node environment)

  proto.writeBigUInt64BE = function (value, offset = 0) {
    if (typeof value !== "bigint") {
      throw new TypeError("value must be a BigInt");
    }

    if (offset < 0 || offset + 8 > this.length) {
      throw new RangeError("offset out of range");
    }

    // Use browser-native DataView for big-endian write
    const view = new DataView(new ArrayBuffer(8));
    view.setBigUint64(0, value, false); // false = BE

    const bytes = new Uint8Array(view.buffer);
    for (let i = 0; i < 8; i++) {
      this[offset + i] = bytes[i];
    }

    return offset + 8;
  };
})();
