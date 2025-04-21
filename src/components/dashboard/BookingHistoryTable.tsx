
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Booking {
  _id: string;
  floor: {
    name: string;
    price: number;
  };
  startTime: string | null;
  entryTime: string | null;
  exitTime: string | null;
  status: string;
  createdAt: string;
}

interface BookingHistoryTableProps {
  bookings: Booking[];
}

export const BookingHistoryTable = ({ bookings }: BookingHistoryTableProps) => {
  const navigate = useNavigate();

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

  if (bookings.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No booking history.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A list of your recent bookings.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">Floor</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>End Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking._id}>
              <TableCell className="font-medium">
                {booking.floor?.name || "Unknown Floor"}
              </TableCell>
              <TableCell>
                {formatDate(booking.startTime || booking.entryTime || booking.createdAt)}
              </TableCell>
              <TableCell>
                {formatDate(booking.exitTime)}
              </TableCell>
              <TableCell>
                <span className="inline-flex">
                  <Badge variant="secondary">{booking.status}</Badge>
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4}>
              <Button onClick={() => navigate("/profile")}>
                View All Bookings
              </Button>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
