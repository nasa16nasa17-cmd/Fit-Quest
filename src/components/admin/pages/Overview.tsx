import React from 'react';
import { 
  TrendingUp, 
  Users, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  User
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, bookings: 240 },
  { name: 'Feb', revenue: 3000, bookings: 139 },
  { name: 'Mar', revenue: 2000, bookings: 980 },
  { name: 'Apr', revenue: 2780, bookings: 390 },
  { name: 'May', revenue: 1890, bookings: 480 },
  { name: 'Jun', revenue: 2390, bookings: 380 },
  { name: 'Jul', revenue: 3490, bookings: 430 },
];

const Overview = ({ stats, pendingTrainers, loading, categories, setActiveTab }: any) => {
  const summaryCards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toLocaleString()}`, trend: '+12.5%', isUp: true, icon: DollarSign, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Trainers', value: stats.activeTrainers, trend: '+4.2%', isUp: true, icon: UserCheck, color: 'bg-green-50 text-green-600' },
    { label: 'Total Buyers', value: stats.totalBuyers, trend: '+8.1%', isUp: true, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Commission (15%)', value: `$${stats.commission.toLocaleString()}`, trend: '+12.5%', isUp: true, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Platform Overview</h1>
          <p className="text-gray-400 font-medium">Real-time performance and growth analytics.</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all">Download Report</button>
          <button className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:scale-105 transition-all">Manage Payouts</button>
        </div>
      </div>

      {(!loading && categories && categories.length === 0) && (
        <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 rounded-2xl text-orange-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-orange-900">Platform Setup Required</h4>
              <p className="text-sm text-orange-700">You haven't added any sport categories yet. Trainers won't be able to apply until you do.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('settings')}
            className="px-6 py-3 bg-orange-600 text-white rounded-2xl text-sm font-bold hover:bg-orange-700 transition-all"
          >
            Go to Settings
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-black ${card.isUp ? 'text-green-500' : 'text-red-500'}`}>
                <span>{card.trend}</span>
                {card.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              </div>
            </div>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</h3>
            <p className="text-3xl font-black tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black tracking-tight">Revenue Growth</h3>
            <select className="bg-gray-50 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
              <option>Last 7 Months</option>
              <option>Last 12 Months</option>
            </select>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#999'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#999'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 700}}
                />
                <Area type="monotone" dataKey="revenue" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black tracking-tight mb-10">Recent Applications</h3>
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-20 text-gray-400 font-bold">Loading...</div>
            ) : pendingTrainers.length === 0 ? (
              <div className="text-center py-20 text-gray-400 font-bold">No pending apps.</div>
            ) : pendingTrainers.slice(0, 5).map((trainer: any) => (
              <div key={trainer.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 overflow-hidden">
                    {trainer.user?.photoURL ? (
                      <img src={trainer.user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="text-gray-300 w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-none mb-1">{trainer.user?.displayName || 'Unknown'}</h4>
                    <p className="text-xs text-gray-400 font-bold">{trainer.sport}</p>
                  </div>
                </div>
                <button className="p-2 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-black group-hover:text-white transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-4 bg-gray-50 text-gray-500 rounded-2xl text-sm font-black hover:bg-gray-100 transition-all">View All Applications</button>
        </div>
      </div>
    </div>
  );
};

export default Overview;
