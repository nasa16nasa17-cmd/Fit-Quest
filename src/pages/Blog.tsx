import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User } from 'lucide-react';

const Blog = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'blog_posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-6xl font-bold tracking-tighter mb-16">FitQuest Blog</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setSelectedPost(post)}
            className="bg-white rounded-[40px] border border-gray-100 shadow-sm cursor-pointer hover:shadow-xl transition-all group overflow-hidden flex flex-col"
          >
            {post.imageUrl && (
              <div className="h-48 overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="p-8 flex-grow flex flex-col">
              <h2 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">{post.title}</h2>
              <p className="text-gray-500 mb-6 line-clamp-3 flex-grow">{post.content}</p>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center mt-auto">
                <Calendar className="w-3 h-3 mr-1" />
                {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()} 
                <span className="mx-2">•</span>
                <User className="w-3 h-3 mr-1" />
                {post.authorName}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center space-x-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {selectedPost.createdAt?.toDate ? selectedPost.createdAt.toDate().toLocaleDateString() : new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center"><User className="w-3 h-3 mr-1" /> {selectedPost.authorName}</span>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-12 overflow-y-auto">
                {selectedPost.imageUrl && (
                  <div className="mb-10 rounded-[30px] overflow-hidden h-64 md:h-96">
                    <img 
                      src={selectedPost.imageUrl} 
                      alt={selectedPost.title} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <h2 className="text-4xl font-bold mb-8 tracking-tight">{selectedPost.title}</h2>
                <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {selectedPost.content}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Blog;
