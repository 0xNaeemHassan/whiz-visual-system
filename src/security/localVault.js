const VAULT_VERSION = 1;
const ALGORITHM = 'AES-GCM';
const WRAP_ALGORITHM = 'AES-KW';
const MASTER_KEY_STORAGE_KEY = 'whiz-vault-master-key-v1';

const te = new TextEncoder();
const td = new TextDecoder();

const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) => new Uint8Array(atob(value).split('').map((c) => c.charCodeAt(0)));

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function getMasterKey() {
  const existing = localStorage.getItem(MASTER_KEY_STORAGE_KEY);
  if (existing) {
    return crypto.subtle.importKey('raw', fromBase64(existing), WRAP_ALGORITHM, false, ['wrapKey', 'unwrapKey']);
  }
  const masterRaw = randomBytes(32);
  localStorage.setItem(MASTER_KEY_STORAGE_KEY, toBase64(masterRaw));
  return crypto.subtle.importKey('raw', masterRaw, WRAP_ALGORITHM, false, ['wrapKey', 'unwrapKey']);
}

export function isVaultEnvelope(value) {
  return Boolean(value && typeof value === 'object' && value.vaultVersion && value.alg && value.keyRef);
}

export async function encryptVaultPayload(payload, keyRef = MASTER_KEY_STORAGE_KEY) {
  const contentIv = randomBytes(12);
  const dataKey = await crypto.subtle.generateKey({ name: ALGORITHM, length: 256 }, true, ['encrypt', 'decrypt']);
  const cipherText = await crypto.subtle.encrypt({ name: ALGORITHM, iv: contentIv }, dataKey, te.encode(JSON.stringify(payload)));
  const wrapKey = await getMasterKey();
  const wrappedDataKey = await crypto.subtle.wrapKey('raw', dataKey, wrapKey, WRAP_ALGORITHM);

  return {
    vaultVersion: VAULT_VERSION,
    alg: `${ALGORITHM}+${WRAP_ALGORITHM}`,
    createdAt: new Date().toISOString(),
    keyRef,
    iv: toBase64(contentIv),
    wrappedKey: toBase64(new Uint8Array(wrappedDataKey)),
    ciphertext: toBase64(new Uint8Array(cipherText)),
  };
}

export async function decryptVaultEnvelope(envelope) {
  const wrapKey = await getMasterKey();
  const dataKey = await crypto.subtle.unwrapKey(
    'raw',
    fromBase64(envelope.wrappedKey),
    wrapKey,
    WRAP_ALGORITHM,
    { name: ALGORITHM, length: 256 },
    false,
    ['decrypt'],
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: fromBase64(envelope.iv) },
    dataKey,
    fromBase64(envelope.ciphertext),
  );
  return JSON.parse(td.decode(plaintext));
}

export async function loadVaultPayload(storageKey, storage = localStorage) {
  const raw = storage.getItem(storageKey);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!isVaultEnvelope(parsed)) {
    const migratedEnvelope = await encryptVaultPayload(parsed);
    storage.setItem(storageKey, JSON.stringify(migratedEnvelope));
    return parsed;
  }
  return decryptVaultEnvelope(parsed);
}

export async function storeVaultPayload(storageKey, payload, storage = localStorage) {
  const envelope = await encryptVaultPayload(payload);
  storage.setItem(storageKey, JSON.stringify(envelope));
  return envelope;
}
