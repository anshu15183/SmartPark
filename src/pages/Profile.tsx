import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { User, CreditCard, LogOut, Loader, Eye, EyeOff, X } from "lucide-react";
import QRCodeDisplay from "@/components/QRCode";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user, token, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("100");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setCustomAmount(value);
      setPaymentAmount(Number(value) || 0);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to access your profile",
      });
    }
  }, [token, navigate, toast]);

  const handleRechargeWallet = async () => {
    if (!token) return;
    
    if (paymentAmount <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter an amount greater than 0",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const mockQrCode = `MOCK_UPI_RECHARGE_${Date.now()}_AMT${paymentAmount}`;
      setQrCodeData(mockQrCode);
      setLoading(false);
      
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "An error occurred during payment processing",
      });
      setLoading(false);
    }
  };

  const handleSimulatePayment = () => {
    setLoading(true);
    
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: "Your wallet has been recharged successfully.",
        variant: "default"
      });
      
      setTimeout(() => {
        setShowRechargeModal(false);
        setQrCodeData(null);
        setLoading(false);
        window.location.reload();
      }, 500);
    }, 1500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "All password fields are required",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "New passwords do not match",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
      });
      return;
    }
    
    try {
      setIsUpdatingPassword(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated",
      });
    } catch (error) {
      console.error("Password update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred during password update",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCloseRechargeModal = () => {
    setShowRechargeModal(false);
    setQrCodeData(null);
    
    toast({
      title: "Payment Cancelled",
      description: "The wallet recharge process was cancelled.",
    });
  };

  if (!user || !token) {
    return null;
  }

  const userQrValue = JSON.stringify({
    id: user._id,
    type: 'user'
  });

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold mb-2">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and wallet</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-8">
            <div className="glass-morphism rounded-xl p-6 animate-fade-in">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-primary" />
                </div>
                
                <h2 className="text-xl font-semibold">{user.name}</h2>
                <p className="text-muted-foreground">{user.email}</p>
                
                {user.isSpecialPass && (
                  <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-sm font-medium">
                    Special Pass Holder
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-border">
                {user.isSpecialPass && (
                  <button
                    onClick={() => setShowQR(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors mb-3"
                  >
                    Show Special Pass QR
                  </button>
                )}
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
            
            <div className="rounded-xl border border-border p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Wallet</h2>
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              
              <div className="bg-primary/10 rounded-lg p-4 text-center mb-4">
                <div className="text-sm text-muted-foreground mb-1">Available Balance</div>
                <div className="text-3xl font-bold text-primary">₹{user.wallet || "0.00"}</div>
              </div>
              
              <button
                onClick={() => setShowRechargeModal(true)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Recharge Wallet
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-8">
            <div className="rounded-xl border border-border p-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Account Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Full Name</h3>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Email Address</h3>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Phone Number</h3>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border border-border p-6 animate-fade-in">
              <h2 className="text-xl font-semibold mb-6">Change Password</h2>
              
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      disabled={isUpdatingPassword}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      disabled={isUpdatingPassword}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
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
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    disabled={isUpdatingPassword}
                  />
                </div>
                
                <button
                  type="submit"
                  className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? (
                    <div className="flex items-center justify-center">
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Updating...
                    </div>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {showQR && user.isSpecialPass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-morphism rounded-xl p-6 max-w-sm w-full mx-4 animate-scale-in">
            <h3 className="text-xl font-semibold mb-4 text-center">Your Special Pass QR Code</h3>
            
            <div className="flex justify-center mb-4">
              <QRCodeDisplay value={userQrValue} size={250} />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground mb-1">
                Scan this QR code at entry/exit gates for special pass access
              </p>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                This QR grants special pass privileges
              </p>
            </div>
            
            <button
              onClick={() => setShowQR(false)}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-morphism rounded-xl p-6 max-w-sm w-full mx-4 animate-scale-in relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={handleCloseRechargeModal}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-semibold mb-4 text-center">Recharge Wallet</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount (₹)
                </label>
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  placeholder="Enter amount to recharge"
                  className="w-full px-4 py-3"
                  disabled={loading || qrCodeData !== null}
                />
                {!qrCodeData && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button 
                      onClick={() => {
                        setCustomAmount("100");
                        setPaymentAmount(100);
                      }}
                      className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20"
                      disabled={loading}
                    >
                      ₹100
                    </button>
                    <button 
                      onClick={() => {
                        setCustomAmount("500");
                        setPaymentAmount(500);
                      }}
                      className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20"
                      disabled={loading}
                    >
                      ₹500
                    </button>
                    <button 
                      onClick={() => {
                        setCustomAmount("1000");
                        setPaymentAmount(1000);
                      }}
                      className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full hover:bg-primary/20"
                      disabled={loading}
                    >
                      ₹1000
                    </button>
                  </div>
                )}
              </div>
              
              {qrCodeData ? (
                <div className="flex flex-col items-center">
                  <div className="bg-primary/10 rounded-lg p-4 text-center mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Amount to Pay</div>
                    <div className="text-2xl font-bold text-primary">₹{paymentAmount}</div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <p className="font-medium text-sm">Mock UPI Payment - Simulation Only</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This is a simulated payment for testing
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <QRCodeDisplay 
                      value={qrCodeData}
                      title="Mock UPI Payment" 
                      size={200}
                    />
                  </div>
                  
                  <Button
                    onClick={handleSimulatePayment}
                    className="w-full bg-green-600 hover:bg-green-700 mb-2 flex items-center justify-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Simulate UPI Payment
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCloseRechargeModal}
                    className="w-full"
                  >
                    Cancel Payment
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">You will pay</div>
                    <div className="text-2xl font-bold text-primary">₹{paymentAmount}</div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    This is a simulated payment system for testing purposes.
                  </div>
                  
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handleCloseRechargeModal}
                      className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/70 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleRechargeWallet}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader className="animate-spin h-5 w-5 mr-2" />
                          Processing...
                        </div>
                      ) : (
                        "Generate QR Code"
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Profile;
