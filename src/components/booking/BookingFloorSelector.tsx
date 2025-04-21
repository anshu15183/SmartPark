
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, MapPin } from "lucide-react";
import { Floor } from "@/types/booking";

interface BookingFloorSelectorProps {
  floors: Floor[];
  selectedFloor: string;
  setSelectedFloor: (floorId: string) => void;
}

const BookingFloorSelector = ({ 
  floors, 
  selectedFloor, 
  setSelectedFloor 
}: BookingFloorSelectorProps) => {
  return (
    <Card className="glass-morphism">
      <CardHeader>
        <CardTitle className="text-xl">Select Parking Floor</CardTitle>
        <CardDescription>
          Choose where you want to park your vehicle
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {floors.length === 0 ? (
            <div className="p-6 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium">No Parking Available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                There are currently no active parking floors available.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {floors.map((floor) => {
                const hasAvailableSpots = floor.availableNormalSpots > 0;
                
                return (
                  <button
                    key={floor._id}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      !hasAvailableSpots 
                        ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                        : selectedFloor === floor._id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => hasAvailableSpots && setSelectedFloor(floor._id)}
                    disabled={!hasAvailableSpots}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium block">{floor.name}</span>
                        <span className="text-sm text-muted-foreground flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          Level {floor.level}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`block text-sm ${hasAvailableSpots ? 'text-primary' : 'text-muted-foreground'} font-medium`}>
                          {floor.availableNormalSpots} spots
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingFloorSelector;
