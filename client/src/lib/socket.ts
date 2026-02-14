import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@artfully/shared';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: TypedSocket | null = null;

export function getSocket(): TypedSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function connectSocket(token: string): Promise<{ userId: string; username: string }> {
  return new Promise((resolve, reject) => {
    const s = getSocket();

    if (s.connected) {
      s.disconnect();
    }

    s.connect();

    s.once('connect', () => {
      s.emit('auth:token', { token });
    });

    s.once('auth:success', (data) => {
      resolve(data);
    });

    s.once('auth:failure', (data) => {
      reject(new Error(data.message));
    });

    s.once('connect_error', (error) => {
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 10000);
  });
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
  }
}

export default socket;
