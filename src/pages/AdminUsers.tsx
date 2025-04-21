
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
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
import { Search, Plus, Trash2, Wallet, CreditCard, MinusCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  wallet: number;
  role: "user" | "admin" | "staff";
  isSpecialPass: boolean;
  dueAmount: number;
  isVerified: boolean;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin", "staff"], {
    required_error: "Please select a role",
  }),
});

const walletFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

const AdminUsers = () => {
  const { user: currentUser, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [walletDebitDialogOpen, setWalletDebitDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [globalBalance, setGlobalBalance] = useState(0);

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "user",
    },
  });

  const walletForm = useForm<z.infer<typeof walletFormSchema>>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const walletDebitForm = useForm<z.infer<typeof walletFormSchema>>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: {
      amount: 0,
    },
  });

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      navigate("/login");
      return;
    }

    fetchUsers();
    fetchGlobalAccount();
  }, [currentUser, isAdmin, navigate]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalAccount = async () => {
    try {
      const response = await fetch(`${API_URL}/admin/global-account`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to fetch global account");
      }

      const data = await response.json();
      setGlobalBalance(data.balance);
    } catch (error) {
      console.error("Error fetching global account:", error);
      // Silently fail
    }
  };

  const handleAddUser = async (values: z.infer<typeof userFormSchema>) => {
    try {
      const response = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add user");
      }

      toast({
        title: "Success",
        description: "User added successfully",
      });
      userForm.reset();
      setAddUserOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add user",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete user");
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
      });
    }
  };

  const handleAddToWallet = async (values: z.infer<typeof walletFormSchema>) => {
    if (!selectedUser) return;

    try {
      console.log("Adding to wallet:", values.amount, "for user:", selectedUser._id);
      
      const response = await fetch(`${API_URL}/admin/users/${selectedUser._id}/wallet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ amount: values.amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add to wallet");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: `Added ₹${values.amount} to ${selectedUser.name}'s wallet`,
      });
      walletForm.reset();
      setWalletDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error adding to wallet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add to wallet",
      });
    }
  };

  const handleDebitFromWallet = async (values: z.infer<typeof walletFormSchema>) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`${API_URL}/admin/users/${selectedUser._id}/wallet/debit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ amount: values.amount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to debit from wallet");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: `Debited ₹${values.amount} from ${selectedUser.name}'s wallet and added to global account`,
      });
      walletDebitForm.reset();
      setWalletDebitDialogOpen(false);
      fetchUsers();
      fetchGlobalAccount();
    } catch (error) {
      console.error("Error debiting from wallet:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to debit from wallet",
      });
    }
  };

  const openWalletDialog = (user: User) => {
    setSelectedUser(user);
    setWalletDialogOpen(true);
  };

  const openWalletDebitDialog = (user: User) => {
    setSelectedUser(user);
    setWalletDebitDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users by name, email or phone"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <Card className="border-none shadow-none p-0">
            <CardContent className="p-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Global Balance</p>
                <p className="font-medium">₹{globalBalance}</p>
              </div>
            </CardContent>
          </Card>

          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new user account.
                </DialogDescription>
              </DialogHeader>
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(handleAddUser)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Full Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Email Address" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="user">User</option>
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Add User</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="user">Regular Users</TabsTrigger>
        </TabsList>

        {["all", "admin", "staff", "user"].map((role) => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {role === "all" ? "All Users" : 
                   role === "admin" ? "Administrators" : 
                   role === "staff" ? "Staff Members" : 
                   "Regular Users"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-4">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Wallet</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers
                          .filter((user) => 
                            role === "all" ? true : user.role === role
                          )
                          .map((user) => (
                            <TableRow key={user._id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>{user.phone}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    user.role === "admin"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                                      : user.role === "staff"
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                      : "bg-green-100 text-green-800 hover:bg-green-100"
                                  }
                                >
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>₹{user.wallet}</TableCell>
                              <TableCell>
                                {user.isVerified ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    Unverified
                                  </Badge>
                                )}
                                {user.isSpecialPass && (
                                  <Badge variant="outline" className="ml-1 bg-purple-100 text-purple-800 hover:bg-purple-100">
                                    Special Pass
                                  </Badge>
                                )}
                                {user.dueAmount > 0 && (
                                  <Badge variant="outline" className="ml-1 bg-red-100 text-red-800 hover:bg-red-100">
                                    Due: ₹{user.dueAmount}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openWalletDialog(user)}
                                    title="Add money to wallet"
                                  >
                                    <Wallet className="h-4 w-4" />
                                  </Button>
                                  {user.wallet > 0 && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => openWalletDebitDialog(user)}
                                      title="Debit money from wallet"
                                    >
                                      <MinusCircle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {user._id !== currentUser?._id && (
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => handleDeleteUser(user._id)}
                                      title="Delete user"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        {filteredUsers.filter(user => 
                          role === "all" ? true : user.role === role
                        ).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Money to Wallet</DialogTitle>
            <DialogDescription>
              {selectedUser && `Add money to ${selectedUser.name}'s wallet`}
            </DialogDescription>
          </DialogHeader>
          <Form {...walletForm}>
            <form onSubmit={walletForm.handleSubmit(handleAddToWallet)} className="space-y-4">
              <FormField
                control={walletForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Money</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={walletDebitDialogOpen} onOpenChange={setWalletDebitDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Debit Money from Wallet</DialogTitle>
            <DialogDescription>
              {selectedUser && `Debit money from ${selectedUser.name}'s wallet and add to global account`}
            </DialogDescription>
          </DialogHeader>
          <Form {...walletDebitForm}>
            <form onSubmit={walletDebitForm.handleSubmit(handleDebitFromWallet)} className="space-y-4">
              <FormField
                control={walletDebitForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        step="1" 
                        max={selectedUser?.wallet || 0}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    {selectedUser && (
                      <p className="text-sm text-muted-foreground">Maximum available: ₹{selectedUser.wallet}</p>
                    )}
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Debit Money</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
