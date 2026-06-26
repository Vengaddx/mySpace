'use client';

/**
 * Fire-and-forget client → API helper used by optimistic-update flows.
 * Treats both network failures and non-2xx responses as errors so callers
 * can roll back their optimistic state reliably.
 */
export function api(url: string, method: string, body?: unknown, onError?: () => void) {
  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
    .then((res) => {
      if (!res.ok) onError?.();
    })
    .catch(() => onError?.());
}
