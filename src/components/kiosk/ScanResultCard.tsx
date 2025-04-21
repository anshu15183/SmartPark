import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Loader, CreditCard } from "lucide-react";
import { PaymentActions } from "@/components/kiosk/PaymentActions";
import QRCodeDisplay from "@/components/QRCode";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScanResultProps {
  result: {
    success: boolean;
    message: string;
    requiresPayment?: boolean;
    data?: {
      bookingId?: string;
      userName?: string;
      entryTime?: string;
      exitTime?: string;
      duration?: number;
      amount?: number;
      paymentMethod?: string;
      walletBalance?: number;
      shortfall?: number;
      paymentQRCode?: string;
      isSpecialPass?: boolean;
    };
  };
  onReset: () => void;
  isEntry: boolean;
  onPaymentComplete?: (status: 'paid' | 'due') => void;
  paymentProcessing?: boolean;
}

export const ScanResultCard = ({ 
  result, 
  onReset, 
  isEntry, 
  onPaymentComplete,
  paymentProcessing = false 
}: ScanResultProps) => {
  const hasWalletBalance = result.data?.walletBalance && result.data.walletBalance > 0;
  const sufficientWalletBalance = result.data?.walletBalance && result.data.amount 
    ? result.data.walletBalance >= result.data.amount 
    : false;
  
  return (
    <Card className="w-full max-w-md mx-auto p-3 shadow-lg animate-fade-in flex flex-col h-full max-h-full">
      <ScrollArea className="flex-1 min-h-0 pr-3">
        <div className="flex flex-col items-center text-center mb-3">
          {result.success ? (
            result.requiresPayment && !result.data?.paymentMethod ? (
              <Clock className="w-10 h-10 md:w-12 md:h-12 text-amber-500 mb-1" />
            ) : (
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-500 mb-1" />
            )
          ) : (
            <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500 mb-1" />
          )}
          
          <h2 className="text-lg md:text-xl font-bold mb-1">
            {result.success 
              ? result.requiresPayment && !result.data?.paymentMethod
                ? isEntry ? "Entry Pending Payment" : "Exit Pending Payment"
                : isEntry ? "Entry Authorized" : "Exit Authorized"
              : isEntry ? "Entry Denied" : "Exit Denied"
            }
          </h2>
          
          <p className="text-muted-foreground text-xs md:text-sm">{result.message}</p>
        </div>
        
        {result.success && result.data && (
          <div className="space-y-2 mb-3">
            {result.data.userName && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">User</span>
                <span className="font-medium text-sm">{result.data.userName}</span>
              </div>
            )}
            
            {result.data.bookingId && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Booking ID</span>
                <span className="font-medium text-sm">{result.data.bookingId}</span>
              </div>
            )}
            
            {result.data.entryTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Entry Time</span>
                <span className="font-medium text-sm">{result.data.entryTime}</span>
              </div>
            )}
            
            {result.data.exitTime && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Exit Time</span>
                <span className="font-medium text-sm">{result.data.exitTime}</span>
              </div>
            )}
            
            {result.data.duration !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Duration</span>
                <span className="font-medium text-sm">{result.data.duration} min</span>
              </div>
            )}
            
            {result.data.amount !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Amount</span>
                <span className="font-semibold text-sm">₹{result.data.amount}</span>
              </div>
            )}
            
            {result.data.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Payment Method</span>
                <span className="font-medium text-sm capitalize">
                  {result.data.paymentMethod === 'due' ? 'Added to Dues' : result.data.paymentMethod}
                </span>
              </div>
            )}
            
            {hasWalletBalance && (
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">Wallet Balance</span>
                <span className="font-medium text-sm">₹{result.data.walletBalance}</span>
              </div>
            )}
          </div>
        )}
        
        {result.success && result.requiresPayment && !result.data?.paymentMethod && result.data?.amount && onPaymentComplete && (
          <div className="mb-3">
            <div className="flex flex-col items-center">
              <div className="bg-primary/10 p-2 rounded-lg text-center mb-2">
                <h3 className="font-semibold mb-1 text-xs md:text-sm">Scan to Pay</h3>
                <p className="text-xs text-muted-foreground mb-1">
                  UPI Payment
                </p>
                <div className="bg-white p-2 rounded-lg mb-1">
                  <QRCodeDisplay 
                    value={`MOCK_UPI_PAYMENT_${Date.now()}_AMT${result.data.amount}`}
                    title="UPI Payment"
                    size={120}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Amount: ₹{result.data.amount}
                </p>
              </div>
              
              <div className="w-full">
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <Button
                    onClick={() => onPaymentComplete('paid')}
                    className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    disabled={paymentProcessing}
                    size="sm"
                  >
                    {paymentProcessing ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    {paymentProcessing ? 'Processing...' : 'Complete Payment'}
                  </Button>
                  
                  <PaymentActions
                    onPaymentComplete={onPaymentComplete}
                    paymentProcessing={paymentProcessing}
                    amount={result.data.amount}
                    walletBalance={result.data.walletBalance}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
      
      <div className="flex justify-center mt-2">
        <Button 
          onClick={onReset} 
          className="w-full max-w-xs"
          disabled={paymentProcessing}
          size="sm"
        >
          {paymentProcessing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Done"
          )}
        </Button>
      </div>
    </Card>
  );
}
