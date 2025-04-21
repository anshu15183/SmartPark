
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from "lucide-react";
import QRCodeDisplay from "@/components/QRCode";
import axios from "@/lib/axios";

const QRCodePage = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { type = "user" } = useParams();
  
  const [qrData, setQrData] = useState<string>("");
  const [qrTitle, setQrTitle] = useState<string>("Your QR Code");
  const [qrDescription, setQrDescription] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);
  const maxRetries = 2;
  
  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to view QR codes",
      });
      return;
    }
    
    fetchQRCode();
  }, [token, type, navigate, toast, user, retryCount]);
  
  const fetchQRCode = async () => {
    try {
      setLoading(true);
      
      let qrData = "";
      
      if (type === "user") {
        setQrTitle("Special Pass QR Code");
        setQrDescription("Use this QR code for special pass entry and exit");
        
        // Ensure user data is minimal and has the correct format for the server
        if (user?._id) {
          qrData = JSON.stringify({
            type: "user",       // This MUST come first to ensure proper parsing
            userId: user._id    // Use userId, not id
          });
        }
      } else if (type === "booking") {
        setQrTitle("Booking QR Code");
        setQrDescription("Scan this QR code at the entry kiosk");
        
        try {
          // This is a sequential approach to try multiple endpoints until we get booking data
          // First try the user/profile endpoint since it includes active booking
          let bookingFound = false;
          
          try {
            const profileResponse = await axios.get("/user/profile");
            
            if (profileResponse.data.success && profileResponse.data.activeBooking) {
              const booking = profileResponse.data.activeBooking;
              qrData = JSON.stringify({
                type: "booking",  // This MUST come first to ensure proper parsing
                bookingId: booking.bookingId || booking._id
              });
              bookingFound = true;
              console.log("Booking found in user profile");
            }
          } catch (error) {
            console.log("Could not get booking from profile, trying dedicated booking endpoints");
          }
          
          // If not found in profile, try the user/active-booking endpoint
          if (!bookingFound) {
            try {
              const userBookingResponse = await axios.get("/user/active-booking");
              
              if (userBookingResponse.data.success && userBookingResponse.data.booking) {
                const booking = userBookingResponse.data.booking;
                qrData = JSON.stringify({
                  type: "booking",  // This MUST come first to ensure proper parsing
                  bookingId: booking.bookingId || booking._id
                });
                bookingFound = true;
                console.log("Booking found in user/active-booking");
              }
            } catch (error) {
              console.log("Could not get booking from user/active-booking, trying next endpoint");
            }
          }
          
          // If still not found, try booking/active-booking endpoint
          if (!bookingFound) {
            try {
              const bookingResponse = await axios.get("/booking/active-booking");
              
              if (bookingResponse.data.success && bookingResponse.data.booking) {
                const booking = bookingResponse.data.booking;
                qrData = JSON.stringify({
                  type: "booking",  // This MUST come first to ensure proper parsing
                  bookingId: booking.bookingId || booking._id
                });
                bookingFound = true;
                console.log("Booking found in booking/active-booking");
              }
            } catch (error) {
              console.log("Could not get booking from booking/active-booking, trying next endpoint");
            }
          }
          
          // Lastly, try the booking/active endpoint as last resort
          if (!bookingFound) {
            try {
              const alternativeResponse = await axios.get("/booking/active");
              
              if (alternativeResponse.data.success && 
                  alternativeResponse.data.bookings && 
                  alternativeResponse.data.bookings.length > 0) {
                
                const booking = alternativeResponse.data.bookings[0];
                qrData = JSON.stringify({
                  type: "booking",  // This MUST come first to ensure proper parsing
                  bookingId: booking.bookingId || booking._id
                });
                bookingFound = true;
                console.log("Booking found in booking/active");
              }
            } catch (error) {
              console.log("Could not get booking from booking/active");
            }
          }
          
          // If we've tried all endpoints and still no booking, throw error
          if (!bookingFound) {
            // If we haven't exhausted our retry attempts, try again after a delay
            if (retryCount < maxRetries) {
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, 1000); // Retry after 1 second
              return;
            }
            
            throw new Error("No active booking found after multiple attempts");
          }
        } catch (error) {
          console.error("Error fetching booking:", error);
          navigate("/dashboard");
          toast({
            variant: "destructive",
            title: "No active booking",
            description: "You don't have an active booking",
          });
          return;
        }
      } else {
        navigate("/dashboard");
        toast({
          variant: "destructive", 
          title: "Invalid QR code type",
          description: "The requested QR code type is not valid",
        });
        return;
      }
      
      setQrData(qrData);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch QR code data",
      });
      
      // Generate a fallback QR code with proper format
      if (user && user._id) {
        const fallback = { type: "user", userId: user._id };  // Order matters! type must be first
        setQrData(JSON.stringify(fallback));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-12rem)] py-16 md:py-24 overflow-y-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md animate-fade-in">
        <div className="glass-morphism rounded-2xl p-8 shadow-xl text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold">{qrTitle}</h1>
            <p className="text-muted-foreground mt-2">{qrDescription}</p>
          </div>
          
          <div className="my-8 flex justify-center">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center bg-muted/30 rounded-lg">
                <RefreshCw className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : (
              <div className="p-4 bg-white rounded-lg shadow-inner">
                <QRCodeDisplay 
                  value={qrData} 
                  size={250} 
                  level="H" 
                  onRefresh={fetchQRCode}
                />
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default QRCodePage;
