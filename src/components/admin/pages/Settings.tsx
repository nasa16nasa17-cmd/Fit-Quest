import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  DollarSign, 
  Globe, 
  Mail, 
  Lock, 
  User, 
  Save, 
  ChevronRight,
  Info,
  Loader2,
  Activity,
  Layers
} from 'lucide-react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('platform');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings state
  const [commission, setCommission] = useState(15);
  const [platformName, setPlatformName] = useState('Sporty');
  const [supportEmail, setSupportEmail] = useState('support@sporty.com');
  const [currency, setCurrency] = useState('USD ($)');
  const [timezone, setTimezone] = useState('UTC (GMT+0)');
  
  const [notifications, setNotifications] = useState({
    emailNewTrainerApplication: true,
    emailBookingConfirmation: true,
    emailPayoutRequest: true,
    emailFlaggedContent: true,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'platform_settings', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCommission(data.commissionPercentage || 15);
        setPlatformName(data.platformName || 'Sporty');
        setSupportEmail(data.supportEmail || 'support@sporty.com');
        setCurrency(data.currency || 'USD ($)');
        setTimezone(data.timezone || 'UTC (GMT+0)');
        if (data.notifications) {
          setNotifications(data.notifications);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'platform_settings', 'global'), {
        commissionPercentage: commission,
        platformName,
        supportEmail,
        currency,
        timezone,
        notifications,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      // Show success toast if available, or just log
      console.log("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const [seeding, setSeeding] = useState(false);

  const [confirmSeed, setConfirmSeed] = useState(false);

  const handleSeedData = async () => {
    if (!confirmSeed) {
      setConfirmSeed(true);
      setTimeout(() => setConfirmSeed(false), 3000);
      return;
    }
    setSeeding(true);
    try {
      const { collection, getDocs, addDoc } = await import('firebase/firestore');
      
      // Seed Categories
      const catSnap = await getDocs(collection(db, 'categories'));
      if (catSnap.empty) {
        const defaultCats = [
          { name: 'Football', description: 'Soccer coaching and training', icon: 'Target' },
          { name: 'Basketball', description: 'Hoops and skills development', icon: 'Zap' },
          { name: 'Tennis', description: 'Court skills and strategy', icon: 'Activity' },
          { name: 'Fitness', description: 'General fitness and conditioning', icon: 'Dumbbell' },
          { name: 'Yoga', description: 'Mindfulness and flexibility', icon: 'Heart' },
          { name: 'Combat Sports', description: 'Boxing, MMA, and martial arts', icon: 'Zap' },
        ];
        for (const cat of defaultCats) {
          await addDoc(collection(db, 'categories'), { ...cat, createdAt: serverTimestamp() });
        }
      }

      // Seed Specializations
      const specSnap = await getDocs(collection(db, 'specializations'));
      if (specSnap.empty) {
        const defaultSpecs = [
          { name: 'Weight Loss' }, { name: 'Muscle Gain' }, { name: 'Endurance' },
          { name: 'Agility' }, { name: 'Mental Coaching' }, { name: 'Nutrition' },
          { name: 'Injury Recovery' }, { name: 'Youth Training' }, { name: 'Pro Athlete' }
        ];
        for (const spec of defaultSpecs) {
          await addDoc(collection(db, 'specializations'), { ...spec, createdAt: serverTimestamp() });
        }
      }

      // Seed Languages
      const langSnap = await getDocs(collection(db, 'languages'));
      if (langSnap.empty) {
        const defaultLangs = [
          { name: 'English' }, { name: 'Spanish' }, { name: 'French' },
          { name: 'German' }, { name: 'Italian' }, { name: 'Portuguese' },
          { name: 'Arabic' }, { name: 'Chinese' }, { name: 'Japanese' }
        ];
        for (const lang of defaultLangs) {
          await addDoc(collection(db, 'languages'), { ...lang, createdAt: serverTimestamp() });
        }
      }

      // Seed FAQs
      const faqSnap = await getDocs(collection(db, 'faqs'));
      if (faqSnap.empty) {
        const defaultFaqs = [
          { 
            question: 'How do I book a session?', 
            answer: 'Browse our list of expert coaches, select a profile that matches your needs, and click the "Book Session" button. You can choose between one-off sessions or monthly coaching plans.' 
          },
          { 
            question: 'What is the platform fee?', 
            answer: 'FitQuest charges a 15% commission on all bookings to maintain the platform and provide secure payment processing and support.' 
          },
          { 
            question: 'How do I become a coach?', 
            answer: 'Click on the "Become a Coach" button in the navigation bar, fill out the application form with your credentials and experience, and our team will review your application within 48 hours.' 
          },
          { 
            question: 'Are the payments secure?', 
            answer: 'Yes, all payments are processed through Stripe, a world-class secure payment gateway. We do not store your credit card information on our servers.' 
          },
          { 
            question: 'Can I cancel a booking?', 
            answer: 'Cancellations are subject to the coach\'s individual policy. Generally, you can cancel up to 24 hours before a session for a full refund. Please check the specific terms on the coach\'s profile.' 
          }
        ];
        for (const faq of defaultFaqs) {
          await addDoc(collection(db, 'faqs'), { ...faq, createdAt: serverTimestamp() });
        }
      }

      alert('Platform data seeded successfully!');
    } catch (error) {
      console.error("Error seeding data:", error);
      alert('Error seeding data. Check console.');
    } finally {
      setSeeding(false);
    }
  };

  const tabs = [
    { id: 'platform', label: 'Platform Settings', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing & Payouts', icon: DollarSign },
    { id: 'maintenance', label: 'Maintenance', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Platform Settings</h1>
          <p className="text-gray-400 font-medium">Configure global rules and platform behavior.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-black shadow-lg shadow-black/10 hover:scale-105 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-10">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-200 group ${
                  isActive 
                  ? 'bg-black text-white shadow-lg shadow-black/10' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-black'}`} />
                  <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-white/50" />}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-10">
            {activeTab === 'platform' && (
              <>
                <div className="space-y-6">
                  <h3 className="text-xl font-black tracking-tight">General Configuration</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Platform Name</label>
                      <input 
                        type="text" 
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Support Email</label>
                      <input 
                        type="email" 
                        value={supportEmail}
                        onChange={(e) => setSupportEmail(e.target.value)}
                        placeholder="support@sporty.com"
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-blue-50 rounded-3xl flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <span className="font-bold text-xl">%</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 mb-1">Platform Commission</h4>
                    <p className="text-sm text-blue-700/70 mb-4 font-medium">This percentage is automatically deducted from every booking transaction.</p>
                    <div className="flex items-center space-x-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="50" 
                        value={commission}
                        onChange={(e) => setCommission(parseInt(e.target.value))}
                        className="w-48 accent-blue-600"
                      />
                      <span className="text-2xl font-black text-blue-900">{commission}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-black tracking-tight">Regional Settings</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Default Currency</label>
                      <select 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none appearance-none"
                      >
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                        <option>GBP (£)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Timezone</label>
                      <select 
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none appearance-none"
                      >
                        <option>UTC (GMT+0)</option>
                        <option>EST (GMT-5)</option>
                        <option>PST (GMT-8)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <h3 className="text-xl font-black tracking-tight">Email Notifications</h3>
                <div className="space-y-4">
                  {[
                    { id: 'emailNewTrainerApplication', label: 'New Trainer Application', desc: 'Notify admins when a new coach applies.' },
                    { id: 'emailBookingConfirmation', label: 'Booking Confirmation', desc: 'Send email when a booking is confirmed.' },
                    { id: 'emailPayoutRequest', label: 'Payout Requests', desc: 'Alert when a trainer requests a payout.' },
                    { id: 'emailFlaggedContent', label: 'Flagged Content', desc: 'Notify moderators of reported reviews or messages.' },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group hover:bg-gray-100 transition-all">
                      <div>
                        <h4 className="font-bold text-sm mb-1">{item.label}</h4>
                        <p className="text-xs text-gray-400 font-medium">{item.desc}</p>
                      </div>
                      <div 
                        onClick={() => toggleNotification(item.id as keyof typeof notifications)}
                        className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-200 ${
                          notifications[item.id as keyof typeof notifications] ? 'bg-black' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                          notifications[item.id as keyof typeof notifications] ? 'right-1' : 'left-1'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'maintenance' && (
              <div className="space-y-8">
                <h3 className="text-xl font-black tracking-tight">System Maintenance</h3>
                <div className="p-8 bg-orange-50 rounded-3xl flex items-start space-x-4">
                  <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                    <Info className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-orange-900 mb-1">Seed Initial Data</h4>
                    <p className="text-sm text-orange-700/70 mb-6 font-medium">
                      If your platform is new, you can seed default categories, specializations, and languages to help trainers get started with their applications.
                    </p>
                    <button 
                      onClick={handleSeedData}
                      disabled={seeding}
                      className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center space-x-2 disabled:opacity-50 ${confirmSeed ? 'bg-red-600 text-white scale-105' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                    >
                      {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                      <span>{seeding ? 'Seeding...' : confirmSeed ? 'Click again to confirm' : 'Seed Default Data'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
