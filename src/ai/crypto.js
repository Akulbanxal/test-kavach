/**
 * Kavach AI — Cryptographic Helper & Log Integrity
 *
 * Utilizes native Web Crypto APIs to compute SHA-256 hashes locally in the browser,
 * creating a tamper-evident session log chain.
 *
 * ⚠️ SECURITY & INTEGRITY SCOPE:
 * - What it DOES protect against: Detects retroactive edits or deletion of log entries
 *   after they have been recorded in the session chain (each block incorporates the previous hash).
 * - What it DOES NOT protect against: Does not protect against a malicious operator who controls
 *   the client browser/device before entries are hashed, since all hashing is performed client-side.
 * - Purpose: Provides chain-of-custody integrity for the session audit trail, not proof against local machine tampering.
 */

/**
 * Computes the SHA-256 hash of a string message.
 * @param {string} message - The payload to hash
 * @returns {Promise<string>} Hex representation of the SHA-256 signature
 */
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
