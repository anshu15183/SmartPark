
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes("@")) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid email address",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Password reset request failed:", error);
      // Error is handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="min-h-screen flex items-center justify-center py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-md animate-fade-in">
          <div className="glass-morphism rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold">Reset Password</h1>
              <p className="text-muted-foreground mt-2">
                {isSubmitted
                  ? "Check your email for reset instructions"
                  : "Enter your email to receive a password reset link"}
              </p>
            </div>
            
            {isSubmitted ? (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full w-16 h-16 mx-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="w-8 h-8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                
                <p className="text-foreground">
                  We've sent instructions to reset your password to:
                </p>
                <p className="font-medium text-lg">{email}</p>
                
                <p className="text-sm text-muted-foreground">
                  Please check your email and follow the instructions to reset your password.
                  If you don't see the email, check your spam folder.
                </p>
                
                <div className="mt-8">
                  <Link 
                    to="/login" 
                    className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Sending...
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
      
      <Footer />
    </>
  );
};

export default ForgotPassword;
