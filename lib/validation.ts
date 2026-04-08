// Solana base58 address validation
const BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export function isValidAddress(addr: string): boolean {
  return BASE58_RE.test(addr);
}
export function sanitizeError(msg: string): string {
  // Strip anything that looks like an API key or internal path
  return msg.replace(/x-api-key[:\s]*\S+/gi, '[REDACTED]')
            .replace(/https?:\/\/api\.jup\.ag\S*/g, '[UPSTREAM]')
            .substring(0, 200);
}

/** LRU-style eviction: delete oldest entry when map exceeds maxSize */
export function setWithLimit<K, V>(map: Map<K, V>, key: K, value: V, maxSize: number) {
  if (map.size >= maxSize) {
    const firstKey = map.keys().next().value;
    if (firstKey !== undefined) map.delete(firstKey);
  }
  map.set(key, value);
}
