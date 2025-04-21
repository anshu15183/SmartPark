
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader, Mail, CheckCircle, Phone, ArrowLeft } from "lucide-react";

// Import logo
import logoHorizontal from "../assets/logo/logo-horizontal.svg";

const OtpVerification = () => {
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp } = useAuth();
  const { toast } = useToast();

  // Get user data from location state
  const userData = location.state?.userData;

  // If no user data, redirect to signup
  useEffect(() => {
    if (!userData) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Missing user information. Please try signing up again.",
      });
      navigate('/signup');
    }
  }, [userData, navigate, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid 6-digit OTP",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Verifying OTP:", otp, "for email:", userData?.email);
      await verifyOtp(userData?.email, otp);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. You can now log in.",
      });
      
      navigate("/login");
    } catch (error) {
      console.error("OTP verification failed:", error);
      // Error is handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate('/signup');
  };

  if (!userData) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-6 relative">
          <button 
            onClick={handleGoBack}
            className="absolute top-0 left-0 p-2 text-primary hover:text-primary/80 transition-colors" 
            aria-label="Back to signup"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <img 
            src={logoHorizontal} 
            alt="SmartPark Logo" 
            className="h-12 mb-6" 
          />
          <h1 className="text-3xl font-display font-bold">Verify Your Account</h1>
          <p className="text-muted-foreground mt-2">
            Enter the verification code to complete registration
          </p>
        </div>
        
        <div className="glass-morphism rounded-2xl p-8 shadow-xl">
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Mail className="h-12 w-12 text-primary mb-2" />
              </div>
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit verification code to
              </p>
              <p className="font-medium mt-1">{userData?.email}</p>
              <p className="text-sm text-muted-foreground mt-1">
                and
              </p>
              <p className="font-medium">{userData?.countryCode}{userData?.phone}</p>
            </div>

            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-center block">
                  Enter verification code
                </label>
                <div className="flex justify-center">
                  <div className="flex gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="h-10 w-10 rounded-md border border-input bg-background text-center text-lg"
                        value={otp[index] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^[0-9]$/.test(value) || value === '') {
                            const newOtp = otp.split('');
                            newOtp[index] = value;
                            setOtp(newOtp.join(''));
                            
                            // Auto-focus next input
                            if (value && index < 5) {
                              const nextInput = e.target.parentElement?.children[index + 1] as HTMLInputElement;
                              if (nextInput) nextInput.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          // Handle backspace
                          if (e.key === 'Backspace' && !otp[index] && index > 0) {
                            const prevInput = e.currentTarget.parentElement?.children[index - 1] as HTMLInputElement;
                            if (prevInput) {
                              prevInput.focus();
                              const newOtp = otp.split('');
                              newOtp[index - 1] = '';
                              setOtp(newOtp.join(''));
                            }
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text/plain').trim();
                          if (/^\d+$/.test(pastedData)) {
                            const digits = pastedData.slice(0, 6).split('');
                            setOtp(digits.join('').padEnd(6, ''));
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verify & Create Account
                    </div>
                  )}
                </button>
                
                <button 
                  type="button"
                  className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
                  onClick={handleGoBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Go back
                </button>
              </div>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                Didn't receive the code? 
                <button 
                  type="button"
                  className="ml-1 text-primary hover:underline font-medium"
                  onClick={handleGoBack}
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OtpVerification;
