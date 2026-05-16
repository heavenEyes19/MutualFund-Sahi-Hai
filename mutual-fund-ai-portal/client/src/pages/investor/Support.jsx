import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Send, Sparkles, MessageCircle, ShieldCheck, Clock, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import { BACKEND_URL } from '../../services/api';

const Support = () => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setTimeout(() => setSocket(newSocket), 0);

    return () => newSocket.disconnect();
  }, []);

  const fetchHistory = async () => {
    if (!user || (!user._id && !user.id)) return;
    const invId = user._id || user.id;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chat/history/${invId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error("Error fetching chat history:", err);
    }
  };

  useEffect(() => {
    if (user && socket) {
      const invId = user._id || user.id;
      
      const onConnect = () => {
        socket.emit('joinChat', invId);
      };

      if (socket.connected) {
        onConnect();
      }
      
      socket.on('connect', onConnect);
      fetchHistory();

      return () => {
        socket.off('connect', onConnect);
      };
    }
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMsg = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    const handleChatCleared = () => {
      setMessages([]);
    };

    socket.on('receiveMessage', handleReceiveMsg);
    socket.on('chatCleared', handleChatCleared);

    return () => {
      socket.off('receiveMessage', handleReceiveMsg);
      socket.off('chatCleared', handleChatCleared);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !user) return;

    const invId = user._id || user.id;

    const messageData = {
      investorId: invId,
      senderId: invId,
      senderRole: 'investor',
      text: inputText.trim(),
      timestamp: new Date()
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, messageData]);

    socket.emit('sendMessage', messageData);
    setInputText('');
  };

  return (
    <div className="w-full h-[calc(100vh-8rem)] font-inter">
      <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1">Direct Assistance</p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Support <span className="text-indigo-600">Terminal</span></h1>
          </div>
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 px-4 rounded-2xl shadow-sm">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Admins Online</span>
          </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-0">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col ui-card p-0 overflow-hidden dark:bg-slate-900/40 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-slate-50/30 dark:bg-transparent">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-24 h-24 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-2xl">
                    <Sparkles size={40} className="text-slate-200 dark:text-slate-700" />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">System Ready</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">How can our neural networks assist you today? An admin will respond shortly.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMine = msg.senderRole === 'investor';
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
                        <div className={`p-4 md:p-5 rounded-[24px] shadow-sm text-sm font-bold leading-relaxed tracking-tight ${
                          isMine 
                            ? 'bg-indigo-600 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2 px-2">
                           {isMine ? 'Sent' : 'Admin'} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 md:p-6 bg-white dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your transmission here..."
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-14 h-14 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center shrink-0"
              >
                <Send size={24} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </form>
          </div>

          {/* Info Sidebar (Desktop) */}
          <div className="hidden lg:flex flex-col w-80 gap-6">
             <div className="ui-card p-8 dark:bg-slate-900/40">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-6 flex items-center gap-2">
                   <ShieldCheck size={16} /> Compliance Data
                </h3>
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                         <Clock size={18} className="text-slate-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Time</p>
                         <p className="text-xs font-black text-slate-900 dark:text-white">~ 15 Minutes</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                         <MessageCircle size={18} className="text-slate-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tickets Open</p>
                         <p className="text-xs font-black text-slate-900 dark:text-white">0 Active Issues</p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="ui-card p-8 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border border-indigo-100 dark:border-none shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 dark:bg-white/5 blur-[40px] pointer-events-none rounded-full" />
                <h3 className="text-slate-900 dark:text-white font-black text-sm tracking-tight mb-4">Need Priority Support?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed mb-6">Our Premium AI tier includes dedicated account managers and sub-second execution speeds.</p>
                <button className="w-full py-3 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">Upgrade Terminal</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
