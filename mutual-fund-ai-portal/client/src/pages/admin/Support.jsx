import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Search, Send, User, MessageSquare, ShieldCheck, Mail, Activity, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import { BACKEND_URL } from '../../services/api';

const Support = () => {
  const { user } = useAuthStore();
  const [investors, setInvestors] = useState([]);
  const [activeInvestor, setActiveInvestor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  async function fetchInvestors() {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chat/investors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInvestors(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const newSocket = io(BACKEND_URL);
    setTimeout(() => setSocket(newSocket), 0);
    setTimeout(() => fetchInvestors(), 0);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMsg = (message) => {
      if (activeInvestor && (activeInvestor._id === message.investorId || activeInvestor.id === message.investorId)) {
        setMessages((prev) => [...prev, message]);
      }
      fetchInvestors(); // update list
    };

    socket.on('receiveMessage', handleReceiveMsg);
    return () => socket.off('receiveMessage', handleReceiveMsg);
  }, [socket, activeInvestor]);

  const fetchHistory = async (investorId) => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/chat/history/${investorId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvestorSelect = (investor) => {
    if (activeInvestor && socket) {
      const prevId = activeInvestor._id || activeInvestor.id;
      socket.emit('leaveChat', prevId);
    }
    setActiveInvestor(investor);
    const invId = investor._id || investor.id;
    fetchHistory(invId);
    if (socket) {
      socket.emit('joinChat', invId);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !activeInvestor) return;

    const currentUserId = user._id || user.id;
    const invId = activeInvestor._id || activeInvestor.id;

    const messageData = {
      investorId: invId,
      senderId: currentUserId,
      senderRole: 'admin',
      text: inputText.trim(),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, messageData]);
    socket.emit('sendMessage', messageData);
    setInputText('');
  };

  const filteredInvestors = investors.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    inv.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-[calc(100vh-8rem)] font-inter">
      <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-1">Administrative Terminal</p>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Support <span className="text-indigo-600">Operations</span></h1>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Relay Active</span>
             </div>
             <div className="bg-indigo-600/10 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-600/20">
                {investors.length} Investors in Queue
             </div>
          </div>
        </header>

        <div className="flex-1 flex gap-8 min-h-0">
          {/* Sidebar: Investor List */}
          <div className="w-80 lg:w-96 flex flex-col ui-card p-0 overflow-hidden dark:bg-slate-900/40">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={e => setSearchQuery(e.target.value)}
                   placeholder="Search frequency..." 
                   className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                 />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredInvestors.length === 0 ? (
                <div className="p-10 text-center text-slate-400">
                   <p className="text-[10px] font-black uppercase tracking-widest">No signals found</p>
                </div>
              ) : (
                filteredInvestors.map((inv) => {
                  const invId = inv._id || inv.id;
                  const isActive = (activeInvestor?._id || activeInvestor?.id) === invId;
                  return (
                    <button
                      key={invId}
                      onClick={() => handleInvestorSelect(inv)}
                      className={`w-full text-left p-6 flex items-center gap-4 transition-all border-b border-slate-50 dark:border-slate-800/50 relative overflow-hidden group ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                    >
                      {isActive && <div className="absolute left-0 top-0 w-1 h-full bg-indigo-600" />}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {inv.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-black text-sm tracking-tight truncate ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{inv.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 truncate uppercase tracking-tighter">{inv.email}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col ui-card p-0 overflow-hidden dark:bg-slate-900/40 relative">
            {activeInvestor ? (
              <>
                <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-transparent">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-xl">
                       {activeInvestor.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{activeInvestor.name}</h2>
                      <div className="flex items-center gap-3 mt-0.5">
                         <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest"><Activity size={10} /> Active Session</span>
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Mail size={10} /> {activeInvestor.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="p-3 text-slate-400 hover:text-indigo-600 transition-colors rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10"><ShieldCheck size={20} /></button>
                  </div>
                </header>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 dark:bg-transparent">
                  {messages.map((msg, idx) => {
                    const isMine = msg.senderRole === 'admin';
                    return (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: isMine ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[80%] md:max-w-[70%]`}>
                          <div className={`p-4 md:p-5 rounded-[24px] shadow-sm text-sm font-bold leading-relaxed tracking-tight ${
                            isMine 
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-br-sm' 
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-sm shadow-indigo-500/5'
                          }`}>
                            {msg.text}
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2 px-2">
                             {isMine ? 'Admin Response' : 'Investor Transmission'} • {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={sendMessage} className="p-6 bg-white dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Transmit to ${activeInvestor.name}...`}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="w-14 h-14 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center shrink-0"
                  >
                    <Send size={24} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 rounded-[40px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-2xl">
                  <MessageSquare size={40} className="text-slate-200 dark:text-slate-700" />
                </div>
                <div className="max-w-xs">
                  <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter uppercase">Station Standby</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest leading-loose">Select an encrypted transmission stream to begin assistance.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
