
import { Car, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader } from "lucide-react";

interface ParkingInformationProps {
  selectedFloor: string;
  submitting: boolean;
  floorsAvailable: boolean;
  onBookNow: () => void;
}

const ParkingInformation = ({
  selectedFloor,
  submitting,
  floorsAvailable,
  onBookNow
}: ParkingInformationProps) => {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="text-xl">Parking Information</CardTitle>
        <CardDescription>
          Details about your parking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-lg border text-center transition-colors border-primary bg-primary/10 mb-4">
          <Car className="h-6 w-6 mx-auto mb-2" />
          <span className="font-medium block">Regular Parking</span>
          <span className="text-xs text-muted-foreground mt-1">
            Standard parking for all vehicles
          </span>
        </div>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center rounded-lg p-3 bg-muted/50">
            <Clock className="h-5 w-5 text-muted-foreground mr-3" />
            <div>
              <h4 className="text-sm font-medium">Booking Time Limit</h4>
              <p className="text-xs text-muted-foreground">
                You have 15 minutes to enter the parking after booking
              </p>
            </div>
          </div>
          
          <div className="flex items-center rounded-lg p-3 bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground mr-3" />
            <div>
              <h4 className="text-sm font-medium">Parking Information</h4>
              <p className="text-xs text-muted-foreground">
                Park in any available spot on your selected floor
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button
          onClick={onBookNow}
          className="w-full"
          disabled={!selectedFloor || submitting || !floorsAvailable}
        >
          {submitting ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Book Now"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ParkingInformation;
