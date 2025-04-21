
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, BadgeDollarSign, AlertCircle } from "lucide-react";

interface TransactionStats {
  today: number;
  week: number;
  month: number;
  total: number;
  todayAmount?: number;
  weekAmount?: number;
  monthAmount?: number;
  totalAmount?: number;
  totalDefaulters?: number;
  defaultersAmount?: number;
}

interface TransactionSummaryProps {
  stats: TransactionStats;
}

export const TransactionSummary = ({ stats }: TransactionSummaryProps) => {
  const navigate = useNavigate();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Summary</CardTitle>
        <CardDescription>Recent financial activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm font-medium">Today</div>
                <div className="text-2xl font-bold">{formatCurrency(stats.todayAmount || 0)}</div>
                <div className="text-xs text-muted-foreground">{stats.today} transactions</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 p-2 rounded-full dark:bg-green-900/30">
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm font-medium">This Week</div>
                <div className="text-2xl font-bold">{formatCurrency(stats.weekAmount || 0)}</div>
                <div className="text-xs text-muted-foreground">{stats.week} transactions</div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-2 rounded-full dark:bg-purple-900/30">
                <BadgeDollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm font-medium">This Month</div>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthAmount || 0)}</div>
                <div className="text-xs text-muted-foreground">{stats.month} transactions</div>
              </div>
            </div>
          </div>
          
          {stats.totalDefaulters !== undefined && stats.defaultersAmount !== undefined && (
            <div>
              <div className="flex items-center gap-2">
                <div className="bg-red-100 p-2 rounded-full dark:bg-red-900/30">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-sm font-medium">Defaulters</div>
                  <div className="text-2xl font-bold">{formatCurrency(stats.defaultersAmount)}</div>
                  <div className="text-xs text-muted-foreground">{stats.totalDefaulters} users</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => navigate('/admin/payments')}
        >
          View All Transactions
        </Button>
      </CardFooter>
    </Card>
  );
};
