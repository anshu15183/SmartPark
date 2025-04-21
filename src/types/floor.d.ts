
interface Floor {
  _id: string;
  name: string;
  normalSpots: number;
  disabilitySpots: number;
  level: number;
  isActive: boolean;
  availableNormalSpots: number;
  availableDisabilitySpots: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FloorFormValues {
  name: string;
  normalSpots: number;
  disabilitySpots: number;
}
