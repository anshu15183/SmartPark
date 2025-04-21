
import { ReactNode, useEffect } from "react";
import { Car } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ServerCrash } from "lucide-react";

interface KioskLayoutProps {
  title: string;
  children: ReactNode;
  serverConnected: boolean | null;
  apiBaseUrl?: string;
}

export const KioskLayout = ({ 
  title, 
  children, 
  serverConnected, 
  apiBaseUrl 
}: KioskLayoutProps) => {
  // Add kiosk class to body when component mounts
  useEffect(() => {
    // Add kiosk-mode class to html element
    document.documentElement.classList.add('kiosk-mode');
    
    // Cleanup function to remove class when component unmounts
    return () => {
      document.documentElement.classList.remove('kiosk-mode');
    };
  }, []);

  return (
    <div className="kiosk-container bg-background overflow-hidden">
      <header className="glass-morphism py-2 px-4 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            <h1 className="text-lg md:text-xl font-display font-bold">{title}</h1>
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {new Date().toLocaleString()}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center p-3 md:p-4 overflow-hidden">
        {serverConnected === false && (
          <Alert variant="destructive" className="mb-3 max-w-md bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Backend Server Unavailable</AlertTitle>
            <AlertDescription className="text-xs md:text-sm">
              Could not connect to the backend server. Make sure it's running at {apiBaseUrl}.
            </AlertDescription>
          </Alert>
        )}
        
        {children}
      </main>
      
      <footer className="py-1 px-4 text-center text-xs text-muted-foreground flex-shrink-0">
        <p>SmartPark {title} • Scan your QR code</p>
      </footer>
    </div>
  );
};
