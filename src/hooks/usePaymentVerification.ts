
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import axios from "@/lib/axios";

interface UsePaymentVerificationProps {
  bookingId?: string;
  onPaymentSuccess: (paymentMethod: string) => void;
}

export const usePaymentVerification = ({ bookingId, onPaymentSuccess }: UsePaymentVerificationProps) => {
  const [verificationInterval, setVerificationInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startVerification = () => {
    if (!bookingId) return;

    // Clear any existing interval
    if (verificationInterval) {
      clearInterval(verificationInterval);
    }

    // Set up a new verification interval
    const interval = setInterval(async () => {
      try {
        const verificationResponse = await axios.get(`/payment/check-status/booking/${bookingId}`);
        
        if (verificationResponse.data.success && verificationResponse.data.isPaid) {
          clearInterval(interval);
          setVerificationInterval(null);
          
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully. Barrier opening...",
          });
          
          onPaymentSuccess('upi');
        }
      } catch (error) {
        console.error("Payment verification error:", error);
      }
    }, 5000);
    
    setVerificationInterval(interval);
    return interval;
  };

  const stopVerification = () => {
    if (verificationInterval) {
      clearInterval(verificationInterval);
      setVerificationInterval(null);
    }
  };

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (verificationInterval) {
        clearInterval(verificationInterval);
      }
    };
  }, [verificationInterval]);

  return {
    verificationActive: !!verificationInterval,
    startVerification,
    stopVerification
  };
};
