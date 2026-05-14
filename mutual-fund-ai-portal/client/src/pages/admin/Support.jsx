import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Search, Send, User } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Support = () => {
  const { user } = useAuthStore();
  const [investors, setInvestors] = useState([]);
  const [activeInvestor, setActiveInvestor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  async function fetchInvestors() {
    try {
      const res = await axios.get('http://localhost:5000/api/chat/investors', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setInvestors(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setTimeout(() => setSocket(newSocket), 0);

    // Initial fetch of investors who chatted
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

    return () => {
      socket.off('receiveMessage', handleReceiveMsg);
    };
  }, [socket, activeInvestor]);



  const fetchHistory = async (investorId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/history/${investorId}`, {
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
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, messageData]);

    socket.emit('sendMessage', messageData);
    setInputText('');
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex gap-6">
      <div className="w-1/3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Support Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search investors..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {investors.map((inv) => {
            const invId = inv._id || inv.id;
            return (
            <button
              key={invId}
              onClick={() => handleInvestorSelect(inv)}
              className={`w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${(activeInvestor?._id || activeInvestor?.id) === invId ? 'bg-blue-50 dark:bg-gray-800 border-l-4 border-l-blue-600' : ''}`}
            >
              <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                <User className="text-gray-600 dark:text-gray-300" size={20} />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">{inv.name}</p>
                <p className="text-xs text-gray-500">{inv.email}</p>
              </div>
            </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col">
        {activeInvestor ? (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <div className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                <User className="text-gray-600 dark:text-gray-300" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{activeInvestor.name}</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-gray-950">
              {messages.map((msg, idx) => {
                const isMine = msg.senderRole === 'admin';
                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-xl shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeInvestor.name}...`}
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select an investor to view chat history
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
