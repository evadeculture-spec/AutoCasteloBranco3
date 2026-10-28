"use client";

import { useSyncExternalStore } from "react";

export type StoredVehicle = { id: string; slug: string; title: string; image: string | null; price: number };

type Store = {
  subscribe: (cb: () => void) => () => void;
  get: () => StoredVehicle[];
  has: (id: string) => boolean;
  toggle: (v: StoredVehicle) => { added: boolean; full: boolean };
  remove: (id: string) => void;
  clear: () => void;
  max: number;
};

const EMPTY: StoredVehicle[] = [];

function createListStore(key: string, max: number): Store {
  const listeners = new Set<() => void>();
  let cacheRaw: string | null = null;
  let cacheVal: StoredVehicle[] = EMPTY;

  const read = (): StoredVehicle[] => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cacheVal;
    }
    if (raw === cacheRaw) return cacheVal;
    cacheRaw = raw;
    try {
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      cacheVal = Array.isArray(parsed)
        ? parsed.filter((x): x is StoredVehicle => !!x && typeof x === "object" && typeof (x as StoredVehicle).id === "string").slice(0, max)
        : EMPTY;
    } catch {
      cacheVal = EMPTY;
    }
    return cacheVal;
  };

  const write = (list: StoredVehicle[]) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* armazenamento indisponível (modo privado) */
    }
    cacheRaw = null;
    listeners.forEach((l) => l());
  };

  return {
    max,
    subscribe(cb) {
      listeners.add(cb);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cacheRaw = null;
          cb();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", onStorage);
      };
    },
    get: read,
    has: (id) => read().some((v) => v.id === id),
    toggle(v) {
      const list = read();
      if (list.some((x) => x.id === v.id)) {
        write(list.filter((x) => x.id !== v.id));
        return { added: false, full: false };
      }
      if (list.length >= max) return { added: false, full: true };
      write([...list, v]);
      return { added: true, full: false };
    },
    remove(id) {
      write(read().filter((x) => x.id !== id));
    },
    clear() {
      write([]);
    },
  };
}

export const favoritesStore = createListStore("acb:favoritos", 50);
export const compareStore = createListStore("acb:comparar", 3);

export function useList(store: Store): StoredVehicle[] {
  return useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
}
