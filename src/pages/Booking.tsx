
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import axios, { isAxiosError } from "@/lib/axios";
import { Floor } from "@/types/booking";

// Components
import BookingFloorSelector from "@/components/booking/BookingFloorSelector";
import ParkingInformation from "@/components/booking/ParkingInformation";
import ActiveBookingCard from "@/components/booking/ActiveBookingCard";
import { useActiveBooking } from "@/hooks/useActiveBooking";

const Booking = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { hasActiveBooking, checkingBooking } = useActiveBooking();
  
  const [floors, setFloors] = useState<Floor[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchFloors();
  }, []);
  
  const fetchFloors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/floor");
      
      if (response.data.success) {
        const activeFloors = response.data.floors.filter(
          (floor: Floor) => floor.isActive !== false
        );
        setFloors(activeFloors);
        
        // Select the first floor by default
        if (activeFloors.length > 0 && !selectedFloor) {
          setSelectedFloor(activeFloors[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching floors:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch available floors. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateBooking = async () => {
    if (!selectedFloor) {
      toast({
        variant: "destructive",
        title: "No Floor Selected",
        description: "Please select a parking floor.",
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await axios.post("/booking/create", {
        floorId: selectedFloor,
        spotType: "normal", // Only normal spots now
      });
      
      if (response.data.success) {
        toast({
          title: "Booking Successful",
          description: "Your parking spot has been booked successfully!",
        });
        
        // Redirect to QR code page
        navigate("/qrcode/booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      
      let errorMessage = "Failed to create booking. Please try again.";
      if (isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading || checkingBooking) {
    return (
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading available parking...</p>
        </div>
      </div>
    );
  }
  
  if (hasActiveBooking) {
    return (
      <main className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8">
        <div className="container mx-auto px-4 max-w-lg">
          <ActiveBookingCard />
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-8">Book a Parking Spot</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BookingFloorSelector 
            floors={floors} 
            selectedFloor={selectedFloor}
            setSelectedFloor={setSelectedFloor}
          />
          
          <ParkingInformation 
            selectedFloor={selectedFloor}
            submitting={submitting}
            floorsAvailable={floors.length > 0}
            onBookNow={handleCreateBooking}
          />
        </div>
        
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
};

export default Booking;
