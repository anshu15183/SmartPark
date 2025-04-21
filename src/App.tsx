
import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/ui/theme-provider";
import { Toaster as RadixToaster } from "./components/ui/toaster";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PrivateRoutes, AdminRoutes, AuthRoutes } from "./components/ProtectedRoutes";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OtpVerification from "./pages/OtpVerification";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Contact from "./pages/Contact";
import QRCode from "./pages/QRCode";
import Booking from "./pages/Booking";
import EntryKiosk from "./pages/EntryKiosk";
import ExitKiosk from "./pages/ExitKiosk";
import BarrierGates from "./pages/BarrierGates";
import DownloadInstructions from "./pages/DownloadInstructions";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserRoles from "./pages/AdminUserRoles";
import AdminSpecialPasses from "./pages/AdminSpecialPasses";
import AdminFloors from "./pages/AdminFloors";
import AdminPayments from "./pages/AdminPayments";
import AdminDefaulters from "./pages/AdminDefaulters";
import AdminBookings from "./pages/AdminBookings";

// Create QueryClient
const queryClient = new QueryClient();

// Auth pages that don't need Navbar and Footer
const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/otp-verification'];

// Kiosk and special pages that don't need Navbar and Footer
const specialPaths = ['/kiosk/entry', '/kiosk/exit'];

function App() {
const location = useLocation();
  const normalizedPathname = location.pathname.toLowerCase();
  const isAuthPage = authPaths.some(path => normalizedPathname === path.toLowerCase());
  const isSpecialPage = specialPaths.some(path => normalizedPathname.startsWith(path.toLowerCase()));

  return (
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {!isAuthPage && !isSpecialPage && <Navbar />}
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/contact" element={<Contact />} />
	    <Route path="/download-instructions" element={<DownloadInstructions />} />            

            {/* Auth Routes (redirect if logged in) */}
            <Route element={<AuthRoutes />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/otp-verification" element={<OtpVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
            
            {/* Protected Routes (require login) */}
            <Route element={<PrivateRoutes />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/qrcode" element={<QRCode />} />
              <Route path="/qrcode/:type" element={<QRCode />} />
              <Route path="/barrier-gates" element={<BarrierGates />} />
              <Route path="/barrier-gates/:userId" element={<BarrierGates />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<AdminRoutes />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/user-roles" element={<AdminUserRoles />} />
              <Route path="/admin/special-passes" element={<AdminSpecialPasses />} />
              <Route path="/admin/floors" element={<AdminFloors />} />
              <Route path="/admin/payments" element={<AdminPayments />} />
              <Route path="/admin/defaulters" element={<AdminDefaulters />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
            </Route>
            
            {/* Kiosk Routes */}
            <Route path="/kiosk/entry" element={<EntryKiosk />} />
            <Route path="/kiosk/exit" element={<ExitKiosk />} />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {!isAuthPage && !isSpecialPage && <Footer />}
          <RadixToaster />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
