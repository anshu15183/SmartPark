import { useState, useEffect, useRef } from 'react';
import QrScanner from 'qr-scanner';
import { AlertTriangle, Loader, CheckCircle } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-mobile';

// Keep screen awake
let wakeLock: any = null;

export interface QRScannerProps {
  onScan: (result: string) => void;
  isActive?: boolean;
}

const QRScanner = ({ onScan, isActive = true }: QRScannerProps) => {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(isActive);
  const [scanSuccess, setScanSuccess] = useState(false);
  const { isMobile } = useBreakpoint();

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      startScanner();
      requestWakeLock();
    }

    return () => {
      stopScanner();
      releaseWakeLock();
    };
  }, [isActive]);

  // Request to keep screen awake
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        // @ts-ignore
        wakeLock = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.error('WakeLock error:', err);
    }
  };

  const releaseWakeLock = async () => {
    try {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch (err) {
      console.error('WakeLock release error:', err);
    }
  };

const startScanner = async () => {
  if (!videoRef.current) return;

  try {
    // Step 1: Get devices
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    let selectedDeviceId: string | undefined;

    if (isMobile) {
      // Try to find a device labeled as front/selfie
      const frontCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('front') || 
        device.label.toLowerCase().includes('selfie')
      );
      selectedDeviceId = frontCamera?.deviceId || videoDevices[0]?.deviceId;
    } else {
      selectedDeviceId = videoDevices[0]?.deviceId;
    }

    if (!selectedDeviceId) {
      throw new Error("No camera device found");
    }

    const constraints: MediaStreamConstraints = {
      video: { deviceId: { exact: selectedDeviceId }, focusMode: "continuous" }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (scannerRef.current) {
      scannerRef.current.destroy();
    }

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        console.log('QR code detected:', result.data);

        setScanSuccess(true);
        stopScanner();
        onScan(result.data);

        restartTimeoutRef.current = setTimeout(() => {
          setScanSuccess(false);
          startScanner();
        }, 5000);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        preferredCamera: isMobile ? 'user' : 'environment',
      }
    );

    videoRef.current.srcObject = stream; 
    await qrScanner.start();
    scannerRef.current = qrScanner;
    setScanning(true);
    setError(null);
  } catch (err) {
    console.error('Scanner start error:', err);
    setError(
      err instanceof Error
        ? err.message
        : 'Unable to access camera. Please ensure camera permissions are enabled.'
    );
    setScanning(false);

    restartTimeoutRef.current = setTimeout(() => {
      setError(null);
      startScanner();
    }, 5000);
  }
};


  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.destroy();
      scannerRef.current = null;
    }
    setScanning(false);
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
  };

  return (
    <div className="relative">
      {/* Scanner video */}
      <div className="relative overflow-hidden rounded-lg bg-black aspect-square w-full max-w-md mx-auto">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-2" />
            <p className="text-white">{error}</p>
          </div>
        ) : scanSuccess ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
            <CheckCircle className="h-16 w-16 text-green-500 animate-pulse" />
          </div>
        ) : null}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanner overlay */}
        {scanning && !error && !scanSuccess && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3/5 h-3/5 border-2 border-primary rounded-lg"></div>
            </div>
            <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
              <div className="bg-background/80 rounded-full p-1.5 backdrop-blur">
                <Loader className="h-5 w-5 text-primary animate-spin" />
              </div>
              <div className="bg-background/80 rounded-full p-2 backdrop-blur text-xs">
                Scanning...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;

