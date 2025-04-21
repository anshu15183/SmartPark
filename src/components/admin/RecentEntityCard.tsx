
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";

interface RecentEntityCardProps {
  title: string;
  navigateTo: string;
  icon: ReactNode;
  children: ReactNode;
  emptyMessage?: string;
}

export const RecentEntityCard = ({ 
  title, 
  navigateTo, 
  icon,
  children,
  emptyMessage = "No recent items" 
}: RecentEntityCardProps) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate(navigateTo)}>
            <span className="text-xs">View All</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        {children}
      </CardContent>
    </Card>
  );
};
