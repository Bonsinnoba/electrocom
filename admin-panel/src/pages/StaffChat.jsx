import React, { useState, useEffect, useRef } from 'react';
import { fetchBackend, formatImageUrl } from '../services/api';
import { Send, MapPin, Search, Megaphone, Users, ChevronDown, Paperclip, X, Settings } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useConfirm } from '../context/ConfirmContext';

// Extracted Components
import MaintenanceModal from '../components/StaffChat/MaintenanceModal';
import ChatSidebar from '../components/StaffChat/ChatSidebar';
import MessageFeed from '../components/StaffChat/MessageFeed';

export default function StaffChat() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState('global'); // 'global' or user ID
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // { id, message, name }
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const [broadcastOptions, setBroadcastOptions] = useState({
    isPinned: false,
    sendEmail: false,
    sendSms: false
  });

  const { addToast } = useNotifications();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  const currentUser = JSON.parse(localStorage.getItem('ehub_user') || '{}');
  const isAdminOrManager = ['super', 'admin', 'manager'].includes(currentUser.role);
  const isSuper = currentUser.role === 'super';

  const [showMaintenance, setShowMaintenance] = useState(false);
  const [maintStats, setMaintStats] = useState(null);
  const [maintLoading, setMaintLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const data = await fetchBackend('/admin_chat.php?action=users');
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      addToast('Error fetching staff list', 'error');
    }
  };

  const fetchMessages = async () => {
    try {
      const withUser = activeChat === 'global' ? 'global' : activeChat;
      const data = await fetchBackend(`/admin_chat.php?action=history&with_user=${withUser}`);
      if (data.success) {
        setMessages(data.messages || []);
        if (activeChat !== 'global') {
          await fetchBackend('/admin_chat.php?action=mark_read', {
            method: 'POST',
            body: JSON.stringify({ with_user: activeChat })
          });
          setUsers(prev => prev.map(u => u.id === activeChat ? { ...u, unread_count: 0 } : u));
        }
      }
    } catch (err) {
      addToast('Error fetching messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(() => {
        // Only poll if tab is active to save resources/rate-limits
        if (document.visibilityState === 'visible') {
            fetchUsers();
        }
    }, 20000); // Increased from 10s to 20s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    const interval = setInterval(() => {
        // High priority: Only poll if tab is focused and user is active in chat
        if (document.visibilityState === 'visible') {
            fetchMessages();
        }
    }, 5000); // Increased from 3s to 5s
    return () => clearInterval(interval);
  }, [activeChat]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 150;
      if (isAtBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setShowScrollButton(true);
      }
    }
  }, [messages]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      if (isAtBottom) {
        setShowScrollButton(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollButton(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachmentBase64) return;

    const payload = {
      message: newMessage.trim() || (attachmentBase64 ? 'Sent an attachment' : ''),
      receiver_id: activeChat === 'global' ? 'global' : activeChat,
      is_pinned: activeChat === 'global' ? broadcastOptions.isPinned : false,
      send_email: activeChat === 'global' ? broadcastOptions.sendEmail : false,
      send_sms: activeChat === 'global' ? broadcastOptions.sendSms : false,
      attachment_base64: attachmentBase64,
      reply_to_id: replyTo?.id || null
    };

    setNewMessage('');
    setAttachmentBase64(null);
    setAttachmentPreview(null);
    setReplyTo(null);
    try {
      const data = await fetchBackend('/admin_chat.php?action=send', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (data.success) {
        if (data.broadcast) addToast(data.broadcast, 'success');
        setBroadcastOptions({ isPinned: false, sendEmail: false, sendSms: false });
        fetchMessages();
        setTimeout(scrollToBottom, 500);
      } else {
        addToast(data.error || 'Failed to send message', 'error');
      }
    } catch (err) {
       addToast('Network error', 'error');
    }
  };

  const togglePin = async (msgId, currentState) => {
    try {
      const res = await fetchBackend('/admin_chat.php?action=pin', {
        method: 'POST',
        body: JSON.stringify({ message_id: msgId, is_pinned: !currentState })
      });
      if (res.success) {
        fetchMessages();
      }
    } catch (e) {
      addToast('Error toggling pin status', 'error');
    }
  };

  const fetchMaintStats = async () => {
    setMaintLoading(true);
    try {
      const data = await fetchBackend('/admin_chat_maintenance.php?action=stats');
      if (data.success) setMaintStats(data.stats);
    } catch (err) {
      addToast('Failed to fetch maintenance stats', 'error');
    } finally {
      setMaintLoading(false);
    }
  };

  const handleMaintenanceAction = async (action, body = {}) => {
    if (!(await confirm(`Are you sure you want to perform: ${action}?`))) return;
    setMaintLoading(true);
    try {
      const data = await fetchBackend(`/admin_chat_maintenance.php?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      if (data.success) {
        addToast(data.message, 'success');
        fetchMaintStats();
      } else {
        addToast(data.error || 'Action failed', 'error');
      }
    } catch (err) {
      addToast('Network error', 'error');
    } finally {
      setMaintLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      addToast('File too large. Maximum size is 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentBase64(event.target.result);
      if (file.type.startsWith('image/')) {
        setAttachmentPreview(event.target.result);
      } else {
        setAttachmentPreview('file_icon');
      }
    };
    reader.readAsDataURL(file);
  };

  const clearAttachment = () => {
    setAttachmentBase64(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getInitials = (user) => {
     if (user.avatar_text) return user.avatar_text;
     return user.name ? user.name.slice(0, 2).toUpperCase() : '??';
  };

  const pinnedMessages = messages.filter(m => m.is_pinned == 1);
  const activeChatUser = activeChat !== 'global' ? users.find(u => u.id === activeChat) : null;

  return (
    <div className="animate-fade-in" style={{ padding: '0 0 32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
           <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Staff Hub</h1>
           <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>Team collaboration & internal announcements</p>
        </div>
        {isSuper && (
          <button 
            onClick={() => { setShowMaintenance(true); fetchMaintStats(); }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', 
              borderRadius: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)',
              fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s'
            }}
          >
            <Settings size={18} /> Maintenance
          </button>
        )}
      </div>

      <MaintenanceModal 
        show={showMaintenance} 
        onClose={() => setShowMaintenance(false)} 
        loading={maintLoading} 
        stats={maintStats} 
        onAction={handleMaintenanceAction} 
      />

      <div className="staff-chat-container" style={{ 
        display: 'flex', height: 'calc(100vh - 190px)', background: 'var(--bg-surface)', 
        borderRadius: '24px', border: '1px solid var(--border-light)', overflow: 'hidden',
        boxShadow: 'var(--shadow-premium, 0 8px 30px rgba(0,0,0,0.05))'
      }}>
        <ChatSidebar 
          users={users} 
          activeChat={activeChat} 
          setActiveChat={setActiveChat} 
          isAdminOrManager={isAdminOrManager} 
          broadcastOptions={broadcastOptions} 
          setBroadcastOptions={setBroadcastOptions}
          formatImageUrl={formatImageUrl}
          getInitials={getInitials}
        />

        <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {activeChat === 'global' ? (
                <>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Global Staff Channel</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Visible to all staff</div>
                  </div>
                </>
              ) : activeChatUser ? (
                <>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--secondary-blue)', color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {activeChatUser.profile_image ? (
                      <img src={formatImageUrl(activeChatUser.profile_image)} alt={activeChatUser.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      getInitials(activeChatUser)
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{activeChatUser.name}</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{activeChatUser.role.replace('_', ' ')}</div>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {activeChat === 'global' && pinnedMessages.length > 0 && (
            <div style={{ background: 'var(--info-bg)', borderBottom: '1px solid var(--border-light)', padding: '12px 24px', maxHeight: '140px', overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <MapPin size={12} fill="var(--accent-blue)" /> Pinned Announcements
              </div>
              {pinnedMessages.map(msg => (
                 <div key={msg.id} style={{ fontSize: '13px', marginBottom: '8px', padding: '8px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700 }}>{msg.sender_name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleString()}</span>
                   </div>
                   {msg.message}
                   {isAdminOrManager && (
                     <button onClick={() => togglePin(msg.id, msg.is_pinned)} style={{ display: 'block', background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', marginTop: '6px', padding: 0 }}>Unpin</button>
                   )}
                 </div>
              ))}
            </div>
          )}

          <MessageFeed 
            loading={loading}
            messages={messages}
            currentUser={currentUser}
            activeChat={activeChat}
            isAdminOrManager={isAdminOrManager}
            pinnedMessages={pinnedMessages}
            togglePin={togglePin}
            formatImageUrl={formatImageUrl}
            setReplyTo={setReplyTo}
            chatContainerRef={chatContainerRef}
            handleScroll={handleScroll}
            messagesEndRef={messagesEndRef}
          />

          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              style={{ position: 'absolute', bottom: '100px', right: '40px', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer', border: 'none', zIndex: 50 }}
            >
              <ChevronDown size={20} />
            </button>
          )}

          <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-surface)' }}>
            <form onSubmit={handleSendMessage}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', position: 'relative' }}>
                {attachmentPreview && (
                  <div style={{ position: 'absolute', bottom: '60px', left: '0', background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10 }}>
                    {attachmentPreview === 'file_icon' ? 'Attached File' : <img src={attachmentPreview} alt="Preview" style={{ height: '60px', borderRadius: '6px' }} />}
                    <button type="button" onClick={clearAttachment} style={{ background: 'var(--danger-bg)', border: 'none', color: 'var(--danger)', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer' }}><X size={14} /></button>
                  </div>
                )}
                {replyTo && (
                  <div style={{ position: 'absolute', bottom: '60px', left: '0', right: '0', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-main)', borderLeft: '4px solid var(--primary-blue)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, border: '1px solid var(--border-light)' }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary-blue)' }}>Replying to {replyTo.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{replyTo.message}</div>
                    </div>
                    <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                )}
                <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
                <button onClick={() => fileInputRef.current?.click()} type="button" style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: attachmentPreview ? 'var(--primary-blue)' : 'var(--text-muted)', cursor: 'pointer' }}><Paperclip size={20} /></button>
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} placeholder="Type a message..." style={{ flex: 1, minHeight: '48px', maxHeight: '150px', resize: 'none', padding: '14px 18px', borderRadius: '14px', background: 'var(--bg-surface-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-light)', outline: 'none' }} />
                <button type="submit" disabled={!newMessage.trim() && !attachmentBase64} style={{ width: '48px', height: '48px', borderRadius: '16px', background: (newMessage.trim() || attachmentBase64) ? 'var(--primary-blue)' : 'var(--bg-main)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: (newMessage.trim() || attachmentBase64) ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}><Send size={20} /></button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
