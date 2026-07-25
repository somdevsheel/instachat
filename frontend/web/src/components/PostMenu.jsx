import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postsApi, fetchFeed } from '@instachat/shared';
import { MoreHorizontalIcon } from './icons.jsx';
import ReportModal from './ReportModal.jsx';

export default function PostMenu({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reporting, setReporting] = useState(false);

  const isOwnPost = post.user?._id === user?._id;

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This can\'t be undone.')) return;

    setDeleting(true);
    try {
      await postsApi.deletePost(post._id);
      dispatch(fetchFeed());
    } catch (err) {
      window.alert(err?.response?.data?.message || 'Failed to delete post');
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <div className="post-menu">
      <button
        className="icon-button"
        aria-label="More"
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontalIcon />
      </button>

      {open && (
        <>
          <div className="post-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="post-menu-dropdown">
            {isOwnPost ? (
              <button className="post-menu-item danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete post'}
              </button>
            ) : (
              <button
                className="post-menu-item"
                onClick={() => {
                  setOpen(false);
                  setReporting(true);
                }}
              >
                Report
              </button>
            )}
          </div>
        </>
      )}

      {reporting && (
        <ReportModal
          targetType="post"
          targetId={post._id}
          onClose={() => setReporting(false)}
        />
      )}
    </div>
  );
}
