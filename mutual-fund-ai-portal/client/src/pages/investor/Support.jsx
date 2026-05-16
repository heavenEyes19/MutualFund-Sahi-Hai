import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Send, Sparkles } from 'lucide-react';
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
      socket.emit('joinChat', invId);
      fetchHistory();
    }
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMsg = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('receiveMessage', handleReceiveMsg);

    return () => {
      socket.off('receiveMessage', handleReceiveMsg);
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
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, messageData]);

    socket.emit('sendMessage', messageData);
    setInputText('');
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto h-[calc(100vh-6rem)]">
      <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-2xl">
          <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl border border-blue-200 dark:border-blue-500/30">
            <Sparkles className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Support & Docs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Chat directly with our admin team for assistance</p>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50 dark:bg-gray-950">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 space-y-4">
              <Sparkles size={48} className="text-gray-300 dark:text-gray-700" />
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">How can we help you today?</p>
                <p className="text-sm mt-1">Send a message and an admin will respond shortly.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = msg.senderRole === 'investor';
              return (
                <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                    isMine 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 rounded-b-2xl">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="bg-blue-600 text-white p-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 flex items-center justify-center"
          >
            <Send size={20} className={inputText.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default Support;
