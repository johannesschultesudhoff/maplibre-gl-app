import * as signalR from "@microsoft/signalr";
import { getToken, updateToken } from '../auth/keycloak';

// Define interfaces for our event data
export interface RoiState {
  id: string;
  state: string;
  // Add other properties based on actual data structure
}

export interface ILngLat {
    lng: number;
    lat: number;
}

export interface IVehiclePosition {
  vehicleGid: string;
  journeyGid: string;
  speed: string;
  pos: ILngLat;
  heading: string;
  // Add other properties based on actual data structure
}

class SignalRService {
  private roiHubConnection: signalR.HubConnection | null = null;
  private positionHubConnection: signalR.HubConnection | null = null;
  private roiEventCallbacks: Array<(data: RoiState) => void> = [];
  private positionEventCallbacks: Array<(data: IVehiclePosition) => void> = [];
  private connectionStatusCallbacks: Array<(connected: boolean) => void> = [];
  
  /**
   * Create a connection with authentication
   */
  private createConnection(hubUrl: string): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: async () => {
          // Try to update token if it's about to expire
          try {
            await updateToken(60); // Ensure token is valid for at least 60 seconds
          } catch (error) {
            console.error("Failed to refresh token", error);
          }
          return getToken() || '';
        }
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 20000]) // Retry after increasing delays
      .configureLogging(signalR.LogLevel.Information)
      .build();
  }

  /**
   * Initialize ROI hub connection
   */
  public async startRoiHub(): Promise<void> {
    if (this.roiHubConnection) {
      return; // Already started
    }
    
    try {
      this.roiHubConnection = this.createConnection("https://localhost:8086/streaming/roi");
      
      // Set up event handlers
      this.roiHubConnection.on("StateChanged", (data: RoiState) => {
        this.roiEventCallbacks.forEach(callback => callback(data));
      });
      
      // Add handler for receivemessage method
      this.roiHubConnection.on("receivemessage", (message: any) => {
        // console.log("ROI hub received message:", message);
        // You can process the message if needed
      });
        
      // Add handler for receivemessage method
      this.roiHubConnection.on("vehiclejourneyassignment", (message: any) => {
        // console.log("ROI hub received message:", message);
        // You can process the message if needed
      });
   
      // Add handler for receivemessage method
      this.roiHubConnection.on("deviationcase", (message: any) => {
        // console.log("ROI hub received message:", message);
        // You can process the message if needed
      });



      // Handle connection status changes
      this.roiHubConnection.onclose((error) => {
        console.warn("ROI hub connection closed", error);
        this.notifyConnectionStatus(false);
      });
      
      this.roiHubConnection.onreconnecting((error) => {
        console.warn("ROI hub reconnecting", error);
        this.notifyConnectionStatus(false);
      });
      
      this.roiHubConnection.onreconnected(() => {
        console.log("ROI hub reconnected");
        this.notifyConnectionStatus(true);
      });
      
      await this.roiHubConnection.start();
      console.log("ROI hub connected");
      this.notifyConnectionStatus(true);
    } catch (error) {
      console.error("Error connecting to ROI hub:", error);
      this.notifyConnectionStatus(false);
      throw error;
    }
  }

  /**
   * Initialize Position hub connection
   */
  public async startPositionHub(): Promise<void> {
    if (this.positionHubConnection) {
      return; // Already started
    }
    
    try {
      this.positionHubConnection = this.createConnection("https://localhost:8086/streaming/position");
      
      this.positionHubConnection.stream("PositionRealtimeData").subscribe({
      next: (data: IVehiclePosition) => {
       this.positionEventCallbacks.forEach(callback => callback(data));
      },
      error: (_: any) => {
      },
      complete: () => {
      },
    });
  

      // Set up event handlers
      this.positionHubConnection.on("PositionUpdated", (data: IVehiclePosition) => {
        this.positionEventCallbacks.forEach(callback => callback(data));
      });
      
      // Add handler for receivemessage method
      this.positionHubConnection.on("receivemessage", (message: any) => {
        console.log("Position hub received message:", message);
        // You can process the message if needed
      });
      
      // Handle connection status changes
      this.positionHubConnection.onclose((error) => {
        console.warn("Position hub connection closed", error);
        this.notifyConnectionStatus(false);
      });
      
      this.positionHubConnection.onreconnecting((error) => {
        console.warn("Position hub reconnecting", error);
        this.notifyConnectionStatus(false);
      });
      
      this.positionHubConnection.onreconnected(() => {
        console.log("Position hub reconnected");
        this.notifyConnectionStatus(true);
      });
      
      await this.positionHubConnection.start();
      console.log("Position hub connected");
      this.notifyConnectionStatus(true);
    } catch (error) {
      console.error("Error connecting to Position hub:", error);
      this.notifyConnectionStatus(false);
      throw error;
    }
  }

  /**
   * Notify all connection status listeners
   */
  private notifyConnectionStatus(connected: boolean): void {
    this.connectionStatusCallbacks.forEach(callback => callback(connected));
  }

  /**
   * Subscribe to ROI events
   */
  public onRoiEvent(callback: (data: RoiState) => void): () => void {
    this.roiEventCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.roiEventCallbacks = this.roiEventCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to Position events
   */
  public onPositionEvent(callback: (data: IVehiclePosition) => void): () => void {
    this.positionEventCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.positionEventCallbacks = this.positionEventCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  public onConnectionStatusChange(callback: (connected: boolean) => void): () => void {
    this.connectionStatusCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.connectionStatusCallbacks = this.connectionStatusCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Check if both hubs are connected
   */
  public isConnected(): boolean {
    return (
      this.roiHubConnection?.state === signalR.HubConnectionState.Connected &&
      this.positionHubConnection?.state === signalR.HubConnectionState.Connected
    );
  }

  /**
   * Clean up connections
   */
  public async stopConnections(): Promise<void> {
    if (this.roiHubConnection) {
      await this.roiHubConnection.stop();
      this.roiHubConnection = null;
    }
    if (this.positionHubConnection) {
      await this.positionHubConnection.stop();
      this.positionHubConnection = null;
    }
    this.notifyConnectionStatus(false);
  }
}

// Export a singleton instance
export const signalRService = new SignalRService();