import { Listing } from './listingService';

export interface ParserStatus {
  status: 'idle' | 'running' | 'completed' | 'error';
  new_count?: number;
}

export interface UserStatus {
  user_id: string;
  status: 'online' | 'offline';
  last_seen?: string;
}

class SocketService {
  private ws: WebSocket | null = null;
  private listingsCallbacks: ((listings: Listing[]) => void)[] = [];
  private parserStatusCallbacks: ((status: ParserStatus) => void)[] = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    try {
      const token = localStorage.getItem('token'); // Получаем токен
      const wsUrl = token
        ? `ws://localhost:8001/ws?token=${token}`
        : 'ws://localhost:8001/ws';

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket подключен');
        this.reconnectAttempts = 0;

        // Ping every 30 seconds
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
        }
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send('ping');
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'new_listings') {
            this.listingsCallbacks.forEach(callback => callback(message.data));
          }

          if (message.type === 'parser_status') {
            const parserStatus: ParserStatus = {
              status: message.status,
              new_count: message.new_count
            };
            this.parserStatusCallbacks.forEach(callback => callback(parserStatus));
          }

          if (message.type === 'user_status') {
            const userStatus: UserStatus = {
              user_id: message.user_id,
              status: message.status,
              last_seen: message.last_seen
            };
            this.userStatusCallbacks.forEach(callback => callback(userStatus));
          }

          if (message.type === 'online_users_list') {
            const userIds: string[] = message.user_ids;
            userIds.forEach(userId => {
              const userStatus: UserStatus = {
                user_id: userId,
                status: 'online'
              };
              this.userStatusCallbacks.forEach(callback => callback(userStatus));
            });
          }
        } catch (error) {
          console.error('Ошибка обработки WebSocket сообщения:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket отключен');
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        // Переподключение
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
          console.log(`Попытка переподключения через ${delay}ms (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, delay);
        } else {
          console.error('Достигнуто максимальное количество попыток переподключения');
        }
      };
    } catch (error) {
      console.error('Ошибка создания WebSocket:', error);
    }

    return this.ws;
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  onNewListings(callback: (listings: Listing[]) => void) {
    this.listingsCallbacks.push(callback);
  }

  offNewListings(callback: (listings: Listing[]) => void) {
    this.listingsCallbacks = this.listingsCallbacks.filter(cb => cb !== callback);
  }

  onParserStatus(callback: (status: ParserStatus) => void) {
    this.parserStatusCallbacks.push(callback);
  }

  offParserStatus(callback: (status: ParserStatus) => void) {
    this.parserStatusCallbacks = this.parserStatusCallbacks.filter(cb => cb !== callback);
  }

  // User Status methods
  private userStatusCallbacks: ((status: UserStatus) => void)[] = [];

  onUserStatus(callback: (status: UserStatus) => void) {
    this.userStatusCallbacks.push(callback);
  }

  offUserStatus(callback: (status: UserStatus) => void) {
    this.userStatusCallbacks = this.userStatusCallbacks.filter(cb => cb !== callback);
  }
}

export const socketService = new SocketService();
