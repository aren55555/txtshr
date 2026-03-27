export interface TrustRecord {
  hash: string;
  firstSeen: number;
  lastSeen: number;
}

export interface DiscoveryRecord {
  spec: string;
  firstSeen: number;
  lastSeen: number;
  count: number;
}

export interface RendererStoreAdapter {
  getTrustRecord(spec: string): Promise<TrustRecord | null>;
  saveTrustRecord(spec: string, hash: string): Promise<void>;
  getDiscoveredRenderers(): Promise<DiscoveryRecord[]>;
  recordDiscovery(spec: string): Promise<void>;
}

const TRUST_KEY = "txtshr:renderer:trust";
const DISCOVERY_KEY = "txtshr:renderer:discovery";

export class LocalStorageAdapter implements RendererStoreAdapter {
  async getTrustRecord(spec: string): Promise<TrustRecord | null> {
    try {
      const raw = localStorage.getItem(TRUST_KEY);
      if (!raw) return null;
      const store = JSON.parse(raw) as Record<string, TrustRecord>;
      return store[spec] ?? null;
    } catch {
      return null;
    }
  }

  async saveTrustRecord(spec: string, hash: string): Promise<void> {
    try {
      const raw = localStorage.getItem(TRUST_KEY);
      const store: Record<string, TrustRecord> = raw ? JSON.parse(raw) : {};
      const now = Date.now();
      store[spec] = { hash, firstSeen: store[spec]?.firstSeen ?? now, lastSeen: now };
      localStorage.setItem(TRUST_KEY, JSON.stringify(store));
    } catch {
      // Silently ignore storage errors (private mode, quota exceeded, etc.)
    }
  }

  async getDiscoveredRenderers(): Promise<DiscoveryRecord[]> {
    try {
      const raw = localStorage.getItem(DISCOVERY_KEY);
      if (!raw) return [];
      return JSON.parse(raw) as DiscoveryRecord[];
    } catch {
      return [];
    }
  }

  async recordDiscovery(spec: string): Promise<void> {
    try {
      const raw = localStorage.getItem(DISCOVERY_KEY);
      const list: DiscoveryRecord[] = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const idx = list.findIndex((r) => r.spec === spec);
      if (idx === -1) {
        list.push({ spec, firstSeen: now, lastSeen: now, count: 1 });
      } else {
        list[idx] = { ...list[idx], lastSeen: now, count: list[idx].count + 1 };
      }
      localStorage.setItem(DISCOVERY_KEY, JSON.stringify(list));
    } catch {
      // Silently ignore storage errors
    }
  }
}

let activeAdapter: RendererStoreAdapter = new LocalStorageAdapter();

export const setRendererStoreAdapter = (adapter: RendererStoreAdapter): void => {
  activeAdapter = adapter;
};

export const getTrustRecord = (spec: string) => activeAdapter.getTrustRecord(spec);
export const saveTrustRecord = (spec: string, hash: string) => activeAdapter.saveTrustRecord(spec, hash);
export const getDiscoveredRenderers = () => activeAdapter.getDiscoveredRenderers();
export const recordDiscovery = (spec: string) => activeAdapter.recordDiscovery(spec);
