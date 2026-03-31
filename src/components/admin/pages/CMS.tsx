import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Plus, Trash2, FileText, Globe, Award, Save, Loader2, Info, HelpCircle } from 'lucide-react';

const CMS = () => {
  const [activeSubTab, setActiveSubTab] = useState('specializations');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [specializations, setSpecializations] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [content, setContent] = useState<any>({
    heroTitle: 'Find Your Perfect Coach',
    heroSubtitle: 'Connect with expert trainers and athletes to reach your fitness goals.',
    aboutText: 'FITQUEST is a premier marketplace connecting dedicated athletes with world-class coaches across all sports disciplines.',
    footerText: '© 2026 FITQUEST. All rights reserved.'
  });

  // Form states
  const [newItem, setNewItem] = useState('');
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });

  useEffect(() => {
    // Listen for specializations
    const qSpec = query(collection(db, 'specializations'));
    const unsubscribeSpec = onSnapshot(qSpec, (snapshot) => {
      setSpecializations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen for languages
    const qLang = query(collection(db, 'languages'));
    const unsubscribeLang = onSnapshot(qLang, (snapshot) => {
      setLanguages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen for FAQs
    const qFaq = query(collection(db, 'faqs'));
    const unsubscribeFaq = onSnapshot(qFaq, (snapshot) => {
      setFaqs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch content
    const fetchContent = async () => {
      const contentDoc = await getDocs(query(collection(db, 'platform_content')));
      if (!contentDoc.empty) {
        const data = contentDoc.docs[0].data();
        setContent(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    };

    fetchContent();

    return () => {
      unsubscribeSpec();
      unsubscribeLang();
      unsubscribeFaq();
    };
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const collectionName = activeSubTab === 'specializations' ? 'specializations' : 'languages';
    try {
      await addDoc(collection(db, collectionName), {
        name: newItem.trim(),
        createdAt: new Date().toISOString()
      });
      setNewItem('');
    } catch (error) {
      console.error(`Error adding ${activeSubTab}:`, error);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState<{ type: string, id: string } | null>(null);

  const handleDeleteItem = async (id: string) => {
    if (confirmDelete?.type !== activeSubTab || confirmDelete?.id !== id) {
      setConfirmDelete({ type: activeSubTab, id });
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    
    const collectionName = activeSubTab === 'specializations' ? 'specializations' : 'languages';
    try {
      await deleteDoc(doc(db, collectionName, id));
      setConfirmDelete(null);
    } catch (error) {
      console.error(`Error deleting ${activeSubTab}:`, error);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
    try {
      await addDoc(collection(db, 'faqs'), {
        ...newFaq,
        createdAt: new Date().toISOString()
      });
      setNewFaq({ question: '', answer: '' });
    } catch (error) {
      console.error("Error adding FAQ:", error);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (confirmDelete?.type !== 'faq' || confirmDelete?.id !== id) {
      setConfirmDelete({ type: 'faq', id });
      setTimeout(() => setConfirmDelete(null), 3000);
      return;
    }
    try {
      await deleteDoc(doc(db, 'faqs', id));
      setConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting FAQ:", error);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      // We use a single document for platform content
      const contentRef = doc(db, 'platform_content', 'global');
      await setDoc(contentRef, {
        ...content,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('Content saved successfully!');
    } catch (error) {
      console.error("Error saving content:", error);
      alert('Failed to save content.');
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-4xl font-black tracking-tight mb-2">Content Management</h1>
          <p className="text-gray-400 font-medium">Manage platform taxonomies and static content.</p>
        </div>
        {activeSubTab === 'content' && (
          <button 
            onClick={handleSaveContent}
            disabled={saving}
            className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-black shadow-lg shadow-black/10 hover:scale-105 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{saving ? 'Saving...' : 'Save Content'}</span>
          </button>
        )}
      </div>

      <div className="flex space-x-4 border-b border-gray-100 pb-4">
        {[
          { id: 'specializations', label: 'Specializations', icon: Award },
          { id: 'languages', label: 'Languages', icon: Globe },
          { id: 'faqs', label: 'FAQs', icon: HelpCircle },
          { id: 'content', label: 'Platform Content', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              activeSubTab === tab.id 
              ? 'bg-black text-white shadow-lg shadow-black/10' 
              : 'text-gray-400 hover:bg-gray-100 hover:text-black'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {activeSubTab === 'faqs' ? (
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-8 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-black" />
                Add New FAQ
              </h3>
              <form onSubmit={handleAddFaq} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Question</label>
                    <input 
                      type="text" 
                      value={newFaq.question}
                      onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                      placeholder="e.g. How do I book a session?"
                      className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-black transition-all font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-4">Answer</label>
                    <textarea 
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                      placeholder="Provide a clear and concise answer..."
                      rows={4}
                      className="w-full px-8 py-5 bg-gray-50 border-none rounded-3xl focus:ring-2 focus:ring-black transition-all font-bold outline-none resize-none"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-5 bg-black text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10"
                >
                  Publish FAQ
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold px-4">Active FAQs ({faqs.length})</h3>
              <div className="grid grid-cols-1 gap-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold mb-2">{faq.question}</h4>
                      <p className="text-gray-500 leading-relaxed">{faq.answer}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteFaq(faq.id)}
                      className={`p-4 rounded-3xl transition-all ${confirmDelete?.id === faq.id ? 'bg-red-600 text-white scale-110' : 'text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'}`}
                      title={confirmDelete?.id === faq.id ? "Click again to confirm" : "Delete FAQ"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {faqs.length === 0 && (
                  <div className="bg-white p-20 rounded-[40px] border border-gray-100 text-center text-gray-400 font-bold">
                    No FAQs published yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeSubTab !== 'content' ? (
          <>
            <div className="lg:col-span-2 bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-50">
                <h2 className="text-xl font-bold capitalize">Active {activeSubTab}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 p-8">
                {(activeSubTab === 'specializations' ? specializations : languages).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-gray-100 transition-all">
                    <span className="font-bold text-sm">{item.name}</span>
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className={`p-2 rounded-xl transition-all ${confirmDelete?.id === item.id ? 'bg-red-600 text-white scale-110' : 'text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100'}`}
                      title={confirmDelete?.id === item.id ? "Click again to confirm" : "Delete Item"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(activeSubTab === 'specializations' ? specializations : languages).length === 0 && (
                  <div className="col-span-2 py-10 text-center text-gray-400 font-bold">
                    No {activeSubTab} defined yet.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm h-fit sticky top-28">
              <h3 className="text-xl font-black tracking-tight mb-8 capitalize">Add {activeSubTab.slice(0, -1)}</h3>
              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Name</label>
                  <input 
                    type="text" 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={`e.g. ${activeSubTab === 'specializations' ? 'Weight Loss' : 'Spanish'}`}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-black text-white rounded-2xl text-sm font-black shadow-lg shadow-black/10 hover:scale-105 transition-all flex items-center justify-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add {activeSubTab.slice(0, -1)}</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="lg:col-span-3 grid md:grid-cols-2 gap-10">
            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Info className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight">Hero Section</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hero Title</label>
                  <input 
                    type="text" 
                    value={content.heroTitle}
                    onChange={(e) => setContent({...content, heroTitle: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Hero Subtitle</label>
                  <textarea 
                    value={content.heroSubtitle}
                    onChange={(e) => setContent({...content, heroSubtitle: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none h-32 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-black tracking-tight">General Content</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">About Us Text</label>
                  <textarea 
                    value={content.aboutText}
                    onChange={(e) => setContent({...content, aboutText: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none h-40 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Footer Text</label>
                  <input 
                    type="text" 
                    value={content.footerText}
                    onChange={(e) => setContent({...content, footerText: e.target.value})}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-black/5 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CMS;
