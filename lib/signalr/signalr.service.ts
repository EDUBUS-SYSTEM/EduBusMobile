import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { config } from '../config';

class SignalRService {
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  /**
   * Initialize SignalR connection
   */
  async initialize(token: string): Promise<void> {
    if (this.connection) {
      console.log('SignalR already initialized');
      return;
    }

    try {
      // Build hub URL from API URL
      const hubUrl = config.API_URL.replace('/api', '/notificationHub');
      
      console.log('🔌 Connecting to SignalR hub:', hubUrl);

      this.connection = new HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
          skipNegotiation: false,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
              return null; // Stop reconnecting
            }
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          },
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Connection event handlers
      this.connection.onclose((error) => {
        console.log('❌ SignalR connection closed', error);
        this.handleDisconnect();
      });

      this.connection.onreconnecting((error) => {
        console.log('🔄 SignalR reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected. Connection ID:', connectionId);
        this.reconnectAttempts = 0;
      });

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected. Connection ID:', this.connection.connectionId);
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('❌ Error initializing SignalR:', error);
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🛑 SignalR connection stopped');
        this.connection = null;
      } catch (error) {
        console.error('Error stopping SignalR:', error);
      }
    }
  }

  /**
   * Subscribe to an event
   * @param eventName Event name to subscribe to
   * @param callback Callback function when event is received
   */
  on<T>(eventName: string, callback: (data: T) => void): void {
    if (!this.connection) {
      console.warn('⚠️ Cannot subscribe to event. SignalR not initialized.');
      return;
    }

    console.log(`📡 Subscribing to event: ${eventName}`);
    this.connection.on(eventName, callback);
  }

  /**
   * Unsubscribe from an event
   * @param eventName Event name to unsubscribe from
   */
  off(eventName: string): void {
    if (!this.connection) {
      return;
    }

    console.log(`📴 Unsubscribing from event: ${eventName}`);
    this.connection.off(eventName);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  /**
   * Get connection state
   */
  getState(): HubConnectionState | null {
    return this.connection?.state || null;
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.attemptReconnect();
      }, this.reconnectDelay);
    } else {
      console.error('❌ Max reconnection attempts reached. Giving up.');
    }
  }

  /**
   * Attempt to reconnect
   */
  private async attemptReconnect(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Disconnected) {
      try {
        await this.connection.start();
        console.log('✅ Reconnected successfully');
        this.reconnectAttempts = 0;
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }
  }
}

// Export singleton instance
export const signalRService = new SignalRService();