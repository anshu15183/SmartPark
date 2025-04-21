import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  CreditCard,
  ParkingSquare,
  CircleAlert,
  SaveIcon,
} from "lucide-react";
import axios from "@/lib/axios";
import { NavigationButtons } from "@/components/admin/NavigationButtons";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { AvailableSpotsCard } from "@/components/admin/AvailableSpotsCard";
import { WeeklyBookingsChart } from "@/components/admin/WeeklyBookingsChart";
import { RecentUsers } from "@/components/admin/RecentUsers";
import { RecentEntityCard } from "@/components/admin/RecentEntityCard";
import { QuickStatsCard } from "@/components/admin/QuickStatsCard";
import { TransactionSummary } from "@/components/admin/TransactionSummary";
import { Ticket, Clock } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Button } from "@/components/ui/button";

interface AdminStatsData {
  userCount: number;
  staffCount: number;
  activeBookings: number;
  totalAmount: number;
  totalSpots: number;
  spotsFilled: number;
  totalDefaulters: number;
  defaultersAmount: number;
  freeFloors: boolean;
}

interface TransactionStats {
  today: number;
  week: number;
  month: number;
  total: number;
  todayAmount: number;
  weekAmount: number;
  monthAmount: number;
  totalAmount: number;
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentBooking {
  _id: string;
  bookingId: string;
  spotNumber: string;
  status: string;
  floor: {
    name: string;
  };
  user: {
    name: string;
  };
  createdAt: string;
}

interface RecentTransaction {
  _id: string;
  amount: number;
  type: string;
  user: {
    name: string;
  } | null;
  createdAt: string;
}

interface ChartDataPoint {
  name: string;
  value: number;
}

interface DashboardSection {
  id: string;
  content: React.ReactNode;
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AdminStatsData>({
    userCount: 0,
    staffCount: 0,
    activeBookings: 0,
    totalAmount: 0,
    totalSpots: 0,
    spotsFilled: 0,
    totalDefaulters: 0,
    defaultersAmount: 0,
    freeFloors: false
  });
  
  const [transactionStats, setTransactionStats] = useState<TransactionStats>({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
    todayAmount: 0,
    weekAmount: 0,
    monthAmount: 0,
    totalAmount: 0
  });
  
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [revenueData, setRevenueData] = useState<{name: string, revenue: number}[]>([]);
  const [weeklyBookingData, setWeeklyBookingData] = useState<{name: string, bookings: number}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const savedLayout = localStorage.getItem('adminDashboardLayout');
  const defaultLayout = {
    row1: ["stats1", "stats2", "stats3", "stats4"],
    row2: ["revenueChart", "availableSpots", "transactionSummary"],
    row3: ["weeklyBookings", "recentUsers", "recentBookings"],
    row4: ["recentTransactions", "quickStatsBooking", "quickStatsDefaulters"]
  };
  
  const [layout, setLayout] = useState(savedLayout ? JSON.parse(savedLayout) : defaultLayout);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await axios.get('/admin/dashboard-stats');
      
      if (statsResponse.data.success) {
        const dashboardData = statsResponse.data.data;
        setStats({
          userCount: dashboardData.totalUsers || 0,
          staffCount: dashboardData.staffCount || 0,
          activeBookings: dashboardData.activeBookings || 0,
          totalAmount: dashboardData.totalRevenue || 0,
          totalSpots: dashboardData.availableSpots || 0,
          spotsFilled: dashboardData.spotsFilled || 0,
          totalDefaulters: dashboardData.totalDefaulters || 0,
          defaultersAmount: dashboardData.defaultersAmount || 0,
          freeFloors: dashboardData.freeFloors || false
        });
      }
      
      const transactionStatsResponse = await axios.get('/admin/transaction-stats');
      if (transactionStatsResponse.data.success) {
        setTransactionStats(transactionStatsResponse.data.data);
      }
      
      const recentUsersResponse = await axios.get('/admin/recent-users');
      if (recentUsersResponse.data.success) {
        setRecentUsers(recentUsersResponse.data.users);
      }
      
      const recentBookingsResponse = await axios.get('/admin/recent-bookings');
      if (recentBookingsResponse.data.success) {
        setRecentBookings(recentBookingsResponse.data.bookings);
      }
      
      const recentTransactionsResponse = await axios.get('/admin/recent-transactions');
      if (recentTransactionsResponse.data.success) {
        setRecentTransactions(recentTransactionsResponse.data.transactions);
      }
      
      const revenueChartResponse = await axios.get('/admin/revenue-chart');
      if (revenueChartResponse.data.success) {
        setRevenueData(revenueChartResponse.data.data);
      }
      
      const weeklyBookingResponse = await axios.get('/admin/weekly-bookings');
      if (weeklyBookingResponse.data.success) {
        setWeeklyBookingData(weeklyBookingResponse.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const transactionTypeToColor = (type: string) => {
    const colors = {
      'deposit': 'text-green-600',
      'payment': 'text-blue-600',
      'refund': 'text-purple-600',
      'wallet_credit': 'text-emerald-600',
      'wallet_debit': 'text-orange-600',
      'fine': 'text-red-600',
      'due_clearance': 'text-amber-600',
      'global_transfer': 'text-indigo-600',
      'system': 'text-gray-600'
    };
    
    return colors[type as keyof typeof colors] || 'text-gray-600';
  };
  
  const renderComponent = (id: string) => {
    switch (id) {
      case 'stats1':
        return (
          <StatCard 
            title="Total Users" 
            value={stats.userCount}
            icon={<Users className="h-6 w-6 text-primary/80" />}
            subtitle={`Including ${stats.staffCount} staff members`}
          />
        );
      case 'stats2':
        return (
          <StatCard 
            title="Active Bookings" 
            value={stats.activeBookings}
            icon={<ParkingSquare className="h-6 w-6 text-primary/80" />}
            subtitle={`Current occupancy rate: ${stats.totalSpots > 0 ? Math.round((stats.spotsFilled / stats.totalSpots) * 100) : 0}%`}
          />
        );
      case 'stats3':
        return (
          <StatCard 
            title="Transactions" 
            value={formatCurrency(stats.totalAmount)}
            icon={<CreditCard className="h-6 w-6 text-primary/80" />}
            subtitle={`${transactionStats.today} transactions today`}
          />
        );
      case 'stats4':
        return (
          <StatCard 
            title="Defaulters" 
            value={stats.totalDefaulters}
            icon={<CircleAlert className="h-6 w-6 text-primary/80" />}
            subtitle={`Total dues: ${formatCurrency(stats.defaultersAmount)}`}
          />
        );
      case 'revenueChart':
        return <RevenueChart data={revenueData} />;
      case 'availableSpots':
        return (
          <AvailableSpotsCard 
            totalSpots={stats.totalSpots} 
            spotsFilled={stats.spotsFilled} 
            freeFloors={stats.freeFloors} 
          />
        );
      case 'transactionSummary':
        return (
          <TransactionSummary 
            stats={{
              today: transactionStats.today,
              week: transactionStats.week,
              month: transactionStats.month,
              total: transactionStats.total,
              todayAmount: transactionStats.todayAmount,
              weekAmount: transactionStats.weekAmount,
              monthAmount: transactionStats.monthAmount,
              totalAmount: transactionStats.totalAmount,
              totalDefaulters: stats.totalDefaulters,
              defaultersAmount: stats.defaultersAmount
            }}
          />
        );
      case 'weeklyBookings':
        return <WeeklyBookingsChart data={weeklyBookingData} />;
      case 'recentUsers':
        return <RecentUsers users={recentUsers} />;
      case 'recentBookings':
        return (
          <RecentEntityCard
            title="Recent Bookings"
            navigateTo="/admin/bookings"
            icon={<Ticket />}
            emptyMessage="No recent bookings"
          >
            <ul className="space-y-4">
              {recentBookings.map(booking => (
                <li key={booking._id} className="flex items-start gap-4 px-4">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <Ticket className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{booking.bookingId}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        booking.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{booking.floor.name} - Spot {booking.spotNumber}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(booking.createdAt)} {formatTime(booking.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
              
              {recentBookings.length === 0 && (
                <li className="py-4 text-center text-muted-foreground">
                  No recent bookings
                </li>
              )}
            </ul>
          </RecentEntityCard>
        );
      case 'recentTransactions':
        return (
          <RecentEntityCard
            title="Recent Transactions"
            navigateTo="/admin/payments"
            icon={<CreditCard />}
            emptyMessage="No recent transactions"
          >
            <ul className="space-y-4">
              {recentTransactions.map(transaction => (
                <li key={transaction._id} className="flex items-start gap-4 px-4">
                  <div className="rounded-full bg-primary/10 p-2 mt-1">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      <span className={transactionTypeToColor(transaction.type)}>₹{transaction.amount.toFixed(0)}</span> - {transaction.type.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.user ? transaction.user.name : 'System Transaction'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(transaction.createdAt)} {formatTime(transaction.createdAt)}</span>
                    </div>
                  </div>
                </li>
              ))}
              
              {recentTransactions.length === 0 && (
                <li className="py-4 text-center text-muted-foreground">
                  No recent transactions
                </li>
              )}
            </ul>
          </RecentEntityCard>
        );
      case 'quickStatsBooking':
        return (
          <QuickStatsCard
            title="Bookings"
            description="View and manage all parking bookings"
            stats={{
              label1: "Active Bookings",
              value1: stats.activeBookings || 0,
              label2: "Today's Bookings",
              value2: transactionStats.today || 0
            }}
            buttonText="View All Bookings"
            navigateTo="/admin/bookings"
          />
        );
      case 'quickStatsDefaulters':
        return (
          <QuickStatsCard
            title="Defaulters"
            description="Manage users with outstanding dues"
            stats={{
              label1: "Total Defaulters",
              value1: stats.totalDefaulters || 0,
              label2: "Total Due Amount",
              value2: `₹${stats.defaultersAmount || 0}`
            }}
            buttonText="Manage Defaulters"
            navigateTo="/admin/defaulters"
          />
        );
      default:
        return null;
    }
  };
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const sourceRowId = result.source.droppableId;
    const destinationRowId = result.destination.droppableId;
    
    const newLayout = { ...layout };
    
    const [movedItem] = newLayout[sourceRowId].splice(result.source.index, 1);
    
    newLayout[destinationRowId].splice(result.destination.index, 0, movedItem);
    
    setLayout(newLayout);
  };
  
  const saveLayout = async () => {
    try {
      setIsSaving(true);
      
      localStorage.setItem('adminDashboardLayout', JSON.stringify(layout));
      
      toast({
        title: "Layout saved",
        description: "Your dashboard layout has been saved successfully.",
      });
      
      setEditMode(false);
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save dashboard layout'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetLayout = () => {
    setLayout(defaultLayout);
    localStorage.removeItem('adminDashboardLayout');
    toast({
      title: "Layout reset",
      description: "Dashboard layout has been reset to default.",
    });
    setEditMode(false);
  };
  
  return (
    <div className="container px-4 mx-auto max-w-7xl py-10">
      <div className="flex flex-col gap-2 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={resetLayout} 
                  className="gap-2"
                  disabled={isSaving}
                >
                  Reset Layout
                </Button>
                <Button 
                  onClick={saveLayout} 
                  className="gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : (
                    <>
                      <SaveIcon className="h-4 w-4" />
                      Save Layout
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setEditMode(true)}
              >
                Customize Layout
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's what's happening in the system.
          {editMode && (
            <span className="ml-2 text-primary"> (Drag and drop cards to reorder them)</span>
          )}
        </p>
      </div>
      
      <NavigationButtons />
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="row1" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 ${editMode ? 'border-2 border-dashed border-primary/20 p-4 rounded-lg' : ''}`}
            >
              {layout.row1.map((id, index) => (
                <Draggable key={id} draggableId={id} index={index} isDragDisabled={!editMode}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${editMode ? 'cursor-move transform transition-transform duration-200 hover:scale-105' : ''}`}
                    >
                      {renderComponent(id)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        <Droppable droppableId="row2" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 ${editMode ? 'border-2 border-dashed border-primary/20 p-4 rounded-lg' : ''}`}
            >
              {layout.row2.map((id, index) => (
                <Draggable key={id} draggableId={id} index={index} isDragDisabled={!editMode}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${editMode ? 'cursor-move transform transition-transform duration-200 hover:scale-105' : ''}`}
                    >
                      {renderComponent(id)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        <Droppable droppableId="row3" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 ${editMode ? 'border-2 border-dashed border-primary/20 p-4 rounded-lg' : ''}`}
            >
              {layout.row3.map((id, index) => (
                <Draggable key={id} draggableId={id} index={index} isDragDisabled={!editMode}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${editMode ? 'cursor-move transform transition-transform duration-200 hover:scale-105' : ''}`}
                    >
                      {renderComponent(id)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        
        <Droppable droppableId="row4" direction="horizontal">
          {(provided) => (
            <div 
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${editMode ? 'border-2 border-dashed border-primary/20 p-4 rounded-lg' : ''}`}
            >
              {layout.row4.map((id, index) => (
                <Draggable key={id} draggableId={id} index={index} isDragDisabled={!editMode}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${editMode ? 'cursor-move transform transition-transform duration-200 hover:scale-105' : ''}`}
                    >
                      {renderComponent(id)}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default AdminDashboard;
