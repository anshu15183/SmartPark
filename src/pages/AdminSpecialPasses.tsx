import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tag, Plus, AlertCircle, Trash, ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const specialPassSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type User = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isSpecialPass: boolean;
  createdAt: string;
};

type FormValues = z.infer<typeof specialPassSchema>;

const AdminSpecialPasses = () => {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [specialPassUsers, setSpecialPassUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(specialPassSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/login");
      return;
    }

    fetchSpecialPassUsers();
  }, [user, isAdmin, navigate]);

  const fetchSpecialPassUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/special-pass-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error("Failed to fetch special pass users");
      }

      const data = await response.json();
      setSpecialPassUsers(data.users);
    } catch (error) {
      console.error("Error fetching special pass users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load special pass users. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const response = await fetch(`{import.meta.env.VITE_API_URL}/admin/special-pass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to grant special pass");
      }

      toast({
        title: "Success",
        description: "Special pass granted successfully",
      });

      fetchSpecialPassUsers();

      form.reset();
    } catch (error) {
      console.error("Error granting special pass:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleRevokePass = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/special-pass/${deleteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to revoke special pass");
      }

      toast({
        title: "Success",
        description: "Special pass revoked successfully",
      });

      fetchSpecialPassUsers();
    } catch (error) {
      console.error("Error revoking special pass:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Special Passes</h1>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : specialPassUsers.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Tag className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Special Pass Users</h3>
              <p className="text-muted-foreground mt-1">
                Grant special passes to users for unlimited parking access
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Special Pass Users</CardTitle>
            <CardDescription>
              Users with special parking privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specialPassUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
                        Special Pass
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={isDeleting && deleteId === user._id} onOpenChange={(open) => {
                        if (!open) setIsDeleting(false);
                        setDeleteId(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setIsDeleting(true);
                              setDeleteId(user._id);
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Revocation</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to revoke the special pass from {user.name}?
                            </DialogDescription>
                          </DialogHeader>
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                              This user will lose their special parking privileges immediately.
                            </AlertDescription>
                          </Alert>
                          <DialogFooter className="mt-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDeleting(false);
                                setDeleteId(null);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleRevokePass}
                            >
                              Revoke Pass
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminSpecialPasses;
