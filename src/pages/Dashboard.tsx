import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  User,
  CreditCard,
  Shield,
  MessageSquare
} from 'lucide-react';

// Role-specific dashboards
import WalletDashboard from '../components/dashboard/WalletDashboard';
import BuyerDashboard from '../components/dashboard/BuyerDashboard';
import TrainerDashboard from '../components/dashboard/TrainerDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import BookingCalendar from '../components/dashboard/BookingCalendar';
import ProfileSettings from '../components/dashboard/ProfileSettings';
import AvailabilityManagement from '../components/dashboard/AvailabilityManagement';
import TrainerSettings from './TrainerSettings';
import TrainerEarnings from '../components/dashboard/TrainerEarnings';
import TrainerClients from '../components/dashboard/TrainerClients';
import TrainerReviews from '../components/dashboard/TrainerReviews';
import BuyerCoaches from '../components/dashboard/BuyerCoaches';

const Dashboard = () => {
  const { profile, isAdmin, isTrainer, isBuyer } = useAuth();
  const location = useLocation();

  const sidebarLinks = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'trainer', 'buyer'] },
    { name: 'Messages', path: '/messages', icon: MessageSquare, roles: ['trainer', 'buyer'] },
    { name: 'Bookings', path: '/dashboard/bookings', icon: Calendar, roles: ['trainer', 'buyer'] },
    { name: 'Coaches', path: '/dashboard/coaches', icon: Users, roles: ['buyer'] },
    { name: 'Availability', path: '/dashboard/availability', icon: Clock, roles: ['trainer'] },
    { name: 'Clients', path: '/dashboard/clients', icon: Users, roles: ['trainer'] },
    { name: 'Trainer Approvals', path: '/dashboard/approvals', icon: Shield, roles: ['admin'] },
    { name: 'Reviews', path: '/dashboard/reviews', icon: Star, roles: ['trainer'] },
    { name: 'Earnings', path: '/dashboard/earnings', icon: TrendingUp, roles: ['trainer'] },
    { name: 'Wallet', path: '/dashboard/wallet', icon: CreditCard, roles: ['trainer'] },
    { name: 'Trainer Profile', path: '/dashboard/trainer-settings', icon: Settings, roles: ['trainer'] },
    { name: 'Profile Settings', path: '/dashboard/profile', icon: User, roles: ['trainer', 'buyer'] },
    { name: 'Account Settings', path: '/dashboard/settings', icon: Settings, roles: ['admin', 'trainer', 'buyer'] },
  ].filter(link => link.roles.includes(profile?.role || ''));

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden lg:flex flex-col sticky top-16 h-[calc(100vh-64px)]">
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    isActive 
                    ? 'bg-black text-white' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-100">
              {profile?.photoURL && <img src={profile.photoURL} alt="" className="w-full h-full rounded-full object-cover" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{profile?.displayName}</p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 lg:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={
              isAdmin ? <AdminDashboard /> : 
              isTrainer ? <TrainerDashboard /> : 
              <BuyerDashboard />
            } />
            <Route path="/bookings" element={<BookingCalendar />} />
            <Route path="/coaches" element={<BuyerCoaches />} />
            <Route path="/availability" element={<AvailabilityManagement />} />
            <Route path="/clients" element={<TrainerClients />} />
            <Route path="/reviews" element={<TrainerReviews />} />
            <Route path="/earnings" element={<TrainerEarnings />} />
            <Route path="/wallet" element={<WalletDashboard />} />
            <Route path="/trainer-settings" element={<TrainerSettings />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="/settings" element={<div className="py-20 text-center">Account Settings (Coming Soon)</div>} />
            {isAdmin && <Route path="/approvals" element={<AdminDashboard />} />}
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
