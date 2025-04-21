
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface QuickStatsCardProps {
  title: string;
  description: string;
  stats: {
    label1: string;
    value1: string | number;
    label2: string;
    value2: string | number;
  };
  buttonText: string;
  navigateTo: string;
}

export const QuickStatsCard = ({ 
  title, 
  description, 
  stats, 
  buttonText, 
  navigateTo 
}: QuickStatsCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-muted-foreground">{stats.label1}</dt>
            <dd className="text-2xl font-bold">{stats.value1}</dd>
          </div>
          <div>
            <dt className="font-medium text-muted-foreground">{stats.label2}</dt>
            <dd className="text-2xl font-bold">{stats.value2}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline"
          className="w-full"
          onClick={() => navigate(navigateTo)}
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
};
