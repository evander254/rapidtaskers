import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { MessageSquare, Send, User, Plus, Search, X } from 'lucide-react';
import Button from '../components/ui/Button';

function Messages() {
  const { user, profile } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [taskersList, setTaskersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!user) return;
    const initializeChat = async () => {
      if (isAdmin) {
        await fetchAdminConversations();
        await fetchTaskersList();

        if (targetUserId) {
          // Check if we already have a conversation with this user
          const existing = conversations.find(c => c.otherUser?.id === targetUserId);
          if (existing) {
            setActiveConversationId(existing.id);
          } else {
            // Check database specifically for this user if not in recent list
            const { data: participations } = await supabase
              .from('conversation_participants')
              .select('conversation_id')
              .eq('user_id', targetUserId);

            if (participations && participations.length > 0) {
              // Find if any of these conversations also have the current user
              const convIds = participations.map(p => p.conversation_id);
              const { data: myParticipations } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', user.id)
                .in('conversation_id', convIds);

              if (myParticipations && myParticipations.length > 0) {
                setActiveConversationId(myParticipations[0].conversation_id);
                fetchAdminConversations(); // Refresh list to show it
              } else {
                startConversationWithTasker(targetUserId);
              }
            } else {
              startConversationWithTasker(targetUserId);
            }
          }
        }
      } else {
        await fetchTaskerConversation();
      }
    };

    initializeChat();

    // Subscribe to new conversations for Admin
    if (isAdmin) {
      const channel = supabase
        .channel('admin_conversations')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'conversations' },
          () => fetchAdminConversations()
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    }
  }, [user, isAdmin, targetUserId]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${activeConversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${activeConversationId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            if (payload.new.sender_id !== user.id) {
              markAsRead(payload.new.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAdminConversations = async () => {
    try {
      setLoading(true);
      // Fetch conversations and participants
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          conversation_participants (
            user_id,
            profiles ( id, full_name, role )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format for UI
      const formatted = data.map(conv => {
        const otherParticipant = conv.conversation_participants.find(p => p.profiles.id !== user.id)?.profiles;
        return {
          id: conv.id,
          otherUser: otherParticipant || { full_name: 'Unknown User' }
        };
      });

      setConversations(formatted);
      if (formatted.length > 0 && !activeConversationId && !targetUserId) {
        setActiveConversationId(formatted[0].id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskersList = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'tasker')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTaskersList(data || []);
    } catch (error) {
      console.error('Error fetching taskers:', error);
    }
  };

  const startConversationWithTasker = async (taskerId) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(c => c.otherUser?.id === taskerId);
      if (existingConv) {
        setActiveConversationId(existingConv.id);
        setShowNewChat(false);
        return;
      }

      // Create new conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: taskerId }
      ]);

      await fetchAdminConversations();
      setActiveConversationId(conv.id);
      setShowNewChat(false);
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const fetchTaskerConversation = async () => {
    try {
      setLoading(true);
      // Find if tasker has a conversation
      const { data: participations, error } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (error) throw error;

      if (participations && participations.length > 0) {
        setActiveConversationId(participations[0].conversation_id);
      } else {
        // Create new conversation
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert({})
          .select()
          .single();

        if (convError) throw convError;

        await supabase.from('conversation_participants').insert([
          { conversation_id: conv.id, user_id: user.id }
        ]);

        // Try to add admin
        const { data: admin } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'admin')
          .limit(1)
          .single();

        if (admin) {
          await supabase.from('conversation_participants').insert([
            { conversation_id: conv.id, user_id: admin.id }
          ]);
        }

        setActiveConversationId(conv.id);
      }
    } catch (error) {
      console.error('Error fetching/creating tasker conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, profiles:sender_id(full_name)`)
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read
      const unreadIds = data.filter(m => !m.read && m.sender_id !== user.id).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unreadIds);
        // Also mark corresponding notifications as read
        await supabase.from('notifications').update({ read: true }).in('reference_id', unreadIds).eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const markAsRead = async (msgId) => {
    await supabase.from('messages').update({ read: true }).eq('id', msgId);
    await supabase.from('notifications').update({ read: true }).eq('reference_id', msgId).eq('user_id', user.id);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: activeConversationId,
        sender_id: user.id,
        message: msgText
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      // Could add a toast here
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-60px)] flex flex-col">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
          <MessageSquare size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin ? 'Manage conversations with taskers' : 'Chat with the platform administrators'}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex overflow-hidden">
        {/* Sidebar for Admin */}
        {isAdmin && (
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-900/50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <span className="font-semibold text-gray-900 dark:text-white">
                {showNewChat ? 'New Message' : 'Conversations'}
              </span>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                {showNewChat ? <X size={18} /> : <Plus size={18} />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              {showNewChat ? (
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search taskers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {taskersList
                      .filter(t => t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((tasker) => (
                        <li
                          key={tasker.id}
                          onClick={() => startConversationWithTasker(tasker.id)}
                          className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <User size={18} />
                          </div>
                          <div className="flex-1 truncate">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {tasker.full_name || 'Unknown Tasker'}
                            </p>
                          </div>
                        </li>
                      ))}
                    {taskersList.filter(t => t.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                      <li className="p-4 text-sm text-gray-500 text-center">No taskers found.</li>
                    )}
                  </ul>
                </div>
              ) : (
                conversations.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No active conversations.</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {conversations.map((conv) => (
                      <li
                        key={conv.id}
                        onClick={() => setActiveConversationId(conv.id)}
                        className={`p-4 cursor-pointer transition-colors flex items-center gap-3 ${activeConversationId === conv.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent'
                          }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                          <User size={18} />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {conv.otherUser?.full_name || 'Unknown Tasker'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!isAdmin ? 'w-full' : ''}`}>
          {activeConversationId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {isAdmin
                      ? conversations.find(c => c.id === activeConversationId)?.otherUser?.full_name
                      : 'Support Admin'}
                  </p>
                  <p className="text-xs text-green-500 font-medium">Online</p>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30 no-scrollbar">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm mt-10">
                    Send a message to start the conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isMine
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                          }`}>
                          <p className="text-sm break-words">{msg.message}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isMine && msg.read && <span className="ml-1 text-indigo-500 dark:text-indigo-400">· Read</span>}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white transition-all outline-none"
                  />
                  <Button type="submit" disabled={!newMessage.trim()} className="rounded-xl px-4 shrink-0">
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col gap-3 text-gray-500 dark:text-gray-400">
              <MessageSquare size={48} className="opacity-20" />
              <p>Select a conversation to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
