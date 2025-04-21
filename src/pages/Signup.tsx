
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Home } from "lucide-react";

// Import logo
import logoHorizontal from "../assets/logo/logo-horizontal.svg";

// Import custom components
import { SignupForm, SignupFormData } from "@/components/auth/SignupForm";

const Signup = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Handle signup form submission
  const handleSignupSubmit = useCallback(async (data: SignupFormData) => {
    try {
      setIsSubmitting(true);
      
      // Format phone number with country code and remove spaces
      const formattedPhone = `${data.countryCode}${data.phone.replace(/\s+/g, '')}`;
      
      const response = await signup(data.name, data.email, formattedPhone, data.password);
      
      console.log("Signup API response:", response);
      
      if (response && response.success) {
        toast({
          title: "Registration started",
          description: "Please enter the verification code sent to your email and phone.",
        });
        
        // Navigate to OTP verification page with user data
        navigate('/otp-verification', { 
          state: { 
            userData: {
              name: data.name,
              email: data.email,
              phone: data.phone,
              countryCode: data.countryCode
            }
          }
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      // Error is handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  }, [signup, toast, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-6 relative">
          <Link to="/" className="absolute top-0 left-0 p-2 text-primary hover:text-primary/80 transition-colors" aria-label="Back to home">
            <Home className="h-5 w-5" />
          </Link>
          
          <img 
            src={logoHorizontal} 
            alt="SmartPark Logo" 
            className="h-12 mb-6" 
          />
          <h1 className="text-3xl font-display font-bold">Create Account</h1>
          <p className="text-muted-foreground mt-2">
            Sign up for a new SmartPark account
          </p>
        </div>
        
        <div className="glass-morphism rounded-2xl p-8 shadow-xl">
          <SignupForm 
            isSubmitting={isSubmitting}
            onSubmit={handleSignupSubmit}
          />
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Signup;
