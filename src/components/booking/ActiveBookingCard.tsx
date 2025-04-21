
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, Tag, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Booking } from "@/types/booking";

interface ActiveBookingCardProps {
  booking?: Booking;
}

const ActiveBookingCard = ({ booking }: ActiveBookingCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <AlertCircle className="text-amber-500" />
          <span>Active Booking Found</span>
        </CardTitle>
        <CardDescription>
          You already have an active booking in the system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {booking ? (
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Floor</div>
                <div className="text-lg">{booking.floor?.name || 'Not specified'}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Spot</div>
                <div className="text-lg">{booking.spotNumber || 'Not assigned'}</div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-medium">Expected Exit</div>
                <div className="text-lg">{booking.expectedExitTime ? 
                  new Date(booking.expectedExitTime).toLocaleString() : 
                  'Not specified'}</div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            You can only have one active booking at a time. Please check your dashboard
            to view your current booking details.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex gap-4 pt-2">
        <Button
          onClick={() => navigate("/dashboard")}
          className="flex-1"
        >
          Go to Dashboard
        </Button>
        <Button
          onClick={() => navigate("/qrcode/booking")}
          variant="outline"
          className="flex-1"
        >
          View QR Code
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ActiveBookingCard;
