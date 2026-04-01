import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Search, HelpCircle, Loader2 } from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const FAQ = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("general");

  useEffect(() => {
    const q = query(collection(db, 'faqs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    (activeCategory === 'all' || faq.category === activeCategory) &&
    (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-white min-h-screen py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">Got Questions?</h1>
          <p className="text-xl text-gray-500 mb-12">Everything you need to know about the FitQuest experience.</p>
          
          <div className="flex justify-center space-x-4 mb-12">
            {['general', 'trainers', 'buyers'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-full font-bold capitalize ${activeCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search for answers..."
              className="w-full pl-16 pr-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:bg-white focus:border-black transition-all outline-none text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gray-200" />
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No FAQs found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div 
                key={faq.id} 
                className={`border rounded-[32px] transition-all duration-300 ${
                  activeIndex === index ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'
                }`}
              >
                <button 
                  className="w-full px-8 py-8 flex items-center justify-between text-left"
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                >
                  <span className="text-xl font-bold">{faq.question}</span>
                  {activeIndex === index ? (
                    <Minus className="w-6 h-6 flex-shrink-0" />
                  ) : (
                    <Plus className="w-6 h-6 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {activeIndex === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-gray-600 text-lg leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        <div className="mt-24 p-12 bg-black text-white rounded-[40px] text-center">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-gray-400 mb-8">Our support team is available 24/7 to help you with anything you need.</p>
          <button className="bg-white text-black px-10 py-4 rounded-full font-bold hover:bg-gray-100 transition-all">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
