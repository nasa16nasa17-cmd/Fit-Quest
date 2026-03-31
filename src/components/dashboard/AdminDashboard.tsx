import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sendNotification } from '../../lib/notifications';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from '../admin/AdminSidebar';
import AdminHeader from '../admin/AdminHeader';
import Overview from '../admin/pages/Overview';
import TrainerManagement from '../admin/pages/TrainerManagement';
import BuyerManagement from '../admin/pages/BuyerManagement';
import BookingManagement from '../admin/pages/BookingManagement';
import ReviewManagement from '../admin/pages/ReviewManagement';
import CategoryManagement from '../admin/pages/CategoryManagement';
import RevenueManagement from '../admin/pages/RevenueManagement';
import Settings from '../admin/pages/Settings';
import Reports from '../admin/pages/Reports';
import CMS from '../admin/pages/CMS';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingTrainers, setPendingTrainers] = useState<any[]>([]);
  const [allTrainers, setAllTrainers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 124500,
    activeTrainers: 0,
    totalBuyers: 0,
    commission: 18675
  });

  useEffect(() => {
    if (!user) return;

    console.log("AdminDashboard: Checking admin status for", user.email);
    
    // Listen for pending trainers
    const qPending = query(collection(db, 'trainers'), where('isApproved', '==', false));
    const unsubscribePending = onSnapshot(qPending, async (snapshot) => {
      try {
        const trainersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const trainersWithProfiles = await Promise.all(trainersData.map(async (trainer: any) => {
          try {
            // Use getDoc with the document ID (which is the UID)
            const userSnap = await getDoc(doc(db, 'users', trainer.userId || trainer.id));
            const userData = userSnap.exists() ? userSnap.data() : null;
            return { ...trainer, user: userData };
          } catch (err) {
            console.error("Error fetching user for trainer:", trainer.userId, err);
            return { ...trainer, user: null };
          }
        }));
        setPendingTrainers(trainersWithProfiles);
      } catch (error) {
        console.error("Error processing pending trainers snapshot:", error);
      }
    }, (error) => {
      console.error("Permission error in pending trainers snapshot:", error);
    });

    // Listen for all approved trainers to manage verification
    const qAll = query(collection(db, 'trainers'), where('isApproved', '==', true));
    const unsubscribeAll = onSnapshot(qAll, async (snapshot) => {
      try {
        const trainersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const trainersWithProfiles = await Promise.all(trainersData.map(async (trainer: any) => {
          try {
            const userSnap = await getDoc(doc(db, 'users', trainer.userId || trainer.id));
            const userData = userSnap.exists() ? userSnap.data() : null;
            return { ...trainer, user: userData };
          } catch (err) {
            console.error("Error fetching user for trainer:", trainer.userId, err);
            return { ...trainer, user: null };
          }
        }));
        setAllTrainers(trainersWithProfiles);
        setLoading(false);
      } catch (error) {
        console.error("Error processing approved trainers snapshot:", error);
        setLoading(false);
      }
    }, (error) => {
      console.error("Permission error in approved trainers snapshot:", error);
      setLoading(false);
    });

    // Fetch stats
    const fetchStats = async () => {
      try {
        // Fetch commission from settings
        const settingsSnap = await getDocs(query(collection(db, 'platform_settings'), where('__name__', '==', 'global')));
        const commissionRate = settingsSnap.empty ? 0.15 : (settingsSnap.docs[0].data().commissionPercentage / 100);

        const activeTrainersQuery = query(collection(db, 'trainers'), where('isApproved', '==', true));
        const activeTrainersSnap = await getDocs(activeTrainersQuery);
        
        const buyersQuery = query(collection(db, 'users'), where('role', '==', 'buyer'));
        const buyersSnap = await getDocs(buyersQuery);

        const paymentsSnap = await getDocs(collection(db, 'payments'));
        let totalRevenue = 0;
        paymentsSnap.forEach(doc => {
          totalRevenue += doc.data().amount || 0;
        });

        const commission = totalRevenue * commissionRate;

        setStats(prev => ({
          ...prev,
          activeTrainers: activeTrainersSnap.size,
          totalBuyers: buyersSnap.size,
          totalRevenue,
          commission
        }));
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      }
    };

    fetchStats();

    // Listen for categories
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);
    }, (error) => {
      console.error("Error listening to categories:", error);
    });

    return () => {
      unsubscribePending();
      unsubscribeAll();
      unsubscribeCategories();
    };
  }, [user]);

  const handleApprove = async (trainerId: string) => {
    try {
      const response = await fetch('/api/trainers/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId,
          adminId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve trainer');
      }
    } catch (error) {
      console.error("Error approving trainer:", error);
    }
  };

  const handleToggleVerify = async (trainerId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'trainers', trainerId), { isVerified: !currentStatus });
      
      if (!currentStatus) {
        await sendNotification(
          trainerId,
          'Profile Verified!',
          'Your coach profile has been verified by our team. You now have a verification badge on your profile.',
          'success',
          '/dashboard'
        );
      }
    } catch (error) {
      console.error("Error toggling verification:", error);
    }
  };

  const handleSuspendBuyer = async (buyerId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
      await updateDoc(doc(db, 'users', buyerId), { 
        status: newStatus,
        updatedAt: serverTimestamp() 
      });
      
      await sendNotification(
        buyerId,
        newStatus === 'suspended' ? 'Account Suspended' : 'Account Re-activated',
        newStatus === 'suspended' 
          ? 'Your account has been suspended by an administrator. Please contact support for more information.'
          : 'Your account has been re-activated. You can now use the platform again.',
        newStatus === 'suspended' ? 'error' : 'success',
        '/dashboard'
      );
    } catch (error) {
      console.error("Error toggling buyer suspension:", error);
    }
  };

  const handleReject = async (trainerId: string) => {
    try {
      const response = await fetch('/api/trainers/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId,
          adminId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject trainer');
      }
    } catch (error) {
      console.error("Error rejecting trainer:", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview stats={stats} pendingTrainers={pendingTrainers} loading={loading} categories={categories} setActiveTab={setActiveTab} />;
      case 'trainers':
        return (
          <TrainerManagement 
            pendingTrainers={pendingTrainers} 
            allTrainers={allTrainers} 
            loading={loading} 
            handleApprove={handleApprove} 
            handleReject={handleReject} 
            handleToggleVerify={handleToggleVerify} 
          />
        );
      case 'buyers':
        return <BuyerManagement handleSuspend={handleSuspendBuyer} />;
      case 'bookings':
        return <BookingManagement />;
      case 'reviews':
        return <ReviewManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'cms':
        return <CMS />;
      case 'settings':
        return <Settings />;
      case 'reports':
        return <Reports />;
      case 'revenue':
        return <RevenueManagement stats={stats} />;
      default:
        return <Overview stats={stats} pendingTrainers={pendingTrainers} loading={loading} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="p-10 max-w-[1600px] mx-auto w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
