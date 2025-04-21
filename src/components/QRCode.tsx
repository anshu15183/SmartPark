import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  size?: number;
  level?: string;
  onRefresh?: () => void;
}

const QRCodeDisplay = ({ 
  value, 
  title = 'Your QR Code', 
  size = 300, 
  level = 'M',
  onRefresh
}: QRCodeDisplayProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (value) {
      loadQRCode();
    }
  }, [value]);

  const loadQRCode = async () => {
    if (!value) {
      setError('No data provided for QR code generation');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Keep data very minimal to prevent QR code size issues
      let qrData = typeof value === 'string' ? value : JSON.stringify(value);
      
      // If data is still an object, extract only essential info
      if (typeof qrData === 'object') {
        qrData = JSON.stringify({
          id: (value as any).id || (value as any)._id,
          type: (value as any).type || 'unknown'
        });
      }
      
      // If it's a string but looks like JSON, try to minimize
      if (typeof qrData === 'string' && qrData.startsWith('{') && qrData.length > 50) {
        try {
          const parsed = JSON.parse(qrData);
          qrData = JSON.stringify({
            id: parsed.id || parsed._id,
            type: parsed.type || 'unknown'
          });
        } catch (e) {
          // Not valid JSON, use as is but limit size
          if (qrData.length > 100) {
            qrData = qrData.substring(0, 100);
          }
        }
      }
      
      // Use a lower error correction level (L) for larger amounts of data
      const correctionLevel = qrData.length > 50 ? 'L' : level;
      
      const url = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: correctionLevel,
        margin: 1,
        width: size,
        scale: 4,
      });
      
      setQrCodeUrl(url);
      setIsLoading(false);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code. The data might be too large.');
      toast({
        variant: 'destructive',
        title: 'QR Code Error',
        description: 'Failed to generate QR code. The data might be too large.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[350px] mx-auto">
      <CardContent className="p-6">
        <div className="text-center">
          <h3 className="text-xl font-medium mb-4">{title}</h3>
          
          <div className="bg-white rounded-md p-4 flex items-center justify-center min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader className="h-8 w-8 animate-spin" />
                <p>Generating QR Code...</p>
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                <p>{error}</p>
              </div>
            ) : qrCodeUrl ? (
              <div>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-full max-w-[250px] h-auto"
                />
              </div>
            ) : (
              <div className="text-muted-foreground">No QR code data available</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;
