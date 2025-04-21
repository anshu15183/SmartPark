
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios, { isAxiosError } from "@/lib/axios";
import { KioskLayout } from "@/components/kiosk/KioskLayout";
import { QRScannerContainer } from "@/components/kiosk/QRScannerContainer";
import { ScanResultCard } from "@/components/kiosk/ScanResultCard";
import { useGateSimulation } from "@/hooks/useGateSimulation";

interface ScanResult {
  success: boolean;
  message: string;
  data?: {
    userName?: string;
    floor?: string;
    spotNumber?: string;
    bookingTime?: string;
    isSpecialPass?: boolean;
  };
}

const EntryKiosk = () => {
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [processingResult, setProcessingResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const { toast } = useToast();
  const { operateGate } = useGateSimulation();
  
  useEffect(() => {
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
          description: "Could not connect to backend server. Check server logs.",
        });
      }
    };
    
    checkServerConnection();
    // console.log(`API Base URL: ${axios.defaults.baseURL}`);
  }, [toast]);
  
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
        
        if (!qrData.type) {
          if (qrData.userId || qrData.id) {
            qrData = {
              type: 'user',
              userId: qrData.userId || qrData.id
            };
            // console.log("Fixed user QR format:", qrData);
          } else if (qrData.bookingId) {
            qrData = {
              type: 'booking',
              bookingId: qrData.bookingId
            };
            // console.log("Fixed booking QR format:", qrData);
          } else {
            // console.log("Invalid QR code, no recognizable fields:", qrData);
            throw new Error("Invalid QR format");
          }
        }
        
        if (qrData.type === "user") {
          qrData = {
            type: "user",
            userId: qrData.userId || qrData.id
          };
        } else if (qrData.type === "booking") {
          qrData = {
            type: "booking",
            bookingId: qrData.bookingId || qrData.id
          };
        }
        
      } catch (e) {
        qrData = { type: 'booking', bookingId: code };
        // console.log("Could not parse QR code, using as raw booking ID:", qrData);
      }
      
      const postData = {
        qrCode: typeof qrData === 'object' ? JSON.stringify(qrData) : qrData
      };
      
      // console.log("Sending to API:", postData);
      
      const response = await axios.post("/kiosk/entry-scan", postData);
      
      // console.log("API Response:", response.data);
      
      const data = response.data;
      
      setProcessingResult({
        success: true,
        message: data.message || "Entry successful",
        data: data.data,
      });
      
      if (data.success) {
        toast({
          title: "Entry Authorized",
          description: "Barrier opening...",
        });
        
        // console.log("Sending signal to open entry barrier");
        
        // Operate the entry gate
        operateGate('entry', data.data?.userName || 'User');
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
        title: "Entry Denied",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetKiosk = () => {
    setScannedCode(null);
    setProcessingResult(null);
    setScanning(false);
  };

  return (
    <KioskLayout 
      title="SmartPark Entry Kiosk" 
      serverConnected={serverConnected}
      apiBaseUrl={axios.defaults.baseURL}
    >
      {processingResult ? (
        <ScanResultCard
          result={processingResult}
          onReset={resetKiosk}
          isEntry={true}
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

export default EntryKiosk;
