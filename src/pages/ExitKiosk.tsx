
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios, { isAxiosError } from "@/lib/axios";
import { KioskLayout } from "@/components/kiosk/KioskLayout";
import { QRScannerContainer } from "@/components/kiosk/QRScannerContainer";
import { ScanResultCard } from "@/components/kiosk/ScanResultCard";
import { ServerConnectionAlert } from "@/components/kiosk/ServerConnectionAlert";
import { useGateSimulation } from "@/hooks/useGateSimulation";

interface ScanResult {
  success: boolean;
  message: string;
  requiresPayment?: boolean;
  data?: {
    bookingId?: string;
    userName?: string;
    entryTime?: string;
    exitTime?: string;
    duration?: number;
    amount?: number;
    paymentMethod?: string;
    walletBalance?: number;
    shortfall?: number;
    paymentQRCode?: string;
    isSpecialPass?: boolean;
  };
}

const ExitKiosk = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [paymentTimer, setPaymentTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { operateGate } = useGateSimulation();
  
  useEffect(() => {
    checkServerConnection();
    
    // Cleanup timer on component unmount
    return () => {
      if (paymentTimer) {
        clearTimeout(paymentTimer);
      }
    };
  }, []);
  
  // Set up a timer when payment is required
  useEffect(() => {
    if (processingResult?.requiresPayment && !paymentProcessing) {
      // Clear any existing timer
      if (paymentTimer) {
        clearTimeout(paymentTimer);
      }
      
      // Set a new 3-minute timer
      const timer = setTimeout(() => {
        toast({
          title: "Payment Time Exceeded",
          description: "Automatically adding to dues and opening gate...",
        });
        
        // Auto-handle as "add to dues"
        handlePaymentComplete('due');
      }, 3 * 60 * 1000); // 3 minutes
      
      setPaymentTimer(timer);
    } else if (paymentTimer) {
      // Clear timer if payment is complete
      clearTimeout(paymentTimer);
      setPaymentTimer(null);
    }
    
    return () => {
      if (paymentTimer) {
        clearTimeout(paymentTimer);
      }
    };
  }, [processingResult, paymentProcessing]);
  
  const checkServerConnection = async () => {
    try {
      const response = await axios.get("/health");
      // console.log('Server health check response:', response.data);
      setServerConnected(true);
    } catch (error) {
      // console.error("Backend server connection failed:", error);
      setServerConnected(false);
      
      toast({
        variant: "destructive",
        title: "Server Connection Failed",
        description: "Could not connect to backend server. Running in offline mode.",
      });
    }
  };
  
  const startScanning = () => {
    setScanning(true);
    setScannedCode(null);
    setProcessingResult(null);
  };

  const processScannedCode = async (code: string) => {
    setScannedCode(code);
    setLoading(true);
    
    try {
      // console.log("Processing QR code:", code);
      
      let qrData;
      try {
        qrData = typeof code === 'string' ? JSON.parse(code) : code;
      } catch (e) {
        qrData = { type: 'booking', id: code };
        // console.log("Could not parse QR code, using as raw ID:", qrData);
      }
      
      const postData = {
        qrCode: typeof qrData === 'object' ? JSON.stringify(qrData) : qrData
      };
      
      // console.log("Sending to API:", postData);
      
      const response = await axios.post("/kiosk/exit-scan", postData);
      
      // console.log("API Response:", response.data);
      
      const data = response.data;
      
      setProcessingResult({
        success: true,
        message: data.message || "Exit processing successful",
        requiresPayment: data.requiresPayment,
        data: data.data,
      });
      
      if (data.success && !data.requiresPayment) {
        toast({
          title: "Exit Authorized",
          description: "Barrier opening...",
        });
        
        // console.log("Sending signal to open exit barrier");
        
        // Operate the exit gate
        operateGate('exit', data.data?.userName || 'User');
      }
    } catch (error) {
      // console.error("Error processing QR code:", error);
      
      let errorMessage = "An error occurred while processing the QR code";
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          errorMessage = "Booking not found. Please ensure you have an active booking.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.code === 'ERR_NETWORK') {
          errorMessage = "Network error - Cannot connect to the server. Make sure the server is running.";
        }
      }
      
      setProcessingResult({
        success: false,
        message: errorMessage,
      });
      
      toast({
        variant: "destructive",
        title: "Exit Denied",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const completeExit = async (status: 'paid' | 'due', paymentMethod: 'upi' | 'due') => {
    if (!processingResult?.data?.bookingId) return;
    
    setPaymentProcessing(true);
    
    try {
      const response = await axios.post('/kiosk/complete-exit', {
        bookingId: processingResult.data.bookingId,
        paymentMethod,
        paymentStatus: status
      });
      
      if (response.data.success) {
        toast({
          title: "Exit Approved",
          description: status === 'paid' 
            ? "Payment successful. Barrier opening..." 
            : "Amount added to dues. Barrier opening...",
        });
        
        setProcessingResult({
          success: true,
          message: status === 'paid' 
            ? "Payment successful. You may exit now." 
            : "Payment added to dues. You may exit now.",
          data: {
            ...processingResult.data,
            paymentMethod,
          }
        });
        
        // console.log("Sending signal to open exit barrier");
        
        // Operate the exit gate
        operateGate('exit', processingResult.data?.userName || 'User');
      }
    } catch (error) {
      // console.error("Error completing exit:", error);
      
      let errorMessage = "Failed to process payment";
      if (isAxiosError(error)) {
        if (error.response?.status === 404) {
          errorMessage = "Payment API endpoint not found. Please ensure the backend server is running correctly.";
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: errorMessage,
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePaymentComplete = (status: 'paid' | 'due') => {
    // Clear the timer when payment is handled
    if (paymentTimer) {
      clearTimeout(paymentTimer);
      setPaymentTimer(null);
    }
    
    completeExit(status, status === 'paid' ? 'upi' : 'due');
  };

  const resetKiosk = () => {
    // Clear the timer when resetting
    if (paymentTimer) {
      clearTimeout(paymentTimer);
      setPaymentTimer(null);
    }
    
    setScannedCode(null);
    setProcessingResult(null);
    setScanning(false);
  };

  return (
    <KioskLayout 
      title="SmartPark Exit Kiosk" 
      serverConnected={serverConnected}
      apiBaseUrl={axios.defaults.baseURL}
    >
      {serverConnected === false && <ServerConnectionAlert apiBaseUrl={axios.defaults.baseURL} />}
      
      {processingResult ? (
        <ScanResultCard
          result={processingResult}
          onReset={resetKiosk}
          isEntry={false}
          onPaymentComplete={handlePaymentComplete}
          paymentProcessing={paymentProcessing}
        />
      ) : (
        <QRScannerContainer
          scanning={scanning}
          loading={loading}
          startScanning={startScanning}
          cancelScanning={resetKiosk}
          onScan={processScannedCode}
          processingMessage="Processing QR code..."
        />
      )}
    </KioskLayout>
  );
};

export default ExitKiosk;
