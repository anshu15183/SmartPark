
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, CalendarIcon } from "lucide-react";
import { DateRangePicker } from "@/components/DateRangePicker";
import axios from "@/lib/axios";
import { addDays, format } from "date-fns";

interface Booking {
  _id: string;
  bookingId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  floor: {
    _id: string;
    name: string;
  };
  spotType: string;
  spotNumber: string;
  status: string;
  entryTime: string | null;
  exitTime: string | null;
  expectedExitTime: string | null;
  actualAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  expiresAt: string;
}

const AdminBookings = () => {
  const { user: currentUser, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to?: Date;
  }>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate("/login");
      return;
    }

    fetchBookings();
  }, [currentUser, isAdmin, navigate, dateRange]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, statusFilter, bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (dateRange.from) {
        params.append('from', dateRange.from.toISOString());
      }
      if (dateRange.to) {
        params.append('to', dateRange.to.toISOString());
      }
      
      const response = await axios.get(`/booking/all?${params.toString()}`);

      if (response.data.success) {
        setBookings(response.data.bookings);
        setFilteredBookings(response.data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch bookings",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];
    
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }
    
    setFilteredBookings(filtered);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'active':
        return 'default';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'due':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Booking Management</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by booking ID or user"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading bookings...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell className="font-medium">{booking.bookingId}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{booking.user.name}</span>
                            <span className="text-xs text-muted-foreground">{booking.user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{booking.floor.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {booking.spotType === 'disability' ? 'Accessible' : 'Regular'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPaymentStatusBadgeVariant(booking.paymentStatus)}>
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.actualAmount > 0 ? `₹${booking.actualAmount}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookings;
