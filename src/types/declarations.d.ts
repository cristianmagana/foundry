declare module 'tweetnacl' {
    export function seal(message: Uint8Array, publicKey: Uint8Array): Uint8Array;
}

declare module 'tweetnacl-util' {
    export function decodeBase64(s: string): Uint8Array;
    export function encodeBase64(arr: Uint8Array): string;
}
