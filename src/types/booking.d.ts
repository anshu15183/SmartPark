
export type Floor = {
  _id: string;
  name: string;
  level: number;
  normalSpots: number;
  disabilitySpots: number;
  isActive: boolean;
  availableNormalSpots: number;
  availableDisabilitySpots: number;
};

export type Booking = {
  _id: string;
  user: string;
  floor: Floor;
  spotType: 'normal' | 'disability';
  spotNumber: string;
  bookingId: string;
  qrCode: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';
  entryTime?: Date;
  exitTime?: Date;
  expectedExitTime?: Date;
  actualAmount: number;
  paymentStatus: 'pending' | 'paid' | 'due';
  paymentMethod: 'wallet' | 'razorpay' | 'upi' | 'free' | 'none' | 'due';
  createdAt: Date;
  expiresAt: Date;
  archived?: boolean;
};
