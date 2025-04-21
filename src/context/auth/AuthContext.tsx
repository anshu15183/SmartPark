
import { createContext, useState, useEffect, useContext } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  User, 
  fetchCurrentUser, 
  loginUser, 
  loginWithGoogle, 
  registerUser, 
  verifyUserOtp, 
  requestPasswordReset, 
  resetUserPassword, 
  logoutUser 
} from "./AuthAPI";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (googleToken: string) => Promise<void>;
  signup: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      try {
        const queryParams = new URLSearchParams(location.search);
        const tokenFromQuery = queryParams.get('token');
        let storedToken = localStorage.getItem("token");
        let storedUser = localStorage.getItem("user");
        
        if (tokenFromQuery) {
          localStorage.setItem("token", tokenFromQuery);
          storedToken = tokenFromQuery;
          
          const userData = await fetchCurrentUser(tokenFromQuery);
          
          if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
            setUser(userData);
            setToken(tokenFromQuery);
            
            toast({
              title: "Login Successful",
              description: `Welcome, ${userData.name}!`,
            });
            
            navigate('/dashboard', { replace: true });
          } else {
            throw new Error('Failed to get user data');
          }
        } 
        else if (storedToken) {
          setToken(storedToken);
          
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          
          const userData = await fetchCurrentUser(storedToken);
          if (userData) {
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch (error) {
        console.error("Authentication initialization error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [location.search, navigate, toast]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const data = await loginUser(email, password);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred during login",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (googleToken: string) => {
    try {
      setLoading(true);
      
      const data = await loginWithGoogle(googleToken);
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      setToken(data.token);
      setUser(data.user);
      
      toast({
        title: "Login successful",
        description: `Welcome, ${data.user.name}!`,
      });
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        variant: "destructive",
        title: "Google login failed",
        description: error instanceof Error ? error.message : "An error occurred during Google login",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, phone: string, password: string) => {
    try {
      setLoading(true);
      
      const data = await registerUser(name, email, phone, password);
      console.log("Signup API response:", data);
      
      toast({
        title: "Registration started",
        description: "Please verify your email with the OTP sent to your email address",
      });
      
      return data;
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      
      await requestPasswordReset(email);
      
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        variant: "destructive",
        title: "Request failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setLoading(true);
      
      await resetUserPassword(token, password);
      
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password",
      });
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      setLoading(true);
      
      await verifyUserOtp(email, otp);
      
      toast({
        title: "Account verified successfully",
        description: "Your account has been verified. You can now log in.",
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        variant: "destructive",
        title: "OTP verification failed",
        description: error instanceof Error ? error.message : "Invalid or expired OTP code. Please try again.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  const isStaff = () => {
    return user?.role === "staff" || user?.role === "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        googleLogin,
        signup,
        logout,
        forgotPassword,
        resetPassword,
        verifyOtp,
        isAdmin,
        isStaff,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
