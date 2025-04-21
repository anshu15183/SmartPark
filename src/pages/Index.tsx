
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Car, CreditCard, QrCode, Clock, Download, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    how: false,
    features: false,
  });
  
  const heroRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  // Intersection Observer for animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.target === heroRef.current && entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, hero: true }));
        } else if (entry.target === howRef.current && entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, how: true }));
        } else if (entry.target === featuresRef.current && entry.isIntersecting) {
          setIsVisible((prev) => ({ ...prev, features: true }));
        }
      });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    if (heroRef.current) observer.observe(heroRef.current);
    if (howRef.current) observer.observe(howRef.current);
    if (featuresRef.current) observer.observe(featuresRef.current);
    
    return () => {
      if (heroRef.current) observer.unobserve(heroRef.current);
      if (howRef.current) observer.unobserve(howRef.current);
      if (featuresRef.current) observer.unobserve(featuresRef.current);
    };
  }, []);
  
  const scrollToHow = () => {
    howRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = () => {
    window.location.href = '/smartpark.apk';
    setTimeout(() => {
      navigate('/download-instructions');
    }, 100);
  };  

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section 
        ref={heroRef} 
        className="pt-24 pb-16 md:pt-32 md:pb-24"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={`flex flex-col items-center text-center transition-all duration-1000 ${
              isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight max-w-4xl mx-auto text-balance">
              Smart Parking Made <span className="text-primary">Simple</span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
              Find, book, and pay for parking in seconds. SmartPark makes parking stress-free with real-time availability and seamless QR code access.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg text-base w-full sm:w-auto text-center"
              >
                Get Started
              </Link>
              
              <Link
                to="/login"
                className="px-6 py-3 rounded-md bg-secondary text-secondary-foreground font-medium hover:bg-secondary/70 transition-colors text-base w-full sm:w-auto text-center"
              >
                Log In
              </Link>
            </div>
            
            <button 
              onClick={scrollToHow}
              className="mt-16 flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors animate-bounce"
            >
              <span className="text-sm mb-2">Learn How It Works</span>
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section 
        ref={howRef} 
        className="py-16 md:py-24 bg-muted/50"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={`flex flex-col items-center text-center mb-12 transition-all duration-1000 ${
              isVisible.how ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              How SmartPark Works
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Our seamless process makes parking easier than ever before
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[
              {
                title: "Book Your Spot",
                description: "Choose from available parking spots and book in advance or on-the-go.",
                icon: <Car className="h-8 w-8 text-primary" />,
                delay: 0,
              },
              {
                title: "Scan Your QR Code",
                description: "Use the generated QR code at the parking entry kiosk for access.",
                icon: <QrCode className="h-8 w-8 text-primary" />,
                delay: 100,
              },
              {
                title: "Pay on Exit",
                description: "Pay easily through your prepaid wallet or UPI when you leave.",
                icon: <CreditCard className="h-8 w-8 text-primary" />,
                delay: 200,
              },
            ].map((step, index) => (
              <div 
                key={index}
                className={`glass-morphism rounded-xl p-8 transition-all duration-1000 delay-${step.delay} ${
                  isVisible.how ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section 
        ref={featuresRef} 
        className="py-16 md:py-24"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            className={`flex flex-col items-center text-center mb-12 transition-all duration-1000 ${
              isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Smart Features
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Discover what makes SmartPark the ideal solution for modern parking needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[
              {
                title: "QR Code Access",
                description: "Secure and contactless entry and exit with QR code scanning.",
                delay: 0,
              },
              {
                title: "Digital Wallet",
                description: "Prepaid wallet system for quick payments and seamless checkout.",
                delay: 100,
              },
              {
                title: "Dynamic Pricing",
                description: "Transparent pricing with base rates and time-based adjustments.",
                delay: 200,
              },
              {
                title: "Notifications",
                description: "Timely alerts before booking expiry and payment reminders.",
                delay: 300,
              },
              {
                title: "Auto-Deduction",
                description: "Automatic payment from your wallet upon exit if funds are available.",
                delay: 400,
              },
              {
                title: "Special Passes",
                description: "VIP access for eligible users with special privileges.",
                delay: 500,
              },
            ].map((feature, index) => (
              <div 
                key={index}
                className={`bg-background border border-border rounded-xl p-6 transition-all duration-700 delay-${feature.delay} ${
                  isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
          
          <div 
            className={`mt-16 text-center transition-all duration-1000 delay-700 ${
              isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Link
              to="/signup"
              className="px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
            >
              Start Using SmartPark Today
            </Link>
</div>
        </div>
      </section>
  
     {/* Download Section - simplified */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold">
              Get SmartPark Mobile
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Download our Android app and manage your parking on the go
            </p>
            <Button 
              variant="default" 
              size="lg"
              onClick={handleDownload}
              className="mt-4 flex items-center"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Android APK
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Version 1.0.0 | Size: 325KB
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
