import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Building, Pencil, Trash, Plus, AlertCircle, ChevronLeft } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { floorSchema } from "@/validators/floor-schema";
import axios from "@/lib/axios";

interface Floor {
  _id: string;
  name: string;
  spots: number;
}

interface FloorFormValues {
  name: string;
  spots: number;
}

const AdminFloors = () => {
  const { user, token, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [floors, setFloors] = useState<Floor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);

  const form = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: {
      name: "",
      spots: 1,
    },
  });

  useEffect(() => {
    if (!user || !isAdmin()) {
      navigate("/login");
      return;
    }

    fetchFloors();
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (selectedFloor) {
      form.reset({
        name: selectedFloor.name,
        spots: selectedFloor.spots,
      });
    } else {
      form.reset({
        name: "",
        spots: 1,
      });
    }
  }, [selectedFloor, form]);

  const fetchFloors = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/admin/floors");
      
      if (response.data.success) {
        const convertedFloors = response.data.floors.map((floor: any) => ({
          _id: floor._id,
          name: floor.name,
          spots: (floor.normalSpots || 0) + (floor.disabilitySpots || 0)
        }));
        setFloors(convertedFloors);
      }
    } catch (error) {
      console.error("Error fetching floors:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load floors. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FloorFormValues) => {
    try {
      const url = isEditing && selectedFloor
        ? `/admin/floors/${selectedFloor._id}`
        : "/admin/floors";

      const method = isEditing ? "PUT" : "POST";
      
      const backendData = {
        name: values.name,
        normalSpots: values.spots,
        disabilitySpots: 0
      };
      
      const response = await axios({
        method,
        url,
        data: backendData
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: isEditing
            ? "Floor updated successfully"
            : "Floor created successfully",
        });

        fetchFloors();
        setShowFormDialog(false);
        form.reset();
        setIsEditing(false);
        setSelectedFloor(null);
      }
    } catch (error) {
      console.error("Error saving floor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save floor. Please try again.",
      });
    }
  };

  const handleEdit = (floor: Floor) => {
    setSelectedFloor(floor);
    setIsEditing(true);
    setShowFormDialog(true);
  };

  const handleAddNew = () => {
    setSelectedFloor(null);
    setIsEditing(false);
    form.reset();
    setShowFormDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      const response = await axios.delete(`/admin/floors/${deleteId}`);

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Floor deleted successfully",
        });

        fetchFloors();
      }
    } catch (error) {
      console.error("Error deleting floor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete floor. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Floor Management</h1>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add New Floor
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : floors.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Building className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Floors Found</h3>
              <p className="text-muted-foreground mt-1">
                Add your first floor to get started
              </p>
              <Button onClick={handleAddNew} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Floor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Floors</CardTitle>
            <CardDescription>
              Manage your parking floors and spots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Total Spots</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {floors.map((floor) => (
                  <TableRow key={floor._id}>
                    <TableCell className="font-medium">{floor.name}</TableCell>
                    <TableCell>{floor.spots}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(floor)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setIsDeleting(true);
                            setDeleteId(floor._id);
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Floor Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Floor" : "Add New Floor"}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Update floor details" : "Create a new parking floor"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Basement 1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Give this floor a descriptive name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Parking Spots</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="1"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      Total number of parking spots on this floor
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowFormDialog(false);
                    setIsEditing(false);
                    setSelectedFloor(null);
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditing ? "Update Floor" : "Create Floor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={(open) => {
        if (!open) {
          setIsDeleting(false);
          setDeleteId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this floor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Deleting a floor will remove all associated parking spots.
            </AlertDescription>
          </Alert>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => {
              setIsDeleting(false);
              setDeleteId(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Floor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFloors;
