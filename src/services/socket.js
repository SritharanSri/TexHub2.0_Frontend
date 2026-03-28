import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (this.socket && this.socket.auth && this.socket.auth.token !== token) {
      console.log('Socket token mismatch, reconnecting...');
      this.disconnect();
    }
    if (this.socket) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to real-time server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
    });

    this.socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  joinOrderChat(orderId) {
    if (this.socket && orderId) {
      this.socket.emit('join_order_chat', orderId);
    }
  }

  leaveOrderChat(orderId) {
    if (this.socket && orderId) {
      this.socket.emit('leave_order_chat', orderId);
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  offNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new_message', callback);
    }
  }

  onNewNotification(callback) {
    if (this.socket) {
      this.socket.on('new_notification', callback);
    }
  }

  offNewNotification(callback) {
    if (this.socket) {
      this.socket.off('new_notification', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
