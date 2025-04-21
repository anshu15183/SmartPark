
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader, X, Clock } from "lucide-react";
import { api } from "@/lib/axios";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Booking {
  _id: string;
  floor: {
    name: string;
    price: number;
  };
  startTime: string | null;
  entryTime: string | null;
  exitTime: string | null;
  expectedExitTime: string | null;
  status: string;
  createdAt: string;
}

interface ActiveBookingCardProps {
  booking: Booking;
  onRefresh: () => void;
}

export const ActiveBookingCard = ({ booking, onRefresh }: ActiveBookingCardProps) => {
  const [extendingBooking, setExtendingBooking] = useState(false);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not set";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  const handleExtendBooking = async () => {
    setExtendingBooking(true);
    try {
      const response = await api.post(`/booking/${booking._id}/extend`);
      
      if (response.data.success) {
        toast({
          title: "Booking Extended",
          description: "Your parking duration has been successfully extended by 1 hour.",
        });
        
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error extending booking:", error);
      toast({
        variant: "destructive",
        title: "Extension Failed",
        description: error.response?.data?.message || "Failed to extend booking. Please try again.",
      });
    } finally {
      setExtendingBooking(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancellingBooking(true);
    try {
      const response = await api.post(`/booking/${booking._id}/cancel`);
      
      if (response.data.success) {
        toast({
          title: "Booking Cancelled",
          description: "Your booking has been successfully cancelled.",
        });
        
        onRefresh();
      }
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.response?.data?.message || "Failed to cancel booking. Please try again.",
      });
    } finally {
      setIsCancellingBooking(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <h3 className="text-xl font-medium mb-2">
          {booking.floor?.name || "Unknown Floor"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Start:</span>{" "}
            {formatDate(booking.entryTime || booking.createdAt)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">End:</span>{" "}
            {formatDate(booking.exitTime)}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Created:</span>{" "}
            {formatDate(booking.createdAt)}
          </p>
          <div className="text-gray-600 dark:text-gray-400">
            <span className="font-medium">Status:</span>{" "}
            <span className="inline-flex ml-1">
              <Badge variant="secondary">
                {booking.status}
              </Badge>
            </span>
          </div>
          {booking.expectedExitTime && booking.status === "active" && (
            <p className="text-gray-600 dark:text-gray-400 col-span-2">
              <span className="font-medium">Expected Exit:</span>{" "}
              <span className="inline-flex items-center">
                <Clock className="h-4 w-4 mr-1 text-amber-500" />
                {formatDate(booking.expectedExitTime)}
              </span>
            </p>
          )}
        </div>
        
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={() => navigate("/qrcode/booking")}
            variant="outline"
          >
            View QR Code
          </Button>
          
          {booking.status === "pending" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>No, Keep Booking</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelBooking}
                    disabled={isCancellingBooking}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {isCancellingBooking ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin mr-2" />
                        Cancelling...
                      </>
                    ) : (
                      "Yes, Cancel Booking"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {booking.status === "active" && (
            <Button
              onClick={handleExtendBooking}
              disabled={extendingBooking}
            >
              {extendingBooking ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Extending...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Extend by 1 Hour
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
