"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = require("node:crypto");
// @ts-ignore
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = node_crypto_1.webcrypto;
}
