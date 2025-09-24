import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { signalRService } from '../services/signalRService';
import type { RoiState, IVehiclePosition } from '../services/signalRService';
import { useAuth } from '../auth/AuthContext';

interface SignalRContextProps {
  roiStates: RoiState[];
  positions: IVehiclePosition[];
  isConnected: boolean;
}

// Create context with default values
const SignalRContext = createContext<SignalRContextProps>({
  roiStates: [],
  positions: [],
  isConnected: false,
});

// Custom hook to use the SignalR context
export const useSignalR = () => useContext(SignalRContext);

interface SignalRProviderProps {
  children: ReactNode;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children }) => {
  const [roiStates, setRoiStates] = useState<RoiState[]>([]);
  const [positions, setPositions] = useState<IVehiclePosition[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { authenticated, token } = useAuth();
  
  useEffect(() => {
    // Only connect when authenticated and token is available
    if (authenticated && token) {
      let mounted = true;
      
      const connectToHubs = async () => {
        try {
          // Start both hub connections
          await signalRService.startRoiHub();
          await signalRService.startPositionHub();
          if (mounted) {
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Failed to connect to SignalR hubs:', error);
          if (mounted) {
            setIsConnected(false);
          }
        }
      };
      
      // Connect to hubs
      connectToHubs();
      
      // Subscribe to ROI events
      const roiUnsubscribe = signalRService.onRoiEvent((data) => {
        if (!mounted) return;
        
        setRoiStates(prev => {
          // Update or add new ROI state
          const index = prev.findIndex(roi => roi.id === data.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data;
            return updated;
          } else {
            return [...prev, data];
          }
        });
      });
      
      // Subscribe to Position events
      const positionUnsubscribe = signalRService.onPositionEvent((data) => {
        if (!mounted) return;
        
        setPositions(prev => {
          // Update or add new position
          const index = prev.findIndex(position => position.vehicleGid === data.vehicleGid);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data;
            return updated;
          } else {
            return [...prev, data];
          }
        });
      });
      
      // Subscribe to connection status changes
      const connectionStatusUnsubscribe = signalRService.onConnectionStatusChange((connected) => {
        if (mounted) {
          setIsConnected(connected);
        }
      });
      
      // Clean up connections and subscriptions when component unmounts
      return () => {
        mounted = false;
        roiUnsubscribe();
        positionUnsubscribe();
        connectionStatusUnsubscribe();
        signalRService.stopConnections();
      };
    } else {
      // Not authenticated, ensure connections are stopped
      signalRService.stopConnections();
      setIsConnected(false);
    }
  }, [authenticated, token]);
  
  return (
    <SignalRContext.Provider value={{ roiStates, positions, isConnected }}>
      {children}
    </SignalRContext.Provider>
  );
};

export default SignalRContext;