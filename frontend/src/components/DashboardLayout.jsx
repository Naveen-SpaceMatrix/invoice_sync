import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  Mail,
  Download,
  PlayCircle,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import axios from "axios";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/invoices", label: "Invoices", icon: FileText },
  { path: "/email-scans", label: "Email Scans", icon: Mail },
  { path: "/attachments", label: "Attachments", icon: Download },
  { path: "/workflow", label: "Workflow", icon: PlayCircle },
  { path: "/settings", label: "Settings", icon: Settings },
];

const DashboardLayout = ({ children, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    navigate("/", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 glass border-r border-[#27272A]
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[#27272A]">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#FF5E00] rounded-md flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-['IBM_Plex_Sans'] font-bold text-lg text-white">
                InvoiceSync
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-md
                    transition-all duration-200
                    ${active 
                      ? 'bg-[#FF5E00]/10 text-[#FF5E00] border border-[#FF5E00]/20' 
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#1E1E1E]'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-['Manrope'] font-medium text-sm">{item.label}</span>
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-[#27272A]">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-10 h-10 border border-[#27272A]">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-[#1E1E1E] text-white font-['IBM_Plex_Sans']">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                <p className="text-xs text-[#52525B] truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              data-testid="logout-btn"
              className="w-full bg-transparent border-[#27272A] hover:border-[#FF2A2A]/50 hover:text-[#FF2A2A] text-[#A1A1AA]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 glass border-b border-[#27272A] px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="mobile-menu-btn"
              className="lg:hidden text-white hover:bg-[#1E1E1E]"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-[#52525B]">InvoiceSync</span>
              <ChevronRight className="w-4 h-4 text-[#27272A]" />
              <span className="text-white font-medium">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>

            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF94] animate-pulse" />
              <span className="text-xs text-[#52525B] hidden sm:inline">System Active</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="px-4 lg:px-8 py-4 border-t border-[#27272A]">
          <div className="flex items-center justify-between text-xs text-[#52525B]">
            <span>n8n Invoice Workflow Dashboard</span>
            <span className="font-['JetBrains_Mono']">v1.0.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
