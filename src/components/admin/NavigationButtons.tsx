
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Users, ParkingSquare, Ticket, BriefcaseBusiness } from "lucide-react";

export const NavigationButtons = () => {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Button 
        variant="outline" 
        className="flex items-center justify-start gap-2 h-16 text-lg" 
        onClick={() => navigate('/admin/users')}
      >
        <Users className="h-5 w-5" />
        <span>User Management</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center justify-start gap-2 h-16 text-lg" 
        onClick={() => navigate('/admin/floors')}
      >
        <ParkingSquare className="h-5 w-5" />
        <span>Floor Management</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center justify-start gap-2 h-16 text-lg" 
        onClick={() => navigate('/admin/special-passes')}
      >
        <Ticket className="h-5 w-5" />
        <span>Special Passes</span>
      </Button>
      
      <Button 
        variant="outline" 
        className="flex items-center justify-start gap-2 h-16 text-lg" 
        onClick={() => navigate('/admin/user-roles')}
      >
        <BriefcaseBusiness className="h-5 w-5" />
        <span>Staff Management</span>
      </Button>
    </div>
  );
};
