
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ChevronLeft,
  Search,
  FileBarChart,
  Eye,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { DateRangePicker } from "@/components/DateRangePicker";
import { api } from "@/lib/axios";
import { DateRange } from "react-day-picker";

// Define types
interface Transaction {
  _id: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

// Updated to use only the allowed badge variants
const typeBadgeVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  payment: "default",
  refund: "secondary",
  wallet_credit: "secondary",
  wallet_debit: "outline",
  booking_payment: "default",
  due_payment: "outline",
  special_pass: "default",
};

const typeLabels: Record<string, string> = {
  payment: "Payment",
  refund: "Refund",
  wallet_credit: "Wallet Credit",
  wallet_debit: "Wallet Debit",
  booking_payment: "Booking Payment",
  due_payment: "Due Payment",
  special_pass: "Special Pass",
};

const AdminPayments = () => {
  const { user: currentUser, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pages: 1,
  });

  // Fixed: Initialize with undefined values rather than empty object
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  // Fetch transactions based on filters
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params
      let queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (selectedType !== "all") {
        queryParams.append("type", selectedType);
      }

      if (dateRange?.from) {
        queryParams.append("startDate", dateRange.from.toISOString());
      }

      if (dateRange?.to) {
        queryParams.append("endDate", dateRange.to.toISOString());
      }

      const response = await api.get(`/payment/transactions?${queryParams}`);

      if (response.data.success) {
        setTransactions(response.data.transactions);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transactions",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedType, dateRange, toast]);

  // Check admin status and fetch initial data
  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate("/login");
      return;
    }

    fetchTransactions();
  }, [currentUser, isAdmin, fetchTransactions, navigate]);

  // Filter transactions by search term
  const filteredTransactions = transactions.filter((transaction) =>
    transaction.user
      ? transaction.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      : transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle page change
  const changePage = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPage(newPage);
    }
  };

  // View transaction description
  const viewDescription = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDescriptionOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy, h:mm a");
    } catch (error) {
      return "Invalid Date";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Payment Transactions</h1>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user or description"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full md:w-48">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="wallet_credit">Wallet Credit</SelectItem>
                  <SelectItem value="wallet_debit">Wallet Debit</SelectItem>
                  <SelectItem value="booking_payment">Booking Payment</SelectItem>
                  <SelectItem value="due_payment">Due Payment</SelectItem>
                  <SelectItem value="special_pass">Special Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker */}
            <div className="w-full md:w-72">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                className=""
              />
            </div>

            <Button onClick={() => fetchTransactions()} className="flex-shrink-0">
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-xl">Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No Transactions Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction._id}>
                        <TableCell>
                          {formatDate(transaction.createdAt)}
                        </TableCell>
                        <TableCell>
                          {transaction.user ? (
                            <div>
                              <div className="font-medium">{transaction.user.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {transaction.user.email}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <AlertTriangle className="h-3 w-3 mr-2 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">System</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={typeBadgeVariant[transaction.type] || "default"}>
                            {typeLabels[transaction.type] || transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "completed"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewDescription(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredTransactions.length} of {pagination.total} transactions
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePage(page - 1)}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePage(page + 1)}
                    disabled={page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Description Dialog */}
      <Dialog open={descriptionOpen} onOpenChange={setDescriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction &&
                formatDate(selectedTransaction.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-1">Amount</div>
                <div className="text-lg font-bold">
                  ₹{selectedTransaction.amount.toFixed(2)}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Type</div>
                <Badge variant={typeBadgeVariant[selectedTransaction.type] || "default"}>
                  {typeLabels[selectedTransaction.type] || selectedTransaction.type}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Status</div>
                <Badge
                  variant={
                    selectedTransaction.status === "completed"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {selectedTransaction.status}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Description</div>
                <p className="text-sm border rounded p-3 bg-muted/50">
                  {selectedTransaction.description || "No description provided"}
                </p>
              </div>

              {selectedTransaction.user && (
                <div>
                  <div className="text-sm font-medium mb-1">User</div>
                  <div className="text-sm">
                    <div>{selectedTransaction.user.name}</div>
                    <div className="text-muted-foreground">
                      {selectedTransaction.user.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
