// Client-side encrypted storage for sensitive tokens.
// Master AES-GCM key is non-extractable and stored in IndexedDB; tokens
// at rest in localStorage are ciphertext + IV. This prevents trivial
// copy-paste of plaintext tokens from devtools/Storage and limits exposure
// to XSS unless an attacker can also run code in the page context.

const DB_NAME = "dnx-vault";
const STORE = "keys";
const KEY_ID = "master-v1";

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const idbGet = async <T>(key: string): Promise<T | undefined> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    tx.onsuccess = () => resolve(tx.result as T | undefined);
    tx.onerror = () => reject(tx.error);
  });
};

const idbSet = async (key: string, val: unknown): Promise<void> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite").objectStore(STORE).put(val, key);
    tx.onsuccess = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

let cachedKey: CryptoKey | null = null;

export const getMasterKey = async (): Promise<CryptoKey> => {
  if (cachedKey) return cachedKey;
  let key = await idbGet<CryptoKey>(KEY_ID);
  if (!key) {
    key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false, // non-extractable
      ["encrypt", "decrypt"],
    );
    await idbSet(KEY_ID, key);
  }
  cachedKey = key;
  return key;
};

const b64 = {
  enc: (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)),
  dec: (str: string) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0)),
};

export const encryptString = async (plain: string): Promise<string> => {
  const key = await getMasterKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  return `enc1:${b64.enc(iv)}:${b64.enc(ct)}`;
};

export const decryptString = async (payload: string): Promise<string> => {
  if (!payload?.startsWith("enc1:")) return payload;
  const [, ivB64, ctB64] = payload.split(":");
  const key = await getMasterKey();
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64.dec(ivB64) },
    key,
    b64.dec(ctB64),
  );
  return new TextDecoder().decode(pt);
};

export const isEncrypted = (v: unknown): v is string =>
  typeof v === "string" && v.startsWith("enc1:");
