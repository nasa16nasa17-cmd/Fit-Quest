import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../lib/firebase';
import { LogOut, User, Menu, X, Search, Bell, Info, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/');
  };

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold tracking-tighter text-black">FITQUEST</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Link to="/browse" className="text-gray-500 hover:text-black px-3 py-2 text-sm font-medium">Browse Trainers</Link>
              <Link to="/about" className="text-gray-500 hover:text-black px-3 py-2 text-sm font-medium">About</Link>
              <Link to="/faq" className="text-gray-500 hover:text-black px-3 py-2 text-sm font-medium">FAQ</Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-500 hover:text-black transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                      >
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                          <h3 className="font-black text-[10px] tracking-widest uppercase text-gray-400">Notifications</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-50">
                          {notifications.length > 0 ? notifications.map((notif) => (
                            <div 
                              key={notif.id} 
                              className={`p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                              onClick={() => markAsRead(notif.id)}
                            >
                              <div className={`p-1.5 rounded-lg ${
                                notif.type === 'success' ? 'bg-green-100 text-green-600' : 
                                notif.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                <Info className="w-3 h-3" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-xs leading-tight mb-0.5">{notif.title}</h4>
                                <p className="text-[10px] text-gray-500 leading-tight mb-1">{notif.message}</p>
                                <span className="text-[8px] text-gray-400 font-bold">
                                  {notif.createdAt?.toDate ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : 'just now'}
                                </span>
                              </div>
                            </div>
                          )) : (
                            <div className="p-8 text-center">
                              <p className="text-xs text-gray-400 font-medium">No notifications yet.</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isAdmin && (
                  <Link to="/dashboard" className="text-black bg-gray-100 px-3 py-2 rounded-full text-sm font-bold flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link to="/messages" className="text-gray-500 hover:text-black px-3 py-2 text-sm font-medium">Messages</Link>
                {profile?.role === 'buyer' && (
                  <Link to="/apply" className="text-black border border-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                    Become a Coach
                  </Link>
                )}
                <Link to="/dashboard" className="text-gray-500 hover:text-black px-3 py-2 text-sm font-medium">Dashboard</Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-black p-2">
                  <LogOut className="w-5 h-5" />
                </button>
                <Link to="/profile" className="flex items-center space-x-2">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="w-8 h-8 rounded-full border border-gray-200" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-500 hover:text-black px-3 py-2 text-sm font-medium">Log in</Link>
                <Link to="/signup" className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                  Join as Client
                </Link>
                <Link to="/apply" className="text-black border border-black px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
                  Become a Coach
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-500 hover:text-black p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-b border-gray-100"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link to="/browse" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-black">Browse Trainers</Link>
              <Link to="/about" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-black">About</Link>
              {isAdmin && (
                <Link to="/dashboard" className="block px-3 py-2 text-base font-bold text-black bg-gray-50 rounded-xl">Admin Dashboard</Link>
              )}
              {user ? (
                <Link to="/dashboard" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-black">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-black">Log in</Link>
                  <Link to="/signup" className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-black">Sign up</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
