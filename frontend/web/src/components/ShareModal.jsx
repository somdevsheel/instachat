import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, sendMessage, postsApi } from '@instachat/shared';
import Avatar from './Avatar.jsx';

export default function ShareModal({ postId, reelId, onClose, onShared }) {
  const dispatch = useDispatch();
  const { chats, chatsLoading } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  const [sentTo, setSentTo] = useState({});
  const [sendingTo, setSendingTo] = useState(null);

  useEffect(() => {
    if (chats.length === 0) dispatch(fetchChats());
  }, [dispatch, chats.length]);

  const handleSend = async (chat, receiverId) => {
    if (sendingTo || sentTo[chat._id]) return;
    setSendingTo(chat._id);

    const result = await dispatch(
      sendMessage({
        chatId: chat._id,
        receiverId,
        text: '',
        sharedPostId: postId,
        sharedReelId: reelId,
      })
    );

    setSendingTo(null);
    if (sendMessage.fulfilled.match(result)) {
      setSentTo((prev) => ({ ...prev, [chat._id]: true }));
      if (postId) {
        postsApi.sharePost(postId).then((res) => onShared?.(res?.data?.shareCount)).catch(() => {});
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="page-title" style={{ padding: 0, marginBottom: 16 }}>
          Share to…
        </h2>

        {chatsLoading && <div className="centered-message">Loading chats…</div>}
        {!chatsLoading && chats.length === 0 && (
          <div className="centered-message">
            No conversations yet. Start one from Search first.
          </div>
        )}

        <ul className="search-results">
          {chats.map((chat) => {
            const other = chat.participants?.find((p) => p._id !== user?._id);
            if (!other) return null;

            return (
              <li key={chat._id} className="search-result">
                <div className="search-result-user">
                  <Avatar src={other.profilePicture} username={other.username} size={40} />
                  <span className="post-username">{other.username}</span>
                </div>
                <button
                  className="follow-button"
                  disabled={sendingTo === chat._id || sentTo[chat._id]}
                  onClick={() => handleSend(chat, other._id)}
                >
                  {sentTo[chat._id] ? 'Sent' : sendingTo === chat._id ? 'Sending…' : 'Send'}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
