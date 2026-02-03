
import { webcrypto } from "node:crypto";
// @ts-ignore
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = webcrypto;
}
