"use client";

import { useCallback, useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api-client";

type SavedBooksState = {
  loaded: boolean;
  loading: boolean;
  authenticated: boolean;
  savedBookIds: Set<string>;
  pendingBookIds: Set<string>;
};

type SavedBookSnapshot = {
  loaded: boolean;
  authenticated: boolean;
  isSaved: boolean;
  isPending: boolean;
};

type SavedBookMutationResult =
  | "saved"
  | "removed"
  | "login_required"
  | "unavailable"
  | "error";

const listeners = new Set<() => void>();
const snapshotCache = new Map<string, SavedBookSnapshot>();
let loadPromise: Promise<void> | null = null;
let savedBooksState: SavedBooksState = {
  loaded: false,
  loading: false,
  authenticated: false,
  savedBookIds: new Set<string>(),
  pendingBookIds: new Set<string>(),
};

function publish(nextState: SavedBooksState) {
  savedBooksState = nextState;
  listeners.forEach((listener) => listener());
}

function cloneState(overrides: Partial<SavedBooksState>) {
  return {
    ...savedBooksState,
    ...overrides,
  };
}

async function loadSavedBooks() {
  if (typeof window === "undefined") return;
  if (savedBooksState.loaded) return;
  if (loadPromise) return loadPromise;

  publish(cloneState({ loading: true }));

  loadPromise = apiFetch("/customers/me/saved-books", {
    method: "GET",
    cache: "no-store",
  })
    .then(async (response) => {
      const payload = (await response.json().catch(() => null)) as
        | { authenticated?: boolean; savedBookIds?: string[] }
        | null;
      publish(
        cloneState({
          loaded: true,
          loading: false,
          authenticated: Boolean(payload?.authenticated),
          savedBookIds: new Set(payload?.savedBookIds || []),
        }),
      );
    })
    .catch(() => {
      publish(
        cloneState({
          loaded: true,
          loading: false,
          authenticated: false,
          savedBookIds: new Set<string>(),
        }),
      );
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadSavedBooks();
  return () => {
    listeners.delete(listener);
  };
}

function snapshotFor(bookId: string) {
  const nextSnapshot: SavedBookSnapshot = {
    loaded: savedBooksState.loaded,
    authenticated: savedBooksState.authenticated,
    isSaved: savedBooksState.savedBookIds.has(bookId),
    isPending: savedBooksState.pendingBookIds.has(bookId),
  };

  const cachedSnapshot = snapshotCache.get(bookId);
  if (
    cachedSnapshot &&
    cachedSnapshot.loaded === nextSnapshot.loaded &&
    cachedSnapshot.authenticated === nextSnapshot.authenticated &&
    cachedSnapshot.isSaved === nextSnapshot.isSaved &&
    cachedSnapshot.isPending === nextSnapshot.isPending
  ) {
    return cachedSnapshot;
  }

  snapshotCache.set(bookId, nextSnapshot);
  return nextSnapshot;
}

const serverSnapshot: SavedBookSnapshot = {
  loaded: false,
  authenticated: false,
  isSaved: false,
  isPending: false,
};

async function mutateSavedBook(
  bookId: string,
  method: "POST" | "DELETE",
): Promise<SavedBookMutationResult> {
  if (typeof window === "undefined") return "error";
  await loadSavedBooks();

  if (!savedBooksState.authenticated) return "login_required";
  if (savedBooksState.pendingBookIds.has(bookId)) return "error";

  const pendingBookIds = new Set(savedBooksState.pendingBookIds);
  pendingBookIds.add(bookId);
  publish(cloneState({ pendingBookIds }));

  try {
    const response = await apiFetch("/customers/me/saved-books", {
      method,
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });

    if (response.status === 401) return "login_required";
    if (response.status === 404) return "unavailable";
    if (!response.ok) return "error";

    const nextSavedBookIds = new Set(savedBooksState.savedBookIds);
    if (method === "POST") nextSavedBookIds.add(bookId);
    else nextSavedBookIds.delete(bookId);

    publish(
      cloneState({
        savedBookIds: nextSavedBookIds,
      }),
    );

    return method === "POST" ? "saved" : "removed";
  } catch {
    return "error";
  } finally {
    const nextPendingBookIds = new Set(savedBooksState.pendingBookIds);
    nextPendingBookIds.delete(bookId);
    publish(cloneState({ pendingBookIds: nextPendingBookIds }));
  }
}

export function useSavedBookStatus(bookId: string) {
  const subscribeToBook = useCallback(
    (listener: () => void) => {
      let previous = snapshotFor(bookId);
      return subscribe(() => {
        const next = snapshotFor(bookId);
        if (
          next.loaded === previous.loaded &&
          next.authenticated === previous.authenticated &&
          next.isSaved === previous.isSaved &&
          next.isPending === previous.isPending
        ) {
          return;
        }
        previous = next;
        listener();
      });
    },
    [bookId],
  );

  const getSnapshot = useCallback(() => snapshotFor(bookId), [bookId]);

  const state = useSyncExternalStore(
    subscribeToBook,
    getSnapshot,
    () => serverSnapshot,
  );

  const save = useCallback(() => mutateSavedBook(bookId, "POST"), [bookId]);
  const remove = useCallback(() => mutateSavedBook(bookId, "DELETE"), [bookId]);
  const toggle = useCallback(
    () => mutateSavedBook(bookId, state.isSaved ? "DELETE" : "POST"),
    [bookId, state.isSaved],
  );

  return {
    ...state,
    save,
    remove,
    toggle,
  };
}
