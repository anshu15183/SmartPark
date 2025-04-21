
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ServerCrash } from "lucide-react";

interface ServerConnectionAlertProps {
  apiBaseUrl?: string;
}

export const ServerConnectionAlert = ({ apiBaseUrl }: ServerConnectionAlertProps) => {
  return (
    <Alert variant="destructive" className="mb-4 max-w-md bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/50">
      <ServerCrash className="h-4 w-4" />
      <AlertTitle>Backend Server Unavailable</AlertTitle>
      <AlertDescription>
        Could not connect to the backend server. Make sure it's running at {apiBaseUrl}.
      </AlertDescription>
    </Alert>
  );
};
