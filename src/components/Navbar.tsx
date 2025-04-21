
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { useMobile } from "@/hooks/use-mobile";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, LogOut, Home, CreditCard, QrCode, Calendar, ParkingCircle } from "lucide-react";
import logoHorizontal from "../assets/logo/logo-horizontal.svg";

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const isMobile = useMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const navbarStyle = isScrolled
    ? "sticky top-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    : "bg-transparent";

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav
      className={`${navbarStyle} z-50 w-full transition-all duration-200`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logoHorizontal} 
              alt="SmartPark"
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {isMobile ? (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[80%] sm:w-[350px]">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/">
                    <Button
                      variant={isActive("/") ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      <Home className="mr-2 h-4 w-4" />
                      Home
                    </Button>
                  </Link>

                  {user ? (
                    <>
                      <Link to="/dashboard">
                        <Button
                          variant={isActive("/dashboard") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/booking">
                        <Button
                          variant={isActive("/booking") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <ParkingCircle className="mr-2 h-4 w-4" />
                          Book Parking
                        </Button>
                      </Link>
                      <Link to="/qrcode">
                        <Button
                          variant={isActive("/qrcode") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <QrCode className="mr-2 h-4 w-4" />
                          My QR Code
                        </Button>
                      </Link>
                      <Link to="/profile">
                        <Button
                          variant={isActive("/profile") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Profile
                        </Button>
                      </Link>
                      {isAdmin() && (
                        <Link to="/admin">
                          <Button
                            variant={isActive("/admin") ? "default" : "ghost"}
                            className="w-full justify-start"
                          >
                            <User className="mr-2 h-4 w-4" />
                            Admin Dashboard
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                        onClick={logout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login">
                        <Button
                          variant={isActive("/login") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button
                          variant={isActive("/login") ? "default" : "ghost"}
                          className="w-full justify-start"
                        >
                          Sign Up
                        </Button>
                      </Link>
                    </>
                  )}

                  <Link to="/contact">
                    <Button
                      variant={isActive("/contact") ? "default" : "ghost"}
                      className="w-full justify-start"
                    >
                      Contact
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="flex items-center gap-2">
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink asDiv={true} 
                    className={navigationMenuTriggerStyle() + (isActive("/") ? " bg-accent text-accent-foreground" : "")}
                  >
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>

              {user ? (
                <>
                  <NavigationMenuItem>
                    <Link to="/dashboard">
                      <NavigationMenuLink asDiv={true}
                        className={navigationMenuTriggerStyle() + (isActive("/dashboard") ? " bg-accent text-accent-foreground" : "")}
                      >
                        Dashboard
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/booking">
                      <NavigationMenuLink asDiv={true}
                        className={navigationMenuTriggerStyle() + (isActive("/booking") ? " bg-accent text-accent-foreground" : "")}
                      >
                        Book Parking
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/qrcode">
                      <NavigationMenuLink asDiv={true}
                        className={navigationMenuTriggerStyle() + (isActive("/qrcode") ? " bg-accent text-accent-foreground" : "")}
                      >
                        My QR Code
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  {isAdmin() && (
                    <NavigationMenuItem>
                      <Link to="/admin">
                        <NavigationMenuLink asDiv={true}
                          className={navigationMenuTriggerStyle() + (isActive("/admin") ? " bg-accent text-accent-foreground" : "")}
                        >
                          Admin
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  )}
                  
                  <NavigationMenuItem>
                    <Link to="/contact">
                      <NavigationMenuLink asDiv={true}
                        className={navigationMenuTriggerStyle() + (isActive("/contact") ? " bg-accent text-accent-foreground" : "")}
                      >
                        Contact
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <User className="h-4 w-4" />
                          <span>{user.name?.split(" ")[0] || "User"}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-background border-border">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="cursor-pointer w-full">
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-700"
                          onClick={logout}
                        >
                          Logout
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </NavigationMenuItem>
                </>
              ) : (
                <>
                  <NavigationMenuItem>
                    <Link to="/contact">
                      <NavigationMenuLink asDiv={true}
                        className={navigationMenuTriggerStyle() + (isActive("/contact") ? " bg-accent text-accent-foreground" : "")}
                      >
                        Contact
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/login">
                      <Button
                        variant="outline"
                        className="font-medium"
                      >
                        Login
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                  
                  <NavigationMenuItem>
                    <Link to="/signup">
                      <Button 
			className="font-medium">Sign Up</Button>
                    </Link>
                  </NavigationMenuItem>
                </>
              )}
              <NavigationMenuItem>
                <ThemeToggle />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
