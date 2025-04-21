
import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Only show the toggle after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    // Save to localStorage for persistence
    localStorage.setItem("ui-theme", newTheme);
    
    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`,
      duration: 1500,
    });
  };

  // Don't render anything until component has mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-muted transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5 transition-all animate-in" />
      ) : (
        <Sun className="h-5 w-5 transition-all animate-in" />
      )}
    </button>
  );
};

export default ThemeToggle;
