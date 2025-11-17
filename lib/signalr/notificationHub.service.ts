import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { config } from '../config';
import { store } from '@/store';
import { setSignalRConnecting, setSignalRConnected, setSignalRDisconnected, setSignalRError } from '@/store/slices/signalRSlice';

class SignalRService {
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds
  private connectionStateMonitor: ReturnType<typeof setInterval> | null = null;

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
        store.dispatch(setSignalRDisconnected());
        this.handleDisconnect();
      });

      this.connection.onreconnecting((error) => {
        console.log('🔄 SignalR reconnecting...', error);
        store.dispatch(setSignalRConnecting());
      });

      this.connection.onreconnected((connectionId) => {
        console.log('✅ SignalR reconnected. Connection ID:', connectionId);
        this.reconnectAttempts = 0;
        store.dispatch(setSignalRConnected());
      });
      
      this.startConnectionStateMonitor();

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected. Connection ID:', this.connection.connectionId);
      this.reconnectAttempts = 0;
      store.dispatch(setSignalRConnected());
    } catch (error: any) {
      console.error('❌ Error initializing SignalR:', error);
      store.dispatch(setSignalRError(error?.message || 'SignalR initialization failed'));
      this.stopConnectionStateMonitor();
      throw error;
    }
  }

  /**
   * Stop SignalR connection
   */
  async stop(): Promise<void> {
    this.stopConnectionStateMonitor();
    
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🛑 SignalR connection stopped');
        store.dispatch(setSignalRDisconnected());
        this.connection = null;
      } catch (error) {
        console.error('Error stopping SignalR:', error);
        store.dispatch(setSignalRDisconnected());
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
        store.dispatch(setSignalRConnecting());
        await this.connection.start();
        console.log('✅ Reconnected successfully');
        this.reconnectAttempts = 0;
        store.dispatch(setSignalRConnected());
      } catch (error: any) {
        console.error('❌ Reconnection failed:', error);
        store.dispatch(setSignalRError(error?.message || 'Reconnection failed'));
      }
    }
  }
  
  /**
   * Start monitoring connection state to keep Redux in sync
   */
  private startConnectionStateMonitor(): void {
    this.stopConnectionStateMonitor();
    
    this.connectionStateMonitor = setInterval(() => {
      if (!this.connection) {
        return;
      }
      
      const state = this.connection.state;
      const currentReduxState = store.getState().signalR.isConnected;
      
      if (state === HubConnectionState.Connected && !currentReduxState) {
        console.log('🔄 Syncing Redux: Connection is actually connected');
        store.dispatch(setSignalRConnected());
      } else if (state === HubConnectionState.Disconnected && currentReduxState) {
        console.log('🔄 Syncing Redux: Connection is actually disconnected');
        store.dispatch(setSignalRDisconnected());
      } else if (state === HubConnectionState.Connecting || state === HubConnectionState.Reconnecting) {
        const isConnecting = store.getState().signalR.isConnecting;
        if (!isConnecting) {
          console.log('🔄 Syncing Redux: Connection is connecting/reconnecting');
          store.dispatch(setSignalRConnecting());
        }
      }
    }, 2000);
  }
  
  /**
   * Stop monitoring connection state
   */
  private stopConnectionStateMonitor(): void {
    if (this.connectionStateMonitor) {
      clearInterval(this.connectionStateMonitor);
      this.connectionStateMonitor = null;
    }
  }

  /**
   * Subscribe to notification received event
   * @param callback Callback function when notification is received
   */
  onNotificationReceived<T>(callback: (data: T) => void): void {
    if (!this.connection) {
      console.warn('⚠️ Cannot subscribe to notifications. SignalR not initialized.');
      return;
    }
    const connectionState = this.connection.state;
    console.log(`🔍 Current connection state: ${connectionState}`);
    console.log(`🔍 Connection ID: ${this.connection.connectionId || 'N/A'}`);

    if (connectionState !== HubConnectionState.Connected) {
      console.warn(`⚠️ Cannot subscribe to notifications. Connection state: ${connectionState}`);
      return;
    }
    console.log('📡 Subscribing to ReceiveNotification event');
    this.connection.on('ReceiveNotification', callback);
    console.log('✅ Successfully subscribed to ReceiveNotification event');
    
  }

  /**
   * Unsubscribe from notification received event
   */
  offNotificationReceived(): void {
    if (!this.connection) {
      return;
    }
    console.log('📴 Unsubscribing from ReceiveNotification event');
    this.connection.off('ReceiveNotification');
  }
}

// Export singleton instance
export const signalRService = new SignalRService();