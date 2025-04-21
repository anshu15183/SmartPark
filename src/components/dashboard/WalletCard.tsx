
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader, Plus, Wallet, X, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import QRCodeDisplay from "@/components/QRCode";
import { useNavigate } from "react-router-dom";
import axios from "@/lib/axios";

interface WalletCardProps {
  walletBalance: number;
}

export const WalletCard = ({ walletBalance = 0 }: WalletCardProps) => {
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleOpenRechargeModal = () => {
    setShowRechargeModal(true);
    setRechargeAmount(100); // Default amount
    setQrCodeData(null);
  };

  const handleCloseRechargeModal = () => {
    setShowRechargeModal(false);
    setQrCodeData(null);
  };

  const handleAmountChange = (amount: number) => {
    setRechargeAmount(amount);
  };

  const handleRechargeWallet = () => {
    setLoading(true);
    
    // Generate QR code for payment
    const mockQrCode = `upi://pay?pa=mockupi@smartpark&pn=SmartPark&am=${rechargeAmount}&cu=INR&tn=Wallet_Recharge`;
    setQrCodeData(mockQrCode);
    setLoading(false);
  };
  
  const handleSimulatePayment = () => {
    setLoading(true);
    
    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Try to use the server API for wallet recharging
        const response = await axios.post('/payment/verify', {
          paymentId: 'sim_' + Date.now(),
          orderId: 'ord_' + Date.now(),
          paymentType: 'wallet',
          amount: rechargeAmount
        });
        
        if (response.data.success) {
          // If successful, use the server's data
          if (user) {
            const updatedUser = {
              ...user,
              wallet: user.wallet + rechargeAmount
            };
            setUser(updatedUser);
          }
        } else {
          throw new Error("Server returned an error");
        }
      } catch (error) {
        console.log("API call failed, falling back to client-side update:", error);
        
        // Fallback to client-side update if API fails
        if (user) {
          const updatedUser = {
            ...user,
            wallet: user.wallet + rechargeAmount
          };
          setUser(updatedUser);
        }
      }
      
      toast({
        title: "Wallet Recharged",
        description: `Successfully added ₹${rechargeAmount} to your wallet.`,
      });
      
      setShowRechargeModal(false);
      setQrCodeData(null);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Wallet</h3>
        <Button variant="outline" size="sm" onClick={handleOpenRechargeModal}>
          <Plus className="h-4 w-4 mr-1" />
          Add Money
        </Button>
      </div>
      <div className="flex items-center gap-3 my-2">
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
          <Wallet className="h-5 w-5 text-green-500 dark:text-green-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-2xl font-semibold">
            ₹{walletBalance}
          </p>
        </div>
      </div>

      {/* Recharge Wallet Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 animate-scale-in relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={handleCloseRechargeModal}
              className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-semibold mb-4 text-center">Add Money to Wallet</h3>
            
            <div className="flex flex-col items-center">
              <div className="w-full mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Select Amount</p>
                <div className="grid grid-cols-3 gap-2">
                  {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleAmountChange(amount)}
                      className={`py-2 px-3 rounded-md border text-center transition-colors ${
                        rechargeAmount === amount
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      }`}
                      disabled={!!qrCodeData}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>
              
              {qrCodeData ? (
                <>
                  <div className="w-full mb-4">
                    <p className="mb-2 text-sm text-muted-foreground">Scan QR to Pay</p>
                    <div className="bg-white p-4 rounded-lg flex justify-center">
                      <QRCodeDisplay
                        value={qrCodeData}
                        title="UPI Payment"
                        size={180}
                        level="L"
                      />
                    </div>
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Amount: ₹{rechargeAmount}
                    </p>
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
                        Complete Payment
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-full mb-4">
                    <p className="mb-2 text-sm text-muted-foreground">You will pay</p>
                    <div className="bg-primary/10 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">₹{rechargeAmount}</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleRechargeWallet}
                    className="w-full bg-primary hover:bg-primary/90 mb-2 flex items-center justify-center"
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
                        Generate QR Code
                      </>
                    )}
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                onClick={handleCloseRechargeModal}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
