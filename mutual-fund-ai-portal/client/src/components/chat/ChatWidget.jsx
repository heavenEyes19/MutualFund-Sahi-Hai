import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../../store/useAuthStore';
import { MessageSquare, X, Send } from 'lucide-react';
import axios from 'axios';

const ChatWidget = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user && user.role === 'investor') {
      const newSocket = io('http://localhost:5000');
      setTimeout(() => setSocket(newSocket), 0);

      const currentUserId = user._id || user.id;
      newSocket.emit('joinChat', currentUserId);

      newSocket.on('receiveMessage', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // Fetch history
      const fetchHistory = async () => {
        try {
          const res = await axios.get('http://localhost:5000/api/chat/history', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setMessages(res.data);
        } catch (error) {
          console.error("Failed to fetch chat history", error);
        }
      };
      
      fetchHistory();

      return () => newSocket.disconnect();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!user || user.role !== 'investor') return null;

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !socket) return;

    const currentUserId = user._id || user.id;

    const messageData = {
      investorId: currentUserId,
      senderId: currentUserId,
      senderRole: 'investor',
      text: inputText.trim(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, messageData]);

    socket.emit('sendMessage', messageData);
    setInputText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-80 h-96 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <h3 className="font-semibold">Support Chat</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-4">
                Send a message to start chatting with an admin.
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderRole === 'investor';
                return (
                  <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="ml-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition-transform hover:scale-110 flex items-center justify-center"
        >
          <MessageSquare size={24} />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
