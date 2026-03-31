import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'credit' | 'debit' | 'payout';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  createdAt: any;
}

const WalletDashboard = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, transactionsRes] = await Promise.all([
        fetch(`/api/wallet/balance?userId=${user?.uid}`),
        fetch(`/api/wallet/transactions?userId=${user?.uid}`)
      ]);
      
      if (!balanceRes.ok || !transactionsRes.ok) {
        throw new Error("Failed to fetch wallet data");
      }
      
      const balanceData = await balanceRes.json();
      const transactionsData = await transactionsRes.json();
      
      setBalance(balanceData.balance || 0);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    if (balance <= 0) return;
    setPayoutLoading(true);
    try {
      const response = await fetch('/api/wallet/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.uid, amount: balance })
      });
      if (response.ok) {
        fetchWalletData();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (error) {
      console.error("Error requesting payout:", error);
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5" /> Wallet Balance
        </h2>
        <div className="text-4xl font-bold mb-4">${balance.toFixed(2)}</div>
        <button 
          onClick={handlePayout} 
          disabled={balance <= 0 || payoutLoading}
          className="bg-black text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
        >
          {payoutLoading ? <Loader2 className="animate-spin" /> : 'Request Payout'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-lg font-bold mb-4">Transaction History</h2>
        <div className="space-y-4">
          {transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {t.type === 'credit' ? <ArrowDownLeft className="text-green-500" /> : <ArrowUpRight className="text-red-500" />}
                <div>
                  <div className="font-bold capitalize">{t.type}</div>
                  <div className="text-sm text-gray-500">{new Date(t.createdAt.seconds * 1000).toLocaleDateString()}</div>
                </div>
              </div>
              <div className={`font-bold ${t.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                {t.type === 'credit' ? '+' : '-'}${t.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletDashboard;
