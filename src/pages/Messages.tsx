import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc,
  limit,
  increment
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Chat, Message, UserProfile, Call } from '../types';
import { Send, User as UserIcon, Search, ArrowLeft, MoreVertical, Phone, Video, PhoneOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import VideoCall from '../components/chat/VideoCall';

const Messages = () => {
  const { user, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeChatId = searchParams.get('chatId');
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatUsers, setChatUsers] = useState<{ [uid: string]: UserProfile }>({});
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chat));
      setChats(chatsData);
      setLoading(false);

      // Fetch user profiles for participants we don't have yet
      const uidsToFetch = new Set<string>();
      chatsData.forEach(chat => {
        chat.participants.forEach(uid => {
          if (uid !== user.uid && !chatUsers[uid]) {
            uidsToFetch.add(uid);
          }
        });
      });

      if (uidsToFetch.size > 0) {
        const newUsers: { [uid: string]: UserProfile } = { ...chatUsers };
        await Promise.all(Array.from(uidsToFetch).map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            newUsers[uid] = userDoc.data() as UserProfile;
          }
        }));
        setChatUsers(newUsers);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId || !user) return;

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', activeChatId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(messagesData);
      
      // Mark as read (simple implementation)
      const unreadCountKey = `unreadCount.${user.uid}`;
      updateDoc(doc(db, 'chats', activeChatId), {
        [unreadCountKey]: 0
      });
    });

    return () => unsubscribe();
  }, [activeChatId, user]);

  // Listen for calls
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'calls'),
      where('receiverId', '==', user.uid),
      where('status', '==', 'ringing'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Call;
        setIncomingCall(callData);
      } else {
        setIncomingCall(null);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Listen for active call in current chat
  useEffect(() => {
    if (!activeChatId || !user) return;

    const q = query(
      collection(db, 'calls'),
      where('chatId', '==', activeChatId),
      where('status', 'in', ['ringing', 'active']),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Call;
        // Only set active if we are part of it
        if (callData.callerId === user.uid || callData.receiverId === user.uid) {
          setActiveCall(callData);
        }
      } else {
        setActiveCall(null);
      }
    });

    return () => unsubscribe();
  }, [activeChatId, user]);

  const handleStartCall = async () => {
    if (!activeChatId || !user) return;
    
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    const otherUserId = activeChat.participants.find(uid => uid !== user.uid);
    if (!otherUserId) return;

    const roomName = `room_${activeChatId}_${Date.now()}`;
    
    try {
      const callRef = await addDoc(collection(db, 'calls'), {
        chatId: activeChatId,
        callerId: user.uid,
        receiverId: otherUserId,
        status: 'ringing',
        roomName,
        createdAt: new Date().toISOString()
      });

      setActiveCall({
        id: callRef.id,
        chatId: activeChatId,
        callerId: user.uid,
        receiverId: otherUserId,
        status: 'ringing',
        roomName,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const handleAcceptCall = async (call: Call) => {
    try {
      await updateDoc(doc(db, 'calls', call.id), {
        status: 'active'
      });
      setIncomingCall(null);
      setActiveCall({ ...call, status: 'active' });
      setSearchParams({ chatId: call.chatId });
    } catch (error) {
      console.error("Error accepting call:", error);
    }
  };

  const handleDeclineCall = async (call: Call) => {
    try {
      await updateDoc(doc(db, 'calls', call.id), {
        status: 'missed',
        endedAt: new Date().toISOString()
      });
      setIncomingCall(null);
    } catch (error) {
      console.error("Error declining call:", error);
    }
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      await updateDoc(doc(db, 'calls', activeCall.id), {
        status: 'ended',
        endedAt: new Date().toISOString()
      });
      setActiveCall(null);
    } catch (error) {
      console.error("Error ending call:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatId || !user) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      const activeChat = chats.find(c => c.id === activeChatId);
      if (!activeChat) return;

      const otherUserId = activeChat.participants.find(uid => uid !== user.uid);
      
      await addDoc(collection(db, 'messages'), {
        chatId: activeChatId,
        senderId: user.uid,
        text,
        timestamp: new Date().toISOString(),
        read: false
      });

      const unreadCountKey = otherUserId ? `unreadCount.${otherUserId}` : null;
      
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: text,
        lastMessageTimestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(unreadCountKey ? { [unreadCountKey]: increment(1) } : {})
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherId = chat.participants.find(uid => uid !== user?.uid);
    return otherId ? chatUsers[otherId] : null;
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-64px)] bg-white flex overflow-hidden relative">
      {/* Incoming Call Notification */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-black text-white p-4 rounded-2xl shadow-2xl flex items-center space-x-6 border border-white/10 backdrop-blur-xl"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 overflow-hidden">
                {chatUsers[incomingCall.callerId]?.photoURL ? (
                  <img src={chatUsers[incomingCall.callerId].photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Incoming Video Call</p>
                <p className="font-bold">{chatUsers[incomingCall.callerId]?.displayName || 'Someone'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleDeclineCall(incomingCall)}
                className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-all"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleAcceptCall(incomingCall)}
                className="p-3 bg-green-500 hover:bg-green-600 rounded-full transition-all animate-pulse"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Call Component */}
      <AnimatePresence>
        {activeCall && activeCall.status === 'active' && (
          <VideoCall 
            roomName={activeCall.roomName}
            displayName={profile?.displayName || 'User'}
            onClose={handleEndCall}
          />
        )}
      </AnimatePresence>

      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-96 border-r border-gray-100 flex flex-col ${activeChatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search chats..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-black transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading chats...</div>
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No messages yet.</div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat);
              const isActive = activeChatId === chat.id;
              const unreadCount = chat.unreadCount?.[user.uid] || 0;

              return (
                <button
                  key={chat.id}
                  onClick={() => setSearchParams({ chatId: chat.id })}
                  className={`w-full p-4 flex items-center space-x-4 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-gray-50 border-r-2 border-black' : ''}`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {otherUser?.photoURL ? (
                        <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <UserIcon className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`font-bold truncate ${unreadCount > 0 ? 'text-black' : 'text-gray-900'}`}>
                        {otherUser?.displayName || 'Loading...'}
                      </h3>
                      {chat.lastMessageTimestamp && (
                        <span className="text-[10px] text-gray-400 uppercase">
                          {new Date(chat.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? 'text-black font-medium' : 'text-gray-500'}`}>
                      {chat.lastMessage || 'Start a conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${!activeChatId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSearchParams({})}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                  {getOtherParticipant(chats.find(c => c.id === activeChatId)!)?.photoURL ? (
                    <img src={getOtherParticipant(chats.find(c => c.id === activeChatId)!)?.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="text-gray-300 w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold leading-tight">
                    {getOtherParticipant(chats.find(c => c.id === activeChatId)!)?.displayName || 'Loading...'}
                  </h2>
                  <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                    {activeCall?.status === 'ringing' ? 'Ringing...' : 'Online'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {activeCall ? (
                  <button 
                    onClick={handleEndCall}
                    className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all animate-pulse"
                  >
                    <PhoneOff className="w-5 h-5" />
                  </button>
                ) : (
                  <>
                    <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={handleStartCall}
                      className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center mb-8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-white px-4 py-1 rounded-full border border-gray-100">
                  Today
                </span>
              </div>
              
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-black text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100 shadow-sm'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`text-[10px] mt-1 block ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                <input 
                  type="text" 
                  placeholder="Type a message..."
                  className="flex-1 px-6 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-black transition-all outline-none"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Messages</h2>
            <p className="text-gray-500 max-w-xs">Select a conversation from the sidebar to start chatting with your coach or client.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
