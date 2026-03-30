import { describe, expect, it } from "bun:test";
import {
  LocalStorageAdapter,
  LocalStorable,
  setRendererStoreAdapter,
  getTrustRecord,
  getTrustedRenderers,
  saveTrustRecord,
  getDiscoveredRenderers,
  recordDiscovery,
} from "./renderer-store";

const prepare = () => {
  const store = new Map<string, string>();
  const storage: LocalStorable = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); },
  };
  return { adapter: new LocalStorageAdapter(storage), storage };
};

describe("LocalStorageAdapter", () => {
  describe("getTrustRecord", () => {
    it("returns null when no record exists for the spec", async () => {
      const { adapter } = prepare();
      expect(await adapter.getTrustRecord("owner/repo/name")).toBeNull();
    });

    it("returns null when localStorage is empty", async () => {
      const { adapter } = prepare();
      expect(await adapter.getTrustRecord("any/spec/here")).toBeNull();
    });

    it("returns null when localStorage contains malformed JSON", async () => {
      const { adapter, storage } = prepare();
      storage.setItem("txtshr:renderer:trust", "{bad json}");
      expect(await adapter.getTrustRecord("owner/repo/name")).toBeNull();
    });
  });

  describe("saveTrustRecord / getTrustRecord", () => {
    it("round-trips a trust record", async () => {
      const { adapter } = prepare();
      await adapter.saveTrustRecord("owner/repo/name", "abc123");
      const record = await adapter.getTrustRecord("owner/repo/name");
      expect(record).not.toBeNull();
      expect(record!.hash).toBe("abc123");
    });

    it("preserves firstSeen across updates", async () => {
      const { adapter } = prepare();
      await adapter.saveTrustRecord("owner/repo/name", "hash1");
      const first = await adapter.getTrustRecord("owner/repo/name");
      await adapter.saveTrustRecord("owner/repo/name", "hash2");
      const second = await adapter.getTrustRecord("owner/repo/name");
      expect(second!.firstSeen).toBe(first!.firstSeen);
    });

    it("updates hash and lastSeen on subsequent saves", async () => {
      const { adapter } = prepare();
      await adapter.saveTrustRecord("owner/repo/name", "hash1");
      const first = await adapter.getTrustRecord("owner/repo/name");
      await adapter.saveTrustRecord("owner/repo/name", "hash2");
      const second = await adapter.getTrustRecord("owner/repo/name");
      expect(second!.hash).toBe("hash2");
      expect(second!.lastSeen).toBeGreaterThanOrEqual(first!.lastSeen);
    });

    it("stores records for multiple specs independently", async () => {
      const { adapter } = prepare();
      await adapter.saveTrustRecord("owner/repo/a", "hashA");
      await adapter.saveTrustRecord("owner/repo/b", "hashB");
      expect((await adapter.getTrustRecord("owner/repo/a"))!.hash).toBe("hashA");
      expect((await adapter.getTrustRecord("owner/repo/b"))!.hash).toBe("hashB");
    });
  });

  describe("getTrustedRenderers", () => {
    it("returns an empty array when no trust records exist", async () => {
      const { adapter } = prepare();
      expect(await adapter.getTrustedRenderers()).toEqual([]);
    });

    it("returns an empty array when localStorage contains malformed JSON", async () => {
      const { adapter, storage } = prepare();
      storage.setItem("txtshr:renderer:trust", "{bad json}");
      expect(await adapter.getTrustedRenderers()).toEqual([]);
    });

    it("returns a record for each trusted spec", async () => {
      const { adapter } = prepare();
      await adapter.saveTrustRecord("owner/repo/a", "hashA");
      await adapter.saveTrustRecord("owner/repo/b", "hashB");
      const trusted = await adapter.getTrustedRenderers();
      expect(trusted).toHaveLength(2);
      const specA = trusted.find((r) => r.spec === "owner/repo/a");
      const specB = trusted.find((r) => r.spec === "owner/repo/b");
      expect(specA!.hash).toBe("hashA");
      expect(specB!.hash).toBe("hashB");
    });

    it("includes firstSeen, lastSeen, and hash in each record", async () => {
      const { adapter } = prepare();
      await adapter.saveTrustRecord("owner/repo/name", "abc123");
      const trusted = await adapter.getTrustedRenderers();
      expect(trusted).toHaveLength(1);
      expect(trusted[0].spec).toBe("owner/repo/name");
      expect(trusted[0].hash).toBe("abc123");
      expect(typeof trusted[0].firstSeen).toBe("number");
      expect(typeof trusted[0].lastSeen).toBe("number");
    });
  });

  describe("getDiscoveredRenderers", () => {
    it("returns an empty array when nothing has been recorded", async () => {
      const { adapter } = prepare();
      expect(await adapter.getDiscoveredRenderers()).toEqual([]);
    });

    it("returns an empty array when localStorage contains malformed JSON", async () => {
      const { adapter, storage } = prepare();
      storage.setItem("txtshr:renderer:discovery", "not json");
      expect(await adapter.getDiscoveredRenderers()).toEqual([]);
    });
  });

  describe("recordDiscovery / getDiscoveredRenderers", () => {
    it("records a new spec with count 1", async () => {
      const { adapter } = prepare();
      await adapter.recordDiscovery("owner/repo/name");
      const list = await adapter.getDiscoveredRenderers();
      expect(list).toHaveLength(1);
      expect(list[0].spec).toBe("owner/repo/name");
      expect(list[0].count).toBe(1);
    });

    it("increments count on subsequent discoveries of the same spec", async () => {
      const { adapter } = prepare();
      await adapter.recordDiscovery("owner/repo/name");
      await adapter.recordDiscovery("owner/repo/name");
      await adapter.recordDiscovery("owner/repo/name");
      const list = await adapter.getDiscoveredRenderers();
      expect(list).toHaveLength(1);
      expect(list[0].count).toBe(3);
    });

    it("preserves firstSeen across repeated discoveries", async () => {
      const { adapter } = prepare();
      await adapter.recordDiscovery("owner/repo/name");
      const before = (await adapter.getDiscoveredRenderers())[0].firstSeen;
      await adapter.recordDiscovery("owner/repo/name");
      const after = (await adapter.getDiscoveredRenderers())[0].firstSeen;
      expect(after).toBe(before);
    });

    it("tracks multiple specs independently", async () => {
      const { adapter } = prepare();
      await adapter.recordDiscovery("owner/repo/a");
      await adapter.recordDiscovery("owner/repo/b");
      await adapter.recordDiscovery("owner/repo/a");
      const list = await adapter.getDiscoveredRenderers();
      expect(list).toHaveLength(2);
      expect(list.find((r) => r.spec === "owner/repo/a")!.count).toBe(2);
      expect(list.find((r) => r.spec === "owner/repo/b")!.count).toBe(1);
    });
  });
});

describe("module-level wrappers", () => {
  it("getTrustRecord returns null for unknown spec", async () => {
    const { adapter } = prepare();
    setRendererStoreAdapter(adapter);
    expect(await getTrustRecord("owner/repo/name")).toBeNull();
  });

  it("saveTrustRecord then getTrustRecord returns the saved record", async () => {
    const { adapter } = prepare();
    setRendererStoreAdapter(adapter);
    await saveTrustRecord("owner/repo/name", "deadbeef");
    const record = await getTrustRecord("owner/repo/name");
    expect(record!.hash).toBe("deadbeef");
  });

  it("getTrustedRenderers returns empty array initially", async () => {
    const { adapter } = prepare();
    setRendererStoreAdapter(adapter);
    expect(await getTrustedRenderers()).toEqual([]);
  });

  it("getTrustedRenderers returns saved records", async () => {
    const { adapter } = prepare();
    setRendererStoreAdapter(adapter);
    await saveTrustRecord("owner/repo/name", "deadbeef");
    const trusted = await getTrustedRenderers();
    expect(trusted).toHaveLength(1);
    expect(trusted[0].spec).toBe("owner/repo/name");
    expect(trusted[0].hash).toBe("deadbeef");
  });

  it("getDiscoveredRenderers returns empty array initially", async () => {
    const { adapter } = prepare();
    setRendererStoreAdapter(adapter);
    expect(await getDiscoveredRenderers()).toEqual([]);
  });

  it("recordDiscovery then getDiscoveredRenderers returns the recorded spec", async () => {
    const { adapter } = prepare();
    setRendererStoreAdapter(adapter);
    await recordDiscovery("owner/repo/name");
    const list = await getDiscoveredRenderers();
    expect(list[0].spec).toBe("owner/repo/name");
  });
});
