import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Menu,
  X,
  BookOpen,
  Settings,
  PiggyBank,
  Wallet,
  Trophy,
  Target,
  Star,
  Heart,
  Gamepad
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Group } from "@/api/entities";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSelectedGroupId, setSelectedGroupId as saveSelectedGroupId, getGroups, setGroups as saveGroups } from "@/utils/groupStorage";

// Define groupIcons before it's used in the component
const groupIcons = {
  piggyBank: { icon: PiggyBank, color: "bg-pink-100 text-pink-600" },
  wallet: { icon: Wallet, color: "bg-purple-100 text-purple-600" },
  users: { icon: Users, color: "bg-blue-100 text-blue-600" },
  trophy: { icon: Trophy, color: "bg-yellow-100 text-yellow-600" },
  target: { icon: Target, color: "bg-red-100 text-red-600" },
  star: { icon: Star, color: "bg-indigo-100 text-indigo-600" },
  heart: { icon: Heart, color: "bg-rose-100 text-rose-600" },
  gamepad: { icon: Gamepad, color: "bg-green-100 text-green-600" }
};

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    document.title = "Poker Cashflow";
    
    const metaTags = [
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Poker Cashflow" },
      { name: "application-name", content: "Poker Cashflow" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" }
    ];
    
    metaTags.forEach(tag => {
      let meta = document.querySelector(`meta[name="${tag.name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = tag.name;
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });
    
    // Set theme color for PWA
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = "theme-color";
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = "#ef4444";

    return () => {
      // Clean up code if needed
    };
  }, []);

  useEffect(() => {
    const savedGroups = getGroups();
    if (savedGroups.length > 0) {
      setGroups(savedGroups);
    }
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      const fetchedGroups = await Group.list();
      setGroups(fetchedGroups);
      saveGroups(fetchedGroups);
      
      const savedGroupId = getSelectedGroupId();
      setSelectedGroupId(savedGroupId);
      
      if (fetchedGroups.length === 0) {
        setSelectedGroupId(null);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupChange = async (groupId) => {
    setSelectedGroupId(groupId);
    saveSelectedGroupId(groupId);
    window.location.reload();
  };

  const navItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: createPageUrl("Dashboard")
    },
    {
      name: "Players",
      icon: Users,
      href: createPageUrl("Players")
    },
    {
      name: "Sessions",
      icon: CalendarDays,
      href: createPageUrl("Sessions")
    },
    {
      name: "Groups",
      icon: PiggyBank,
      href: createPageUrl("Groups")
    },
    {
      name: "Description",
      icon: BookOpen,
      href: createPageUrl("Description")
    },
    {
      name: "Settings",
      icon: Settings,
      href: createPageUrl("Settings")
    }
  ];

  const getBarColor = (value) => {
    if (value > 100) return "bg-green-500"; // High value
    if (value > 50) return "bg-yellow-500"; // Medium value
    return "bg-red-500"; // Low value
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <style>{`
        :root {
          --safe-top: env(safe-area-inset-top);
          --safe-bottom: env(safe-area-inset-bottom);
          --safe-left: env(safe-area-inset-left);
          --safe-right: env(safe-area-inset-right);
        }
        
        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-padded-top {
            padding-top: env(safe-area-inset-top);
          }
          .safe-padded-bottom {
            padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
          }
          .safe-padded-left {
            padding-left: env(safe-area-inset-left);
          }
          .safe-padded-right {
            padding-right: env(safe-area-inset-right);
          }
        }
      `}</style>
      
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 safe-padded-top safe-padded-left safe-padded-bottom",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex items-center justify-center bg-red-600 rounded-full text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M21.5,6c-1.381,0-2.5-1.119-2.5-2.5S20.119,1,21.5,1S24,2.119,24,3.5S22.881,6,21.5,6z M17.5,8C16.119,8,15,6.881,15,5.5
                  S16.119,3,17.5,3S20,4.119,20,5.5S18.881,8,17.5,8z M10.5,8C9.119,8,8,6.881,8,5.5S9.119,3,10.5,3S13,4.119,13,5.5
                  S11.881,8,10.5,8z M6.5,6C5.119,6,4,4.881,4,3.5S5.119,1,6.5,1S9,2.119,9,3.5S7.881,6,6.5,6z M2.5,11C1.119,11,0,9.881,0,8.5
                  S1.119,6,2.5,6S5,7.119,5,8.5S3.881,11,2.5,11z M6.5,23c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5
                  S7.881,23,6.5,23z M2.5,18c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5S3.881,18,2.5,18z M21.5,23
                  c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5S22.881,23,21.5,23z M17.5,21
                  c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5S18.881,21,17.5,21z M10.5,21
                  c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5S11.881,21,10.5,21z M10.5,15
                  c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5s2.5,1.119,2.5,2.5S11.881,15,10.5,15z"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold">Poker Cashflow</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <Select 
            value={selectedGroupId || ""} 
            onValueChange={handleGroupChange}
            disabled={loadingGroups}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loadingGroups ? "Loading groups..." : "Select a group"} />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[200px]">
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${groupIcons[group.icon || 'piggyBank'].color}`}>
                        {React.createElement(
                          groupIcons[group.icon || 'piggyBank'].icon,
                          { className: 'w-4 h-4' }
                        )}
                      </div>
                      {group.name}
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <nav className="p-4 space-y-2 pb-[calc(16px+var(--safe-bottom))]">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
                currentPageName === item.name && "bg-red-50 text-red-700"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="lg:hidden bg-white border-b p-4 safe-padded-top safe-padded-left safe-padded-right pt-[calc(16px+var(--safe-top))]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 safe-padded-bottom pb-[calc(16px+var(--safe-bottom))]">{children}</main>
      </div>
    </div>
  );
}
