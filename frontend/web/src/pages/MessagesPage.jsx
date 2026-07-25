import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats } from '@instachat/shared';
import Avatar from '../components/Avatar.jsx';
import { timeAgo } from '../utils/timeAgo.js';

function previewText(lastMessage) {
  if (!lastMessage) return 'Start a conversation';
  if (lastMessage.text?.trim()) return lastMessage.text;
  if (lastMessage.type === 'shared_post') return 'Shared a post';
  if (lastMessage.type === 'shared_reel') return 'Shared a reel';
  if (lastMessage.type === 'image') return 'Photo';
  if (lastMessage.type === 'video') return 'Video';
  return 'Start a conversation';
}

export default function MessagesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chats, chatsLoading, error } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  return (
    <div className="messages-page">
      <h2 className="page-title">Messages</h2>

      {chatsLoading && <div className="centered-message">Loading chats…</div>}
      {error && <div className="centered-message">{error}</div>}
      {!chatsLoading && !error && chats.length === 0 && (
        <div className="centered-message">No conversations yet. Find people in Search.</div>
      )}

      <ul className="chat-list">
        {chats.map((chat) => {
          const other = chat.participants?.find((p) => p._id !== user?._id);
          if (!other) return null;

          return (
            <li key={chat._id}>
              <button
                className="chat-list-item"
                onClick={() =>
                  navigate(`/messages/${chat._id}`, {
                    state: { receiverId: other._id, username: other.username },
                  })
                }
              >
                <Avatar src={other.profilePicture} username={other.username} size={48} />
                <div className="chat-list-item-body">
                  <div className="post-username">{other.username}</div>
                  <div className="chat-preview">
                    {previewText(chat.lastMessage)}
                  </div>
                </div>
                {chat.lastMessage?.createdAt && (
                  <span className="post-time">{timeAgo(chat.lastMessage.createdAt)}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
