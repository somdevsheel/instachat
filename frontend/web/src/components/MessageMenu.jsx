import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { deleteMessage } from '@instachat/shared';
import { MoreHorizontalIcon } from './icons.jsx';

export default function MessageMenu({ message, isMine }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (mode) => {
    const confirmText =
      mode === 'everyone'
        ? "Delete this message for everyone? This can't be undone."
        : 'Delete this message for you?';
    if (!window.confirm(confirmText)) return;

    setDeleting(true);
    const result = await dispatch(deleteMessage({ messageId: message._id, mode }));
    setDeleting(false);
    setOpen(false);

    if (!deleteMessage.fulfilled.match(result)) {
      window.alert(result.payload || 'Failed to delete message');
    }
  };

  return (
    <div className="post-menu message-menu">
      <button
        type="button"
        className="icon-button"
        aria-label="Message options"
        onClick={() => setOpen((v) => !v)}
        disabled={deleting}
      >
        <MoreHorizontalIcon />
      </button>

      {open && (
        <>
          <div className="post-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="post-menu-dropdown">
            {isMine && (
              <button
                className="post-menu-item danger"
                onClick={() => handleDelete('everyone')}
                disabled={deleting}
              >
                Delete for everyone
              </button>
            )}
            <button
              className="post-menu-item danger"
              onClick={() => handleDelete('me')}
              disabled={deleting}
            >
              Delete for me
            </button>
          </div>
        </>
      )}
    </div>
  );
}
