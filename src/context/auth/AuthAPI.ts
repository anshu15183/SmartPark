
import { toast as sonnerToast } from "sonner";
import api from "@/lib/axios";

// Define user type
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  wallet: number;
  role: "user" | "admin" | "staff";
  isSpecialPass: boolean;
}

// Response types
export interface AuthResponse {
  success: boolean;
  message: string;
  phoneVerified?: boolean;
  token?: string;
  user?: User;
}

// API functions for authentication
export const fetchCurrentUser = async (token: string): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error("Auth check error:", error);
    return null;
  }
};

export const loginUser = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const loginWithGoogle = async (googleToken: string) => {
  const response = await api.post('/auth/google', { token: googleToken });
  return response.data;
};

export const registerUser = async (name: string, email: string, phone: string, password: string): Promise<AuthResponse> => {
  const response = await api.post('/auth/register', { name, email, phone, password });
  return response.data;
};

export const verifyUserOtp = async (email: string, otp: string) => {
  console.log(`Verifying OTP for ${email} with code ${otp}`);
  
  const response = await api.post('/auth/verify-otp', { email, otp });
  console.log("OTP verification response:", response.data);
  
  return response.data;
};

export const requestPasswordReset = async (email: string) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetUserPassword = async (token: string, password: string) => {
  const response = await api.post('/auth/reset-password', { token, password });
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  sonnerToast.success("Logged out successfully");
};

