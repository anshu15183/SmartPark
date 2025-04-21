import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Check, X, Clock } from "lucide-react";
import { gateSimulation } from "@/hooks/useGateSimulation";

type GateStatus = "closed" | "opening" | "open" | "closing";
type GateType = "entry" | "exit";

const BarrierGates = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [entryGateStatus, setEntryGateStatus] = useState<GateStatus>("closed");
  const [exitGateStatus, setExitGateStatus] = useState<GateStatus>("closed");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<{ type: string; message: string; time: string }[]>([]);
  const eventLogRef = useRef<HTMLDivElement>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate("/login", { state: { from: "/barrier-gates" } });
      return;
    }
    
    // Set current user ID from params or from logged in user
    if (userId) {
      setCurrentUserId(userId);
    } else if (user) {
      setCurrentUserId(user._id);
    }
    
    // Log initial connection
    addEvent("info", "Connected to barrier gate system");
    
    // Setup event listeners for gates from kiosk actions
    const entryGateListener = gateSimulation.on('entry-gate-request', (data: any) => {
      console.log('Received entry gate request:', data);
      handleGateAuthorized('entry', data.userName || 'User');
    });
    
    const exitGateListener = gateSimulation.on('exit-gate-request', (data: any) => {
      console.log('Received exit gate request:', data);
      handleGateAuthorized('exit', data.userName || 'User');
    });
    
    // Setup mock event socket listener - keep for random events as well
    const mockEventInterval = setInterval(() => {
      // Randomly simulate events only if we want to test things randomly
      if (Math.random() < 0.05) {  // Reduced probability to avoid conflicts with real events
        const events = [
          { gate: "entry", action: "request", user: "Random User" },
          { gate: "exit", action: "request", user: "Random User" },
          { gate: "entry", action: "authorized", user: "Random User" },
          { gate: "exit", action: "authorized", user: "Random User" },
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        
        if (randomEvent.action === "request") {
          handleGateRequest(randomEvent.gate as GateType, randomEvent.user);
        } else {
          handleGateAuthorized(randomEvent.gate as GateType, randomEvent.user);
        }
      }
    }, 30000); // Every 30 seconds instead of 20 to reduce frequency
    
    return () => {
      // Cleanup event listeners
      entryGateListener();
      exitGateListener();
      clearInterval(mockEventInterval);
      
      // Clear any pending exit timers when component unmounts
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [userId, user, navigate]);
  
  const addEvent = (type: string, message: string) => {
    const time = new Date().toLocaleTimeString();
    setEvents(prev => [...prev, { type, message, time }]);
  };
  
  const handleGateRequest = (gate: GateType, userName: string) => {
    addEvent("request", `${gate.charAt(0).toUpperCase() + gate.slice(1)} gate: ${userName} requesting access`);
  };
  
  const handleGateAuthorized = (gate: GateType, userName: string) => {
    addEvent("success", `${gate.charAt(0).toUpperCase() + gate.slice(1)} gate: Access granted for ${userName}`);
    
    if (gate === "entry") {
      operateEntryGate();
    } else {
      operateExitGate();
    }
  };
  
  const operateEntryGate = () => {
    // Entry gate animation sequence
    setEntryGateStatus("opening");
    gateSimulation.emit('entry-gate-status', 'opening');
    addEvent("info", "Entry gate opening");
    
    setTimeout(() => {
      setEntryGateStatus("open");
      gateSimulation.emit('entry-gate-status', 'open');
      addEvent("info", "Entry gate opened");
      
      // Close gate after 5 seconds
      setTimeout(() => {
        setEntryGateStatus("closing");
        gateSimulation.emit('entry-gate-status', 'closing');
        addEvent("info", "Entry gate closing");
        
        setTimeout(() => {
          setEntryGateStatus("closed");
          gateSimulation.emit('entry-gate-status', 'closed');
          addEvent("info", "Entry gate closed");
        }, 3000);
      }, 5000);
    }, 3000);
  };
  
  const operateExitGate = () => {
    // Exit gate animation sequence
    setExitGateStatus("opening");
    gateSimulation.emit('exit-gate-status', 'opening');
    addEvent("info", "Exit gate opening");
    
    setTimeout(() => {
      setExitGateStatus("open");
      gateSimulation.emit('exit-gate-status', 'open');
      addEvent("info", "Exit gate opened");
      
      // Close gate after 5 seconds
      setTimeout(() => {
        setExitGateStatus("closing");
        gateSimulation.emit('exit-gate-status', 'closing');
        addEvent("info", "Exit gate closing");
        
        setTimeout(() => {
          setExitGateStatus("closed");
          gateSimulation.emit('exit-gate-status', 'closed');
          addEvent("info", "Exit gate closed");
        }, 3000);
      }, 5000);
    }, 3000);
  };
  
  const testEntryGate = () => {
    addEvent("success", "Entry gate: QR code scanned, access granted for test user");
    operateEntryGate();
  };
  
  const testExitGate = () => {
    addEvent("success", "Exit gate: QR code scanned, payment processed successfully");
    operateExitGate();
  };
  
  const testEntryDenied = () => {
    addEvent("error", "Entry gate: QR code scanned, access denied for test user");
    toast({
      variant: "destructive",
      title: "Access Denied",
      description: "No valid booking found for this vehicle",
    });
  };
  
  const testExitPaymentRequired = () => {
    addEvent("warning", "Exit gate: QR code scanned, payment required");
    
    // Start a 3-minute timer for automatic exit
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    
    toast({
      title: "Payment Required",
      description: "Please complete payment within 3 minutes or amount will be added to dues",
    });
    
    // Set 3-minute timer for automatic exit
    exitTimerRef.current = setTimeout(() => {
      addEvent("warning", "Exit gate: Payment timeout (3 minutes). Adding to dues and opening gate");
      
      toast({
        variant: "destructive",
        title: "Payment Timeout",
        description: "Amount has been added to dues",
      });
      
      // Open the gate after payment timeout
      operateExitGate();
    }, 180000); // 3 minutes
  };
  
  const simulatePaymentComplete = () => {
    // Clear the timeout
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    
    addEvent("success", "Exit gate: Payment completed successfully");
    
    toast({
      title: "Payment Successful",
      description: "Thank you for your payment",
    });
    
    // Open the gate after payment
    operateExitGate();
  };
  
  const getBarrierStyle = (status: GateStatus) => {
    switch (status) {
      case "closed":
        return "h-10 w-[90%] rotate-0 origin-left transition-transform duration-3000";
      case "opening":
        return "h-10 w-[90%] -rotate-90 origin-left transition-transform duration-3000";
      case "open":
        return "h-10 w-[90%] -rotate-90 origin-left";
      case "closing":
        return "h-10 w-[90%] rotate-0 origin-left transition-transform duration-3000";
    }
  };
  
  const simulateTimeoutForDemo = () => {
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
    }
    
    addEvent("warning", "Exit gate: DEMO - Simulating 3-minute timeout immediately");
    
    toast({
      variant: "destructive",
      title: "DEMO: Payment Timeout",
      description: "Simulating timeout - Amount added to dues",
    });
    
    // Open the gate immediately instead of waiting 3 minutes
    operateExitGate();
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">SmartPark Barrier Gates</h1>
      <p className="text-center mb-8 text-muted-foreground">
        {currentUserId 
          ? `Currently monitoring gates for user ID: ${currentUserId}` 
          : "No user selected"}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Gate Simulation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-10">
              <div className="h-40 border border-dashed border-gray-300 rounded-lg p-4 relative">
                <div className="text-lg font-medium mb-2">Entry Gate</div>
                
                <div className="absolute left-4 top-16 h-16 w-4 bg-gray-700 rounded-md">
                  <div 
                    className={`absolute left-4 top-1 bg-red-500 ${getBarrierStyle(entryGateStatus)}`}
                  >
                    <div className="absolute top-0 right-4 h-10 w-4 bg-gray-200 dark:bg-gray-600"></div>
                  </div>
                </div>
                
                <div className="absolute left-4 right-4 bottom-8 flex justify-between">
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                </div>
                
                <div className="absolute right-4 top-4 flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${
                    entryGateStatus === "closed" ? "bg-red-500" : 
                    entryGateStatus === "open" ? "bg-green-500" : "bg-yellow-500"
                  }`}></div>
                  <span className="text-sm capitalize">{entryGateStatus}</span>
                </div>
              </div>
              
              <div className="h-40 border border-dashed border-gray-300 rounded-lg p-4 relative">
                <div className="text-lg font-medium mb-2">Exit Gate</div>
                
                <div className="absolute left-4 top-16 h-16 w-4 bg-gray-700 rounded-md">
                  <div 
                    className={`absolute left-4 top-1 bg-red-500 ${getBarrierStyle(exitGateStatus)}`}
                  >
                    <div className="absolute top-0 right-4 h-10 w-4 bg-gray-200 dark:bg-gray-600"></div>
                  </div>
                </div>
                
                <div className="absolute left-4 right-4 bottom-8 flex justify-between">
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                  <div className="h-1 w-8 bg-yellow-400"></div>
                </div>
                
                <div className="absolute right-4 top-4 flex items-center space-x-2">
                  <div className={`h-3 w-3 rounded-full ${
                    exitGateStatus === "closed" ? "bg-red-500" : 
                    exitGateStatus === "open" ? "bg-green-500" : "bg-yellow-500"
                  }`}></div>
                  <span className="text-sm capitalize">{exitGateStatus}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 mb-2">
              <h3 className="text-sm font-semibold mb-2">Entry Kiosk Simulation</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={testEntryGate}
                  className="py-2 px-3 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 rounded-md text-green-700 dark:text-green-300 text-sm flex items-center justify-center"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Simulate Valid QR Scan
                </button>
                
                <button 
                  onClick={testEntryDenied}
                  className="py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center justify-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Simulate Invalid QR
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Exit Kiosk Simulation</h3>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={testExitGate}
                  className="py-2 px-3 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 rounded-md text-green-700 dark:text-green-300 text-sm flex items-center justify-center"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Simulate Valid QR + Immediate Payment
                </button>
                
                <button 
                  onClick={testExitPaymentRequired}
                  className="py-2 px-3 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900 dark:hover:bg-yellow-800 rounded-md text-yellow-700 dark:text-yellow-300 text-sm flex items-center justify-center"
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Simulate QR + Payment Required (3min timer)
                </button>
                
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button 
                    onClick={simulatePaymentComplete}
                    className="py-2 px-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 rounded-md text-blue-700 dark:text-blue-300 text-sm flex items-center justify-center"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Complete Payment
                  </button>
                  
                  <button 
                    onClick={simulateTimeoutForDemo}
                    className="py-2 px-3 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center justify-center"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Demo: Simulate Timeout
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Gate Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={eventLogRef}
              className="h-[400px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-black/5 dark:bg-white/5"
            >
              {events.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No events yet
                </div>
              ) : (
                <div className="space-y-2">
                  {events.map((event, i) => (
                    <div 
                      key={i} 
                      className={`p-2 rounded-md text-sm flex items-start ${
                        event.type === "error" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300" : 
                        event.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" :
                        event.type === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" :
                        event.type === "request" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 font-mono">
                        {event.time}
                      </span>
                      <span>{event.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BarrierGates;
