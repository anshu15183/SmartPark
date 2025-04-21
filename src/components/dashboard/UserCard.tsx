
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, CreditCard, QrCode, MapPin, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "@/lib/axios";

interface UserCardProps {
  user?: any;
  isLoading?: boolean;
}

const UserCard = ({ user: dashboardUser, isLoading }: UserCardProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(isLoading !== undefined ? isLoading : true);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await axios.get('/user/profile');
        if (response.data.success) {
          setUserData(response.data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex justify-between items-center">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-16" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <Skeleton className="h-5 w-32 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-40 mx-auto sm:mx-0" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use the dashboardUser if provided, otherwise use the one from context
  const displayUser = dashboardUser || user;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex justify-between items-center">
          <span>Welcome Back!</span>
          <Link to="/profile">
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/10">
            <AvatarImage src={userData?.user?.avatar || ''} />
            <AvatarFallback className="text-lg">{displayUser?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h3 className="font-semibold text-lg">{displayUser?.name}</h3>
            <div className="flex flex-col sm:flex-row gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center justify-center sm:justify-start gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                <span>₹{userData?.user?.wallet || 0} in wallet</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center justify-center sm:justify-start gap-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Member since {displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</span>
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
              <Link to="/booking">
                <Button size="sm" variant="default">
                  <MapPin className="mr-1 h-4 w-4" />
                  Book Parking
                </Button>
              </Link>
              
              {/* Only show profile QR link for special pass holders */}
              {(userData?.user?.isSpecialPass || displayUser?.isSpecialPass) && (
                <Link to="/qrcode/user">
                  <Button size="sm" variant="outline">
                    <QrCode className="mr-1 h-4 w-4" />
                    Special Pass QR
                  </Button>
                </Link>
              )}
              
              {displayUser?.isSpecialPass && (
                <div className="flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full">
                  <UserCheck className="h-3 w-3" />
                  <span>Special Pass holder</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserCard;
