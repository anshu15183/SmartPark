
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import logoHorizontal from "../assets/logo/logo-horizontal.svg";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-8 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-4">
            <img src={logoHorizontal} alt="SmartPark Logo" className="h-8" />
            <p className="text-muted-foreground text-sm max-w-xs">
              Smart parking solution that makes finding and booking parking spots effortless.
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact Us
            </Link>
            <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-border text-center text-muted-foreground text-sm">
          <p className="flex items-center justify-center">
            © {currentYear} SmartPark. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
