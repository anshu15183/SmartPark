
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import axios, { isAxiosError } from "@/lib/axios";

export const useActiveBooking = () => {
  const { toast } = useToast();
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [checkingBooking, setCheckingBooking] = useState(true);

  useEffect(() => {
    checkActiveBooking();
  }, []);

  const checkActiveBooking = async () => {
    try {
      setCheckingBooking(true);
      const response = await axios.get("/booking");
      
      if (response.data.success && response.data.booking) {
        setHasActiveBooking(true);
        
        toast({
          variant: "default",
          title: "Active Booking Found",
          description: "You already have an active booking.",
        });
      }
    } catch (error) {
      // If 404, no active booking (expected)
      if (isAxiosError(error) && error.response?.status === 404) {
        setHasActiveBooking(false);
        return;
      }
      
      // Also try the original endpoint as fallback
      try {
        const response = await axios.get("/booking/active");
        
        if (response.data.success && response.data.bookings && response.data.bookings.length > 0) {
          setHasActiveBooking(true);
          
          toast({
            variant: "default",
            title: "Active Booking Found",
            description: "You already have an active booking.",
          });
        }
      } catch (fallbackError) {
        // If still getting errors, just set no active booking
        setHasActiveBooking(false);
      }
      
      // Log any other error but don't show toast for this non-critical feature
      console.error("Error checking active booking:", error);
    } finally {
      setCheckingBooking(false);
    }
  };

  return {
    hasActiveBooking,
    checkingBooking,
    checkActiveBooking
  };
};
