import { io, type Socket } from "socket.io-client";

// In dev the API is on :4000 (Vite proxies /socket.io to it); in prod the
// API is reverse-proxied at the same origin (Caddy handles /socket.io/*).
// Override via VITE_API_URL when pointing at a different host.
const API_URL = import.meta.env.VITE_API_URL ?? window.location.origin;

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket) return _socket;
  _socket = io(API_URL, {
    transports: ["websocket"],
    autoConnect: true,
  });
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

export interface AckOk<T> {
  ok: true;
  data: T;
}
export interface AckErr {
  ok: false;
  error: string;
}
export type AckResult<T> = AckOk<T> | AckErr;

export function emitAck<T>(event: string, payload: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const sock = getSocket();
    sock.emit(event, payload, (res: AckResult<T>) => {
      if (res?.ok) resolve(res.data);
      else reject(new Error(res?.error ?? "EMIT_FAILED"));
    });
  });
}
