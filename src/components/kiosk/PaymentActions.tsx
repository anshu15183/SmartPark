
import { Button } from "@/components/ui/button";

interface PaymentActionsProps {
  onPaymentComplete: (status: 'paid' | 'due') => void;
  paymentProcessing: boolean;
  amount?: number;
  walletBalance?: number;
}

export const PaymentActions = ({ 
  onPaymentComplete, 
  paymentProcessing,
  amount = 0,
  walletBalance = 0
}: PaymentActionsProps) => {
  const canPayWithWallet = walletBalance >= amount;
  
  const handleWalletPayment = () => {
    if (canPayWithWallet) {
      onPaymentComplete('paid');
    }
  };
  
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {canPayWithWallet ? (
        <Button
          onClick={handleWalletPayment}
          className="bg-green-600 hover:bg-green-700"
          disabled={paymentProcessing}
        >
          {paymentProcessing ? 'Processing...' : 'Pay with Wallet'}
        </Button>
      ) : (
        <Button
          variant="outline"
          className="text-muted-foreground cursor-not-allowed"
          disabled={true}
        >
          Insufficient Balance
        </Button>
      )}
      <Button
        onClick={() => onPaymentComplete('due')}
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
        disabled={paymentProcessing}
      >
        Add to Dues
      </Button>
    </div>
  );
};
