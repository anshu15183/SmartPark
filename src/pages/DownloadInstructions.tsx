
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download, Shield } from "lucide-react";

const DownloadInstructions = () => {
  const handleDownload = () => {
    window.location.href = '/smartpark.apk';
  };

  return (
    <main className="min-h-screen py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Installation Instructions</h1>
          
          <div className="bg-background border border-border rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Shield className="mr-2 h-6 w-6 text-primary" /> Download & Installation Steps
            </h2>
            
            {/* If download hasn't started */}
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                If your download hasn't started, click the button below to try again:
              </p>
              <Button 
                variant="default" 
                size="lg"
                onClick={handleDownload}
                className="flex items-center"
              >
                <Download className="mr-2 h-5 w-5" />
                Download Android APK
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Version 1.0.0 | Size: 25MB
              </p>
            </div>

            <ol className="space-y-4 text-left pl-5 list-decimal list-outside">
              <li className="text-red-500 font-medium">
                If the file downloads as a ZIP, rename it to <code>SmartPark.apk</code> before installing:
                <ul className="list-disc list-inside text-sm mt-1">
                  <li>Right-click the downloaded file</li>
                  <li>Select "Rename"</li>
                  <li>Change the name to exactly <code>SmartPark.apk</code></li>
                </ul>
              </li>
              <li>Click Install. If Play Protect shows a warning, tap "Install Anyway."</li>
              <li>Open the app and log in with your SmartPark account.</li>
              <li>You're all set! Enjoy using SmartPark on your phone.</li>
            </ol>

            <p className="mt-6 text-sm text-center text-primary font-medium">
              <Shield className="inline-block mr-1 h-4 w-4" /> 
              We digitally signed our app and guarantee it is safe.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DownloadInstructions;
