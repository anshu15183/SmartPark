
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, AlertCircle, ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from "@/lib/axios";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  dueAmount: number;
  createdAt: string;
}

const clearDueSchema = z.object({
  amount: z.coerce.number()
    .positive("Amount must be positive")
    .refine((val) => val > 0, {
      message: "Amount must be greater than 0",
    }),
  waiveOff: z.boolean().default(false),
});

type FormValues = z.infer<typeof clearDueSchema>;

const AdminDefaulters = () => {
  const { user: currentUser, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [defaulters, setDefaulters] = useState<User[]>([]);
  const [filteredDefaulters, setFilteredDefaulters] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [clearDueDialogOpen, setClearDueDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(clearDueSchema),
    defaultValues: {
      amount: 0,
      waiveOff: false,
    },
  });

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate("/login");
      return;
    }

    fetchDefaulters();
  }, [currentUser, isAdmin, navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = defaulters.filter(
        (defaulter) =>
          defaulter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          defaulter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          defaulter.phone.includes(searchTerm)
      );
      setFilteredDefaulters(filtered);
    } else {
      setFilteredDefaulters(defaulters);
    }
  }, [searchTerm, defaulters]);

  const fetchDefaulters = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/defaulters");

      if (response.data.success) {
        setDefaulters(response.data.defaulters);
        setFilteredDefaulters(response.data.defaulters);
      }
    } catch (error) {
      console.error("Error fetching defaulters:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch defaulters",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearDue = async (values: FormValues) => {
    try {
      if (!selectedUser) return;

      const { amount, waiveOff } = values;

      if (amount > selectedUser.dueAmount) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Amount cannot be greater than due amount",
        });
        return;
      }

      const response = await axios.post(`/admin/clear-due/${selectedUser._id}`, {
        amount, 
        waiveOff
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: waiveOff 
            ? `Waived off ₹${amount} from ${selectedUser.name}'s due amount` 
            : `Cleared ₹${amount} from ${selectedUser.name}'s due amount`,
        });

        form.reset();
        setClearDueDialogOpen(false);
        fetchDefaulters();
      }
    } catch (error) {
      console.error("Error clearing due:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear due",
      });
    }
  };

  const openClearDueDialog = (user: User) => {
    setSelectedUser(user);
    setClearDueDialogOpen(true);
    form.reset({
      amount: user.dueAmount,
      waiveOff: false,
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Defaulters Management</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search defaulters by name, email or phone"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Defaulters</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading defaulters...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Due Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDefaulters.length > 0 ? (
                    filteredDefaulters.map((defaulter) => (
                      <TableRow key={defaulter._id}>
                        <TableCell className="font-medium">{defaulter.name}</TableCell>
                        <TableCell>{defaulter.email}</TableCell>
                        <TableCell>{defaulter.phone}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">₹{defaulter.dueAmount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            onClick={() => openClearDueDialog(defaulter)}
                          >
                            Clear Due
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No defaulters found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={clearDueDialogOpen} onOpenChange={setClearDueDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Clear Due Amount</DialogTitle>
            <DialogDescription>
              {selectedUser && `Clear due amount for ${selectedUser.name}`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleClearDue)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="waiveOff"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Waive off due amount</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Check this if you want to waive off the due amount without collecting it
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  {form.watch("waiveOff") 
                    ? "The due amount will be waived off and will not be added to the global account." 
                    : "The due amount will be cleared and added to the global account."}
                </AlertDescription>
              </Alert>
              <DialogFooter>
                <Button type="submit">
                  {form.watch("waiveOff") ? "Waive Off" : "Clear Due"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDefaulters;
