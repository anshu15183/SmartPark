
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface BookingData {
  name: string;
  bookings: number;
}

interface WeeklyBookingsChartProps {
  data: BookingData[];
}

export const WeeklyBookingsChart = ({ data }: WeeklyBookingsChartProps) => {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Weekly Bookings</CardTitle>
        <CardDescription>Number of bookings per day</CardDescription>
      </CardHeader>
      <CardContent className="px-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [value, "Bookings"]}
                contentStyle={{ 
                  backgroundColor: "var(--background)",
                  borderColor: "var(--border)",
                  borderRadius: "4px",
                }}
              />
              <Bar dataKey="bookings" fill="#0284C7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
