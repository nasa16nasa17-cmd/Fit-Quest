import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { motion } from 'motion/react';
import { Chrome, Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignUp = location.pathname === '/signup';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'buyer' | 'trainer'>('buyer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: user.email === 'nasa16nasa17@gmail.com' ? 'admin' : role, // Use selected role
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', result.user.uid), {
          uid: result.user.uid,
          email: email,
          displayName: displayName,
          role: email === 'nasa16nasa17@gmail.com' ? 'admin' : role, // Use selected role
          createdAt: new Date().toISOString(),
          status: 'active'
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] shadow-xl p-8 lg:p-12 border border-gray-100"
      >
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold tracking-tighter text-black mb-4 block">FITQUEST</Link>
          <h2 className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-gray-500 mt-2">
            {isSignUp ? 'Join the elite coaching marketplace' : 'Log in to manage your performance'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2" /> {error}
          </div>
        )}

        {isSignUp && (
          <div className="flex p-1 bg-gray-50 rounded-2xl mb-8">
            <button
              onClick={() => setRole('buyer')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                role === 'buyer' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Athlete
            </button>
            <button
              onClick={() => setRole('trainer')}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                role === 'trainer' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Coach
            </button>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center space-x-3 py-4 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all mb-6"
        >
          <Chrome className="w-5 h-5" />
          <span>Continue with Google</span>
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400">or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Full Name"
                required
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="email" 
              placeholder="Email Address"
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="password" 
              placeholder="Password"
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </form>

        <p className="text-center text-gray-500 mt-8 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isSignUp ? '/login' : '/signup'} className="text-black font-bold hover:underline">
            {isSignUp ? 'Log in' : 'Sign up'}
          </Link>
        </p>
        <p className="text-center text-gray-400 mt-8 text-[10px] uppercase tracking-widest font-bold">
          By continuing, you agree to our{' '}
          <Link to="/terms" className="text-black hover:underline">Terms of Service</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
