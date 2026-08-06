// Web Crypto API End-to-End Encryption (E2EE) Utility Module

const STORAGE_PREFIX = "talkfusion_e2ee_";

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate RSA-OAEP Key Pair for user
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exportedPublic = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedPrivate = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  const publicKeyPem = bufferToBase64(exportedPublic);
  const privateKeyPem = bufferToBase64(exportedPrivate);

  return { publicKeyPem, privateKeyPem };
}

// Store private key in localStorage securely for current user
export function storePrivateKey(userId, privateKeyPem) {
  if (!userId || !privateKeyPem) return;
  localStorage.setItem(`${STORAGE_PREFIX}priv_${userId}`, privateKeyPem);
}

// Retrieve private key object from localStorage
export async function getPrivateKey(userId) {
  const privateKeyPem = localStorage.getItem(`${STORAGE_PREFIX}priv_${userId}`);
  if (!privateKeyPem) return null;

  try {
    const buffer = base64ToBuffer(privateKeyPem);
    return await window.crypto.subtle.importKey(
      "pkcs8",
      buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"]
    );
  } catch (err) {
    console.error("Failed to import private key:", err);
    return null;
  }
}

// Import a public key string
export async function importPublicKey(publicKeyPem) {
  if (!publicKeyPem) return null;
  try {
    const buffer = base64ToBuffer(publicKeyPem);
    return await window.crypto.subtle.importKey(
      "spki",
      buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"]
    );
  } catch (err) {
    console.error("Failed to import public key:", err);
    return null;
  }
}

// Generate AES-GCM 256 symmetric key
export async function generateSymmetricKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Export symmetric key to base64
export async function exportSymmetricKey(key) {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

// Import symmetric key from base64
export async function importSymmetricKey(keyBase64) {
  const buffer = base64ToBuffer(keyBase64);
  return await window.crypto.subtle.importKey(
    "raw",
    buffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

// Encrypt plaintext message with AES-GCM key
export async function encryptWithSymmetricKey(key, plaintext) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
  };
}

// Decrypt message with AES-GCM key
export async function decryptWithSymmetricKey(key, ciphertextBase64, ivBase64) {
  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const iv = base64ToBuffer(ivBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      ciphertextBuffer
    );
    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Decryption Error: Key mismatch or tampered payload]";
  }
}

// Encrypt a symmetric key using RSA Public Key (for distributing Group Key)
export async function encryptKeyForRecipient(recipientPublicKeyPem, rawSymmetricKeyBase64) {
  const pubKey = await importPublicKey(recipientPublicKeyPem);
  if (!pubKey) return null;
  const data = new TextEncoder().encode(rawSymmetricKeyBase64);
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    data
  );
  return bufferToBase64(encryptedBuffer);
}

// Decrypt a symmetric key using recipient's RSA Private Key
export async function decryptKeyWithPrivateKey(userId, encryptedKeyBase64) {
  const privKey = await getPrivateKey(userId);
  if (!privKey) return null;
  try {
    const encryptedBuffer = base64ToBuffer(encryptedKeyBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privKey,
      encryptedBuffer
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.error("Failed to decrypt group symmetric key:", err);
    return null;
  }
}

// Ensure key pair exists for logged-in user, returns public key
export async function ensureUserKeyPair(userId, currentPublicKeyPem, updateServerPublicKeyCallback) {
  if (!userId) return null;
  let existingPrivate = localStorage.getItem(`${STORAGE_PREFIX}priv_${userId}`);
  
  if (!existingPrivate || !currentPublicKeyPem) {
    const { publicKeyPem, privateKeyPem } = await generateKeyPair();
    storePrivateKey(userId, privateKeyPem);
    if (updateServerPublicKeyCallback) {
      await updateServerPublicKeyCallback(publicKeyPem);
    }
    return publicKeyPem;
  }

  return currentPublicKeyPem;
}

// Compute fingerprint hash for visual E2EE verification
export async function computeFingerprint(text) {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", enc.encode(text || "talkfusion-security"));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.slice(0, 8).map((b) => b.toString(16).padStart(2, "0")).join(":").toUpperCase();
}
