import { useEffect, useState, useCallback } from 'react';
import { Trash2, Eye, Clock } from 'lucide-react';
import { storiesApi } from '../services/api';
import { Story, Pagination } from '../types';
import {
  PageHeader, Pagination as PaginationUI,
  LoadingState, EmptyState, Avatar, ConfirmModal,
} from '../components/UI';
import { formatNumber, timeAgo } from '../utils/helpers';

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showExpired, setShowExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Story | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStories = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await storiesApi.getAll({ page, limit: 20, showExpired });
      setStories(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [showExpired]);

  useEffect(() => { fetchStories(1); }, [fetchStories]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await storiesApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      fetchStories(pagination.page);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setDeleteLoading(false); }
  };

  const isExpired = (story: Story) => new Date(story.expiresAt) < new Date();

  return (
    <div>
      <PageHeader
        title="Stories"
        subtitle={`${pagination.total} ${showExpired ? 'total' : 'active'} stories`}
        actions={
          <label className="flex items-center gap-2 text-sm text-dark-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showExpired}
              onChange={(e) => setShowExpired(e.target.checked)}
              className="rounded bg-dark-700 border-dark-500"
            />
            Show expired
          </label>
        }
      />

      <div className="card overflow-hidden">
        {loading ? <LoadingState /> : stories.length === 0 ? <EmptyState title="No stories found" /> : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 p-4">
            {stories.map((story) => (
              <div key={story._id} className="group relative">
                <div className={`relative aspect-[9/16] rounded-xl overflow-hidden bg-dark-800 ${isExpired(story) ? 'opacity-50' : ''}`}>
                  {story.media?.type === 'image' ? (
                    <img src={story.media.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={story.media?.url} className="w-full h-full object-cover" muted />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Expired badge */}
                  {isExpired(story) && (
                    <div className="absolute top-2 right-2 bg-dark-900/80 rounded-full px-2 py-0.5 text-[10px] text-dark-300">
                      Expired
                    </div>
                  )}

                  {/* User info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar src={story.user?.profilePicture} name={story.user?.username || '?'} size="sm" />
                      <p className="text-white text-xs font-medium truncate">@{story.user?.username}</p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-dark-300">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {story.seenBy?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {timeAgo(story.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Delete button (on hover) */}
                  <button
                    onClick={() => setDeleteTarget(story)}
                    className="absolute top-2 left-2 p-1.5 rounded-lg bg-dark-900/80 text-dark-300 hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchStories(p)} />
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Story"
        message={`Delete this story by @${deleteTarget?.user?.username}?`}
        confirmText="Delete Story"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}
