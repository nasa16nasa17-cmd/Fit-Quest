import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Linkedin, Facebook } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="text-2xl font-bold tracking-tighter text-black mb-4 block">FITQUEST</Link>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              The world's leading marketplace for elite fitness and performance coaching. Connect with top trainers globally.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-black"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-black"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-black"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="text-gray-400 hover:text-black"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Marketplace</h3>
            <ul className="space-y-2">
              <li><Link to="/browse" className="text-gray-500 hover:text-black text-sm">Browse Trainers</Link></li>
              <li><Link to="/browse?category=personal-training" className="text-gray-500 hover:text-black text-sm">Personal Training</Link></li>
              <li><Link to="/browse?category=yoga" className="text-gray-500 hover:text-black text-sm">Yoga & Pilates</Link></li>
              <li><Link to="/browse?category=nutrition" className="text-gray-500 hover:text-black text-sm">Nutrition</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-500 hover:text-black text-sm">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-500 hover:text-black text-sm">Contact</Link></li>
              <li><Link to="/faq" className="text-gray-500 hover:text-black text-sm">FAQ</Link></li>
              <li><Link to="/apply" className="text-gray-500 hover:text-black text-sm">Become a Coach</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-black uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/terms" className="text-gray-500 hover:text-black text-sm">Terms of Service</Link></li>
              <li><Link to="/privacy" className="text-gray-500 hover:text-black text-sm">Privacy Policy</Link></li>
              <li><Link to="/cookies" className="text-gray-500 hover:text-black text-sm">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-xs mb-4 md:mb-0">
            © 2026 FitQuest Marketplace. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <span className="text-gray-400 text-xs">English (US)</span>
            <span className="text-gray-400 text-xs">USD ($)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
