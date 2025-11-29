import { HttpTransportType, HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { config } from '../config';
import type { Guid } from '../types';

/**
 * Validate and normalize GUID format
 * GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 hex digits)
 * @param guid GUID string to validate (can be string, array, or undefined/null)
 * @returns Normalized GUID string or throws error if invalid
 */
function validateAndNormalizeGuid(guid: Guid | string | string[] | undefined | null): Guid {
  if (!guid) {
    throw new Error('GUID is required and cannot be null or undefined');
  }

  // Handle array case (expo-router sometimes returns arrays)
  let guidStr: string;
  if (Array.isArray(guid)) {
    if (guid.length === 0) {
      throw new Error('GUID array is empty');
    }
    guidStr = String(guid[0]).trim();
  } else {
    guidStr = String(guid).trim();
  }

  if (!guidStr) {
    throw new Error('GUID is required and cannot be empty');
  }

  // Remove any surrounding braces if present
  const cleanedGuid = guidStr.replace(/^\{|\}$/g, '');

  // Validate GUID format: 8-4-4-4-12 hex digits
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!guidRegex.test(cleanedGuid)) {
    throw new Error(`Invalid GUID format: ${guidStr}. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
  }

  // Return normalized GUID (lowercase for consistency)
  return cleanedGuid.toLowerCase() as Guid;
}

class TripHubService {
  private connection: HubConnection | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000; // 5 seconds

  /**
   * Initialize TripHub SignalR connection
   */
  async initialize(token: string): Promise<void> {
    if (this.connection) {
      console.log('TripHub already initialized');
      return;
    }

    try {
      // Build hub URL from API URL
      const hubUrl = config.API_URL.replace('/api', '/tripHub');

      console.log('🔌 Connecting to TripHub:', hubUrl);

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
        console.log('❌ TripHub connection closed', error);
        this.handleDisconnect();
      });

      this.connection.onreconnecting((error) => {
        console.log('🔄 TripHub reconnecting...', error);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('✅ TripHub reconnected. Connection ID:', connectionId);
        this.reconnectAttempts = 0;
      });

      // Start connection
      await this.connection.start();
      console.log('✅ TripHub connected. Connection ID:', this.connection.connectionId);
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('❌ Error initializing TripHub:', error);
      throw error;
    }
  }

  /**
   * Stop TripHub connection
   */
  async stop(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🛑 TripHub connection stopped');
        this.connection = null;
      } catch (error) {
        console.error('Error stopping TripHub:', error);
      }
    }
  }

  /**
   * Send location update to server
   * @param tripId Trip ID (GUID)
   * @param latitude Latitude
   * @param longitude Longitude
   * @param speed Optional speed
   * @param accuracy Optional accuracy
   * @param isMoving Optional moving status
   */
  async sendLocation(
    tripId: Guid | string | string[],
    latitude: number,
    longitude: number,
    speed?: number | null,
    accuracy?: number | null,
    isMoving: boolean = false
  ): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      console.warn('⚠️ Cannot send location. TripHub not connected.');
      return;
    }

    try {
      // Validate and normalize GUID
      const normalizedTripId = validateAndNormalizeGuid(tripId);

      // Ensure all parameters are the correct type
      const speedValue = speed !== undefined && speed !== null ? speed : null;
      const accuracyValue = accuracy !== undefined && accuracy !== null ? accuracy : null;

      // Log parameters for debugging
      console.log('📤 Sending location with params:', {
        tripId: normalizedTripId,
        latitude: typeof latitude === 'number' ? latitude : 'INVALID',
        longitude: typeof longitude === 'number' ? longitude : 'INVALID',
        speed: speedValue,
        accuracy: accuracyValue,
        isMoving: typeof isMoving === 'boolean' ? isMoving : false
      });

      // Invoke with all parameters in correct order
      // SignalR will automatically convert the GUID string to C# Guid type
      await this.connection.invoke(
        'SendLocation',
        normalizedTripId,  // Guid - SignalR will convert string to Guid
        latitude,          // double
        longitude,         // double
        speedValue,        // double? (nullable)
        accuracyValue,     // double? (nullable)
        isMoving           // bool
      );
      console.log(`📍 Location sent for trip ${normalizedTripId}: (${latitude}, ${longitude})`);
    } catch (error) {
      console.error('❌ Error sending location:', error);
      throw error;
    }
  }

  /**
   * Subscribe to location update events (for parents)
   * @param callback Callback function when location update is received
   */
  onLocationUpdate<T>(callback: (data: T) => void): void {
    if (!this.connection) {
      console.warn('⚠️ Cannot subscribe to location updates. TripHub not initialized.');
      return;
    }

    console.log('📡 Subscribing to ReceiveLocationUpdate event');
    this.connection.on('ReceiveLocationUpdate', callback);
  }

  /**
   * Unsubscribe from location update events
   */
  offLocationUpdate(): void {
    if (!this.connection) {
      return;
    }

    console.log(' Unsubscribing from ReceiveLocationUpdate event');
    this.connection.off('ReceiveLocationUpdate');
  }

  /**
   * Subscribe to any SignalR event
   * @param eventName Name of the event to subscribe to
   * @param callback Callback function when event is received
   */
  on<T>(eventName: string, callback: (data: T) => void): void {
    if (!this.connection) {
      console.warn(`⚠️ Cannot subscribe to ${eventName}. TripHub not initialized.`);
      return;
    }

    console.log(`📡 Subscribing to ${eventName} event`);
    this.connection.on(eventName, (data: T) => {
      callback(data);
    });
  }

  /**
   * Unsubscribe from any SignalR event
   * @param eventName Name of the event to unsubscribe from
   */
  off(eventName: string): void {
    if (!this.connection) {
      return;
    }

    console.log(`🔇 Unsubscribing from ${eventName} event`);
    this.connection.off(eventName);
  }

  /**
   * Join trip group (for parents)
   * @param tripId Trip ID (GUID) to join
   */
  async joinTrip(tripId: Guid | string | string[]): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      console.warn('⚠️ Cannot join trip. TripHub not connected.');
      return;
    }

    try {
      const normalizedTripId = validateAndNormalizeGuid(tripId);
      await this.connection.invoke('JoinTrip', normalizedTripId);
      console.log(`✅ Joined trip ${normalizedTripId}`);
    } catch (error) {
      console.error('❌ Error joining trip:', error);
      throw error;
    }
  }

  /**
   * Leave trip group (for parents)
   * @param tripId Trip ID (GUID) to leave
   */
  async leaveTrip(tripId: Guid | string | string[]): Promise<void> {
    if (!this.connection || this.connection.state !== HubConnectionState.Connected) {
      console.warn('⚠️ Cannot leave trip. TripHub not connected.');
      return;
    }

    try {
      const normalizedTripId = validateAndNormalizeGuid(tripId);
      await this.connection.invoke('LeaveTrip', normalizedTripId);
      console.log(`✅ Left trip ${normalizedTripId}`);
    } catch (error) {
      console.error('❌ Error leaving trip:', error);
      throw error;
    }
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
      console.log(`🔄 Attempting to reconnect TripHub... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

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
        console.log('✅ TripHub reconnected successfully');
        this.reconnectAttempts = 0;
      } catch (error) {
        console.error('❌ TripHub reconnection failed:', error);
      }
    }
  }


}

// Export singleton instance
export const tripHubService = new TripHubService();

