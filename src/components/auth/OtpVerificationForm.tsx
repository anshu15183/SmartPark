
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Loader, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface OtpVerificationFormProps {
  email: string;
  phone: string;
  countryCode: string;
  isSubmitting: boolean;
  onVerify: (otp: string) => Promise<void>;
  onGoBack: () => void;
}

export const OtpVerificationForm = ({ 
  email, 
  phone, 
  countryCode,
  isSubmitting, 
  onVerify,
  onGoBack
}: OtpVerificationFormProps) => {
  const [otp, setOtp] = useState("");
  const { toast } = useToast();

  // Reset OTP when component mounts
  useEffect(() => {
    console.log("OtpVerificationForm mounted for:", email);
    setOtp("");
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length < 6) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid 6-digit OTP",
      });
      return;
    }
    
    await onVerify(otp);
  };

  return (
    <div className="space-y-6">
      <div>
        <DialogTitle className="text-xl font-semibold text-center">
          Verify Your Account
        </DialogTitle>
        <DialogDescription className="text-center mt-2">
          Enter the verification code to complete registration
        </DialogDescription>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Mail className="h-12 w-12 text-primary mb-2" />
        </div>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to
        </p>
        <p className="font-medium mt-1">{email}</p>
        <p className="text-sm text-muted-foreground mt-1">
          and
        </p>
        <p className="font-medium">{countryCode}{phone}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="otp" className="text-sm font-medium text-center block">
            Enter verification code
          </label>
          <div className="flex justify-center">
            <InputOTP 
              maxLength={6}
              value={otp}
              onChange={setOtp}
              disabled={isSubmitting}
              render={({ slots }) => (
                <InputOTPGroup>
                  {slots.map((slot, index) => (
                    <InputOTPSlot key={index} {...slot} index={index} />
                  ))}
                </InputOTPGroup>
              )}
            />
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
            onClick={onGoBack}
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
            onClick={onGoBack}
          >
            Try again
          </button>
        </p>
      </div>
    </div>
  );
};
