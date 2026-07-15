declare global {
  namespace Deno {
    type KvKey = readonly unknown[];

    interface KvEntry<T> {
      key: KvKey;
      value: T | null;
      versionstamp: string | null;
    }

    interface AtomicOperation {
      check(...entries: KvEntry<unknown>[]): AtomicOperation;
      set(key: KvKey, value: unknown, options?: { expireIn?: number }): AtomicOperation;
      delete(key: KvKey): AtomicOperation;
      commit(): Promise<{ ok: boolean; versionstamp?: string }>;
    }

    interface Kv {
      get<T>(key: KvKey): Promise<KvEntry<T>>;
      getMany(keys: readonly KvKey[]): Promise<KvEntry<unknown>[]>;
      atomic(): AtomicOperation;
    }
  }

  const Deno: {
    env: { get(name: string): string | undefined };
    openKv(path?: string): Promise<Deno.Kv>;
  };

  namespace App {
    interface Error {
      message: string;
    }
  }
}

export {};
