
import { Button } from "@/components/ui/button";
import { QrCodeIcon, Camera, Loader } from "lucide-react";
import QRScanner from "@/components/QRScanner";

interface QRScannerContainerProps {
  scanning: boolean;
  loading: boolean;
  startScanning: () => void;
  cancelScanning: () => void;
  onScan: (code: string) => void;
  processingMessage?: string;
}

export const QRScannerContainer = ({ 
  scanning, 
  loading, 
  startScanning, 
  cancelScanning,
  onScan,
  processingMessage = "Processing QR code..."
}: QRScannerContainerProps) => {
  return (
    <div className="glass-morphism rounded-xl p-4 max-w-md w-full shadow-xl animate-fade-in flex flex-col">
      <div className="text-center mb-3">
        <QrCodeIcon className="h-8 w-8 md:h-12 md:w-12 text-primary mx-auto mb-1" />
        <h2 className="text-lg md:text-xl font-display font-bold">
          {scanning ? "Scanning QR Code" : "QR Code Scanner"}
        </h2>
        <p className="text-muted-foreground mt-1 text-xs md:text-sm">
          {loading ? processingMessage : (scanning ? "Position the QR code in the scanner" : "Scan your QR code")}
        </p>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="h-8 w-8 md:h-10 md:w-10 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground text-sm">{processingMessage}</p>
        </div>
      ) : scanning ? (
        <div className="flex-1 flex flex-col">
          <QRScanner 
            isActive={scanning}
            onScan={onScan}
            onCancel={cancelScanning}
          />
        </div>
      ) : (
        <Button
          onClick={startScanning}
          className="w-full py-6 flex items-center justify-center space-x-2 mt-2 text-lg"
          size="lg"
        >
          <Camera className="h-6 w-6" />
          <span>Scan QR Code</span>
        </Button>
      )}
    </div>
  );
};
