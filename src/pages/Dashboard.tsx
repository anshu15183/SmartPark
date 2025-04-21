
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/axios";
import UserCard from "@/components/dashboard/UserCard";
import { WalletCard } from "@/components/dashboard/WalletCard";
import { DueAmountCard } from "@/components/dashboard/DueAmountCard";
import { ActiveBookingCard } from "@/components/dashboard/ActiveBookingCard";
import { BookingHistoryTable } from "@/components/dashboard/BookingHistoryTable";

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

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  wallet: number;
  role: string;
  isSpecialPass: boolean;
  dueAmount: number;
  createdAt: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/user/profile");
      setUser(response.data.user);
      
      if (response.data.activeBooking) {
        setActiveBooking(response.data.activeBooking);
      }
      
      if (response.data.bookingHistory && Array.isArray(response.data.bookingHistory)) {
        setBookingHistory(response.data.bookingHistory);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to fetch user profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UserCard user={user} isLoading={isLoading} />
        <WalletCard walletBalance={user?.wallet || 0} />
        <DueAmountCard dueAmount={user?.dueAmount || 0} />
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Active Booking</h2>
          <Button 
            onClick={() => navigate("/booking")}
            className="flex items-center gap-2"
          >
            <CalendarCheck className="h-4 w-4" />
            <span>New Booking</span>
          </Button>
        </div>
        
        {activeBooking ? (
          <ActiveBookingCard booking={activeBooking} onRefresh={fetchUserProfile} />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No active booking.</p>
        )}
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">Booking History</h2>
        <BookingHistoryTable bookings={bookingHistory} />
      </div>
    </div>
  );
};

export default Dashboard;
