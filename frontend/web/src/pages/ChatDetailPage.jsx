import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMessages,
  fetchChats,
  sendMessage,
  addMessage,
  markChatRead,
  messageDeleted,
  clearMessages,
  joinChatRoom,
  leaveChatRoom,
  emitTyping,
  emitStopTyping,
  initSocket,
  chatApi,
} from '@instachat/shared';
import { SendIcon, ImageIcon, XIcon } from '../components/icons.jsx';
import { uploadMediaFile } from '../utils/uploadMedia.js';
import MessageMenu from '../components/MessageMenu.jsx';

function MessageAttachment({ attachment, onOpen }) {
  if (!attachment) return null;
  const src = attachment.variants?.original;
  if (!src) return null;

  return attachment.type === 'video' ? (
    <video className="message-attachment" src={src} controls />
  ) : (
    <img
      className="message-attachment"
      src={src}
      alt=""
      onClick={() => onOpen(attachment)}
    />
  );
}

function AttachmentLightbox({ attachment, onClose }) {
  if (!attachment) return null;
  const src = attachment.variants?.original;

  return (
    <div className="attachment-lightbox-backdrop" onClick={onClose}>
      <button className="attachment-lightbox-close" onClick={onClose} aria-label="Close">
        <XIcon size={20} />
      </button>
      {attachment.type === 'video' ? (
        <video
          className="attachment-lightbox-media"
          src={src}
          controls
          autoPlay
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          className="attachment-lightbox-media"
          src={src}
          alt=""
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

function SharedContentCard({ msg }) {
  const shared = msg.sharedPost || msg.sharedReel;
  if (!shared) return <em>Shared content unavailable</em>;

  const thumb =
    msg.sharedPost?.media?.variants?.thumbnail ||
    msg.sharedPost?.media?.variants?.original ||
    msg.sharedReel?.thumbnailUrl;

  return (
    <Link to={`/profile/${shared.user?.username}`} className="shared-content-card">
      {thumb && <img src={thumb} alt="" />}
      <div className="shared-content-body">
        <div className="post-username">{shared.user?.username}</div>
        {shared.caption && <div className="post-time">{shared.caption}</div>}
        <div className="post-time">{msg.sharedReel ? 'Reel' : 'Post'}</div>
      </div>
    </Link>
  );
}

export default function ChatDetailPage() {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { messages, loading, chats } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [lightboxAttachment, setLightboxAttachment] = useState(null);
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);

  const chatFromList = chats.find((c) => c._id === chatId);
  const receiverId = location.state?.receiverId || chatFromList?.participants?.find((p) => p._id !== user?._id)?._id;
  const username = location.state?.username || chatFromList?.participants?.find((p) => p._id !== user?._id)?.username;

  useEffect(() => {
    if (chats.length === 0) {
      dispatch(fetchChats());
    }
  }, [dispatch, chats.length]);

  useEffect(() => {
    dispatch(fetchMessages(chatId));
    joinChatRoom(chatId);

    const handleIncoming = (message) => {
      if (message.chat === chatId) {
        dispatch(addMessage(message));
      }
    };

    // Fired when the other participant reads what I've sent in this chat.
    const handleRead = (data) => {
      if (data.chatId === chatId) {
        dispatch(markChatRead({ readerId: data.readerId, myUserId: user?._id }));
      }
    };

    const handleTyping = () => setOtherTyping(true);
    const handleStopTyping = () => setOtherTyping(false);

    // Fired for the OTHER participant when I delete a message — the
    // deleter's own view is updated locally by the deleteMessage thunk.
    const handleDeleted = (data) => {
      if (data.chatId === chatId) {
        dispatch(messageDeleted(data));
      }
    };

    // initSocket() resolves once the real connection is ready — calling
    // getSocket() synchronously here would often return null (the socket
    // is still awaiting its token lookup right after login/page load),
    // silently skipping these listeners for the rest of this mount.
    let cancelled = false;
    let boundSocket = null;

    initSocket().then((socket) => {
      if (cancelled || !socket) return;
      boundSocket = socket;
      socket.on('message_received', handleIncoming);
      socket.on('messages_read', handleRead);
      socket.on('typing', handleTyping);
      socket.on('stop_typing', handleStopTyping);
      socket.on('message_deleted', handleDeleted);
    });

    return () => {
      cancelled = true;
      leaveChatRoom(chatId);
      boundSocket?.off('message_received', handleIncoming);
      boundSocket?.off('messages_read', handleRead);
      boundSocket?.off('typing', handleTyping);
      boundSocket?.off('stop_typing', handleStopTyping);
      boundSocket?.off('message_deleted', handleDeleted);

      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        emitStopTyping(chatId);
      }
      setOtherTyping(false);

      dispatch(clearMessages());
    };
  }, [dispatch, chatId, user?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Tell the backend I've seen what's currently in this chat — covers
    // both opening the chat and new messages arriving while it's open.
    if (messages.length > 0) {
      chatApi.markChatRead(chatId).catch(() => {});
    }
  }, [messages, chatId]);

  useEffect(() => {
    if (otherTyping) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [otherTyping]);

  const stopTypingNow = () => {
    clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      emitStopTyping(chatId);
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);

    if (!value.trim()) {
      stopTypingNow();
      return;
    }

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTyping(chatId);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTypingNow, 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      window.alert('Only photos and videos can be attached');
      return;
    }

    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }

    setPendingAttachment({
      file,
      previewUrl: URL.createObjectURL(file),
      mediaType: file.type.startsWith('video/') ? 'video' : 'image',
    });
  };

  const clearAttachment = () => {
    if (pendingAttachment?.previewUrl) {
      URL.revokeObjectURL(pendingAttachment.previewUrl);
    }
    setPendingAttachment(null);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if ((!trimmed && !pendingAttachment) || !receiverId || uploading) return;

    stopTypingNow();

    let attachment;
    if (pendingAttachment) {
      setUploading(true);
      try {
        const { key, mediaType } = await uploadMediaFile(pendingAttachment.file, 'chat');
        attachment = { type: mediaType, originalKey: key };
      } catch {
        setUploading(false);
        window.alert('Failed to upload attachment');
        return;
      }
    }

    setText('');
    clearAttachment();
    setUploading(false);
    await dispatch(sendMessage({ chatId, receiverId, text: trimmed, attachment }));
  };

  return (
    <div className="chat-detail-page">
      <div className="chat-detail-header">
        <button className="back-button" onClick={() => navigate('/messages')}>
          ←
        </button>
        <span className="post-username">{username || 'Chat'}</span>
      </div>

      <div className="chat-messages">
        {loading && <div className="centered-message">Loading…</div>}
        {(() => {
          const lastMineIndex = [...messages]
            .map((m, i) => ({ m, i }))
            .reverse()
            .find(({ m }) => m.sender?._id === user?._id)?.i;

          return messages.map((msg, i) => {
            const isMine = msg.sender?._id === user?._id;
            const isRead =
              isMine &&
              msg.readBy?.some(
                (r) => r.user === receiverId || r.user?._id === receiverId
              );

            const menu = !msg.deletedForEveryone && (
              <MessageMenu message={msg} isMine={isMine} />
            );

            return (
              <React.Fragment key={msg._id}>
                <div className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                  {isMine && menu}
                  <div className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${msg.sharedPost || msg.sharedReel || msg.attachment ? 'shared' : ''}`}>
                    {msg.deletedForEveryone ? (
                      <em>Message deleted</em>
                    ) : msg.sharedPost || msg.sharedReel ? (
                      <SharedContentCard msg={msg} />
                    ) : msg.attachment ? (
                      <>
                        <MessageAttachment attachment={msg.attachment} onOpen={setLightboxAttachment} />
                        {msg.text && <div className="message-attachment-caption">{msg.text}</div>}
                      </>
                    ) : (
                      msg.text
                    )}
                  </div>
                  {!isMine && menu}
                </div>
                {isMine && i === lastMineIndex && (
                  <div className="message-status">{isRead ? 'Seen' : 'Delivered'}</div>
                )}
              </React.Fragment>
            );
          });
        })()}
        {otherTyping && (
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {lightboxAttachment && (
        <AttachmentLightbox
          attachment={lightboxAttachment}
          onClose={() => setLightboxAttachment(null)}
        />
      )}

      {pendingAttachment && (
        <div className="attachment-preview-bar">
          {pendingAttachment.mediaType === 'video' ? (
            <video className="attachment-preview-thumb" src={pendingAttachment.previewUrl} />
          ) : (
            <img className="attachment-preview-thumb" src={pendingAttachment.previewUrl} alt="" />
          )}
          <span className="post-time">
            {uploading ? 'Uploading…' : pendingAttachment.file.name}
          </span>
          <button
            type="button"
            className="icon-button attachment-remove-btn"
            onClick={clearAttachment}
            disabled={uploading}
            aria-label="Remove attachment"
          >
            <XIcon size={16} />
          </button>
        </div>
      )}

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          hidden
          onChange={handleFileSelect}
        />
        <button
          type="button"
          className="icon-button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach photo or video"
        >
          <ImageIcon />
        </button>
        <input
          type="text"
          placeholder="Message…"
          value={text}
          onChange={handleTextChange}
        />
        <button
          type="submit"
          className="icon-button"
          disabled={(!text.trim() && !pendingAttachment) || uploading}
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}
