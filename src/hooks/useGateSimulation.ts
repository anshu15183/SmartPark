
import { useState, useEffect } from 'react';

type GateType = 'entry' | 'exit';
type GateStatus = 'closed' | 'opening' | 'open' | 'closing';

// Create a simple event emitter for gates
const gateEvents = {
  listeners: new Map<string, Function[]>(),
  
  // Add a listener for a specific gate operation
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        const index = eventListeners.indexOf(callback);
        if (index !== -1) {
          eventListeners.splice(index, 1);
        }
      }
    };
  },
  
  // Trigger an event
  emit(event: string, data?: any) {
    // console.log(`Emitting event: ${event}`, data);
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }
};

// Hook to operate gates
export const useGateSimulation = () => {
  const [isSynced, setIsSynced] = useState(false);
  
  useEffect(() => {
    // Mark as synced when component mounts
    setIsSynced(true);
    // console.log('Gate simulation system synchronized');
    
    return () => {
      setIsSynced(false);
      // console.log('Gate simulation system disconnected');
    };
  }, []);
  
  // Function to operate gates from kiosk
  const operateGate = (gate: GateType, userName: string) => {
    if (!isSynced) return false;
    
    // Send event to barrier gate simulation
    const eventData = { 
      gate,
      userName,
      time: new Date().toISOString()
    };
    
    // console.log(`Sending ${gate} gate operation request for ${userName}`);
    gateEvents.emit(`${gate}-gate-request`, eventData);
    
    // Broadcast to all connected instances
    window.dispatchEvent(new CustomEvent('gate-operation', { 
      detail: { type: gate, userName, action: 'request' }
    }));
    
    return true;
  };
  
  // Listen for gate status changes
  const useGateStatus = (gate: GateType) => {
    const [status, setStatus] = useState<GateStatus>('closed');
    
    useEffect(() => {
      // Listen for status changes
      const unsubscribe = gateEvents.on(`${gate}-gate-status`, (newStatus: GateStatus) => {
        // console.log(`Gate ${gate} status changed to: ${newStatus}`);
        setStatus(newStatus);
      });
      
      // Listen for gate operation requests
      const operationUnsubscribe = gateEvents.on(`${gate}-gate-request`, (data: any) => {
        // Automatic gate operation sequence
        // console.log(`Received ${gate} gate operation request:`, data);
        
        // Create a sequence of status changes
        setStatus('opening');
        gateEvents.emit(`${gate}-gate-status`, 'opening');
        
        // After 1 second, set to open
        setTimeout(() => {
          setStatus('open');
          gateEvents.emit(`${gate}-gate-status`, 'open');
          
          // After 3 seconds, start closing
          setTimeout(() => {
            setStatus('closing');
            gateEvents.emit(`${gate}-gate-status`, 'closing');
            
            // After 1 second, set to closed
            setTimeout(() => {
              setStatus('closed');
              gateEvents.emit(`${gate}-gate-status`, 'closed');
            }, 1000);
          }, 3000);
        }, 1000);
      });
      
      // Global event listener for gate operations
      const handleGlobalGateEvent = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { type, action } = customEvent.detail;
        if (type === gate && action === 'request') {
          // console.log(`Detected global ${gate} gate operation`);
        }
      };
      
      window.addEventListener('gate-operation', handleGlobalGateEvent);
      
      return () => {
        unsubscribe();
        operationUnsubscribe();
        window.removeEventListener('gate-operation', handleGlobalGateEvent);
      };
    }, [gate]);
    
    return status;
  };
  
  return {
    operateGate,
    useGateStatus,
    gateEvents
  };
};

// Export singleton for use across components
export const gateSimulation = {
  ...gateEvents,
};
