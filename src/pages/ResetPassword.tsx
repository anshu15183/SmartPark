
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Eye, EyeOff, Loader, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get token from URL query parameter
    const query = new URLSearchParams(location.search);
    const tokenParam = query.get("token");
    
    if (!tokenParam) {
      setTokenError(true);
      toast({
        variant: "destructive",
        title: "Invalid Reset Link",
        description: "The password reset link is invalid or has expired.",
      });
    } else {
      setToken(tokenParam);
    }
  }, [location, toast]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        variant: "destructive",
        title: "Invalid token",
        description: "The password reset link is invalid or has expired.",
      });
      return;
    }
    
    // Validate password
    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords do not match",
        description: "Please make sure your passwords match.",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await resetPassword(token, password);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);
      // Error handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (tokenError) {
    return (
      <main className="min-h-screen flex items-center justify-center py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md animate-fade-in">
          <div className="glass-morphism rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold">Invalid Reset Link</h1>
              <p className="text-muted-foreground mt-2">
                The password reset link is invalid or has expired.
              </p>
            </div>
            <div className="text-center mt-8">
              <Link 
                to="/forgot-password" 
                className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Request a new link
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen flex items-center justify-center py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md animate-fade-in">
        <div className="glass-morphism rounded-2xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold">Reset Password</h1>
            <p className="text-muted-foreground mt-2">
              {isSuccess
                ? "Your password has been reset successfully"
                : "Create a new password for your account"}
            </p>
          </div>
          
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center p-3 bg-green-500/10 text-green-500 rounded-full w-16 h-16 mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              
              <p className="text-foreground">
                Your password has been successfully reset.
              </p>
              
              <p className="text-sm text-muted-foreground">
                You will be redirected to the login page in a few seconds.
              </p>
              
              <div className="mt-8">
                <Link 
                  to="/login" 
                  className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your new password"
                    className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Resetting Password...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;

