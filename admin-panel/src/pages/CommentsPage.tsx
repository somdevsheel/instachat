import { useEffect, useState, useCallback } from 'react';
import { Trash2, MessageCircle, Image, Film } from 'lucide-react';
import { commentsApi } from '../services/api';
import { Comment, Pagination } from '../types';
import {
  PageHeader, SearchBar, Pagination as PaginationUI,
  LoadingState, EmptyState, Avatar, ConfirmModal,
} from '../components/UI';
import { timeAgo, truncate } from '../utils/helpers';

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchComments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await commentsApi.getAll({ page, limit: 20, search });
      setComments(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchComments(1), 300);
    return () => clearTimeout(t);
  }, [fetchComments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await commentsApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchComments(pagination.page);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Comments" subtitle={`${pagination.total} total comments`} />

      <div className="max-w-sm mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search comment content..." />
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingState /> : comments.length === 0 ? <EmptyState title="No comments found" /> : (
          <div className="divide-y divide-dark-800">
            {comments.map((comment) => (
              <div key={comment._id} className="flex items-start gap-3 px-5 py-4 hover:bg-dark-800/30 group transition-colors">
                <Avatar src={comment.user?.profilePicture} name={comment.user?.username || '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-dark-100">@{comment.user?.username}</span>
                    <span className="text-[10px] text-dark-500">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-dark-200 mb-1.5">{comment.content}</p>
                  <div className="flex items-center gap-3 text-[10px] text-dark-500">
                    {comment.post && (
                      <span className="flex items-center gap-1">
                        <Image className="w-3 h-3" /> Post: {truncate(comment.post.caption || 'No caption', 30)}
                      </span>
                    )}
                    {comment.reel && (
                      <span className="flex items-center gap-1">
                        <Film className="w-3 h-3" /> Reel: {truncate(comment.reel.caption || 'No caption', 30)}
                      </span>
                    )}
                    <span className="font-mono">{comment._id}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(comment)}
                  className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchComments(p)} />
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message={`Delete this comment by @${deleteTarget?.user?.username}?`}
        confirmText="Delete Comment"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
