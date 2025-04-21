
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell } from "recharts";

interface AvailableSpotsCardProps {
  totalSpots: number;
  spotsFilled: number;
  freeFloors: boolean;
}

export const AvailableSpotsCard = ({ totalSpots, spotsFilled, freeFloors }: AvailableSpotsCardProps) => {
  const formatTotalSpots = () => {
    if (freeFloors) {
      return "∞";
    } else {
      return totalSpots.toString();
    }
  };

  const spotUtilization = totalSpots > 0 
    ? Math.round((spotsFilled / totalSpots) * 100) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Spots</CardTitle>
        <CardDescription>Total parking capacity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid place-items-center py-4">
          <div className="text-5xl font-bold text-center mb-6">
            {formatTotalSpots()}
            {freeFloors && (
              <div className="text-base font-normal text-muted-foreground mt-2">
                Unlimited Capacity
              </div>
            )}
          </div>
          
          <div className="w-full max-w-[220px]">
            <div className="flex justify-between text-sm mb-1">
              <span>Occupied</span>
              <span>{spotsFilled}</span>
            </div>
            
            <div className="h-2.5 w-full bg-muted rounded-full mb-4">
              <div 
                className="h-2.5 bg-primary rounded-full" 
                style={{ width: `${freeFloors ? '0' : spotUtilization}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              {freeFloors ? (
                "Floors with unlimited capacity available"
              ) : (
                `${spotsFilled} of ${totalSpots} spots filled`
              )}
            </div>
          </div>
        </div>
        
        {!freeFloors && (
          <div className="mt-6">
            <PieChart width={250} height={100} style={{margin: 'auto'}}>
              <Pie
                data={[
                  { name: 'Filled', value: spotsFilled },
                  { name: 'Available', value: totalSpots - spotsFilled }
                ]}
                cx="50%"
                cy="50%"
                startAngle={180}
                endAngle={0}
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                <Cell fill="#0284C7" />
                <Cell fill="#E5E7EB" />
              </Pie>
            </PieChart>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
