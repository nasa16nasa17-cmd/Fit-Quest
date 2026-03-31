import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  Star, 
  Layers, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AdminSidebar = ({ activeTab, setActiveTab }: SidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trainers', label: 'Trainers', icon: UserCheck },
    { id: 'buyers', label: 'Buyers', icon: Users },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'reports', label: 'Reports', icon: AlertTriangle },
    { id: 'cms', label: 'CMS', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col sticky top-0">
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <span className="font-black text-xl tracking-tight">SPORTY<span className="text-gray-400">ADMIN</span></span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 group ${
                  isActive 
                  ? 'bg-black text-white shadow-lg shadow-black/10' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-gray-50">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-200 group">
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm tracking-tight">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
