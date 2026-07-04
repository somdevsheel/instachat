// import { useEffect, useState, useCallback } from 'react';
// import { Trash2, Heart, MessageCircle, Flag } from 'lucide-react';
// import { postsApi } from '../services/api';
// import { Post, Pagination } from '../types';
// import {
//   PageHeader, SearchBar, Pagination as PaginationUI,
//   LoadingState, EmptyState, Avatar, ConfirmModal,
// } from '../components/UI';
// import { formatNumber, timeAgo, truncate } from '../utils/helpers';

// export default function PostsPage() {
//   const [posts, setPosts] = useState<Post[]>([]);
//   const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   const fetchPosts = useCallback(async (page = 1) => {
//     setLoading(true);
//     try {
//       const res = await postsApi.getAll({ page, limit: 20, search });
//       setPosts(res.data.data);
//       setPagination(res.data.pagination);
//     } catch (err) { console.error(err); }
//     finally { setLoading(false); }
//   }, [search]);

//   useEffect(() => {
//     const t = setTimeout(() => fetchPosts(1), 300);
//     return () => clearTimeout(t);
//   }, [fetchPosts]);

//   const handleDelete = async () => {
//     if (!deleteTarget) return;
//     setDeleteLoading(true);
//     try {
//       await postsApi.delete(deleteTarget._id);
//       setDeleteTarget(null);
//       fetchPosts(pagination.page);
//     } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
//     finally { setDeleteLoading(false); }
//   };

//   return (
//     <div>
//       <PageHeader title="Posts" subtitle={`${pagination.total} total posts`} />

//       <div className="max-w-sm mb-5">
//         <SearchBar value={search} onChange={setSearch} placeholder="Search by caption or hashtag..." />
//       </div>

//       <div className="card overflow-hidden">
//         {loading ? <LoadingState /> : posts.length === 0 ? <EmptyState title="No posts found" /> : (
//           <div className="overflow-x-auto">
//             <table className="admin-table">
//               <thead>
//                 <tr>
//                   <th>Post</th>
//                   <th>Author</th>
//                   <th>Likes</th>
//                   <th>Comments</th>
//                   <th>Reports</th>
//                   <th>Posted</th>
//                   <th className="text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {posts.map((post) => (
//                   <tr key={post._id} className="group">
//                     <td>
//                       <div className="flex items-center gap-3">
//                         <div className="w-12 h-12 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
//                           <img src={post.media?.variants?.original} alt="" className="w-full h-full object-cover" />
//                         </div>
//                         <div className="min-w-0">
//                           <p className="text-sm text-dark-100 truncate max-w-[200px]">
//                             {truncate(post.caption, 50) || 'No caption'}
//                           </p>
//                           <p className="text-[10px] text-dark-500 font-mono">{post._id}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td>
//                       <div className="flex items-center gap-2">
//                         <Avatar src={post.user?.profilePicture} name={post.user?.username || '?'} size="sm" />
//                         <span className="text-dark-200 text-sm">@{post.user?.username}</span>
//                       </div>
//                     </td>
//                     <td>
//                       <span className="flex items-center gap-1 text-dark-200 text-sm">
//                         <Heart className="w-3 h-3 text-accent-red" /> {formatNumber(post.likesCount)}
//                       </span>
//                     </td>
//                     <td>
//                       <span className="flex items-center gap-1 text-dark-200 text-sm">
//                         <MessageCircle className="w-3 h-3 text-accent-blue" /> {formatNumber(post.commentsCount)}
//                       </span>
//                     </td>
//                     <td>
//                       <span className={`flex items-center gap-1 text-sm ${(post.reportCount || 0) > 0 ? 'text-accent-red' : 'text-dark-400'}`}>
//                         <Flag className="w-3 h-3" /> {post.reportCount || 0}
//                       </span>
//                     </td>
//                     <td className="text-dark-400 text-xs">{timeAgo(post.createdAt)}</td>
//                     <td>
//                       <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
//                         <button
//                           onClick={() => setDeleteTarget(post)}
//                           className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-red"
//                           title="Delete Post"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//         <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchPosts(p)} />
//       </div>

//       <ConfirmModal
//         isOpen={!!deleteTarget}
//         onClose={() => setDeleteTarget(null)}
//         onConfirm={handleDelete}
//         title="Delete Post"
//         message={`Delete this post by @${deleteTarget?.user?.username}? This will also delete the media from S3 and all associated comments.`}
//         confirmText="Delete Post"
//         variant="danger"
//         isLoading={deleteLoading}
//       />
//     </div>
//   );
// }





import { useEffect, useState, useCallback } from 'react';
import { Trash2, Heart, MessageCircle, Flag, Eye, X, Play } from 'lucide-react';
import { postsApi } from '../services/api';
import { Post, Pagination } from '../types';
import {
  PageHeader, SearchBar, Pagination as PaginationUI,
  LoadingState, EmptyState, Avatar, ConfirmModal,
} from '../components/UI';
import { formatNumber, timeAgo, truncate, formatDate } from '../utils/helpers';

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await postsApi.getAll({ page, limit: 20, search });
      setPosts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(1), 300);
    return () => clearTimeout(t);
  }, [fetchPosts]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await postsApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      setPreviewPost(null);
      fetchPosts(pagination.page);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Posts" subtitle={`${pagination.total} total posts`} />

      <div className="max-w-sm mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by caption or hashtag..." />
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingState /> : posts.length === 0 ? <EmptyState title="No posts found" /> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Author</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Reports</th>
                  <th>Posted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post._id} className="group">
                    <td>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setPreviewPost(post)}>
                        <div className="w-12 h-12 rounded-lg bg-hover overflow-hidden flex-shrink-0 relative group/thumb">
                          {post.media?.type === 'video' ? (
                            <>
                              <img src={post.media?.variants?.thumbnail || post.media?.variants?.original} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </>
                          ) : (
                            <img src={post.media?.variants?.original} alt="" className="w-full h-full object-cover" />
                          )}
                          {/* Hover zoom hint */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-heading truncate max-w-[200px]">
                            {truncate(post.caption, 50) || 'No caption'}
                          </p>
                          <p className="text-[10px] text-faint font-mono">{post._id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar src={post.user?.profilePicture} name={post.user?.username} size="sm" />
                        <span className="text-secondary text-sm">@{post.user?.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-secondary text-sm">
                        <Heart className="w-3 h-3 text-accent-red" /> {formatNumber(post.likesCount)}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-secondary text-sm">
                        <MessageCircle className="w-3 h-3 text-accent-blue" /> {formatNumber(post.commentsCount)}
                      </span>
                    </td>
                    <td>
                      <span className={`flex items-center gap-1 text-sm ${(post.reportCount || 0) > 0 ? 'text-accent-red' : 'text-muted'}`}>
                        <Flag className="w-3 h-3" /> {post.reportCount || 0}
                      </span>
                    </td>
                    <td className="text-muted text-xs">{timeAgo(post.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewPost(post)}
                          className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-accent-blue"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(post)}
                          className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-accent-red"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchPosts(p)} />
      </div>

      {/* ====== POST PREVIEW MODAL ====== */}
      {previewPost && (
        <div className="modal-overlay" onClick={() => setPreviewPost(null)}>
          <div
            className="modal-content animate-fade-in"
            style={{ maxWidth: '900px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row">
              {/* Media Side */}
              <div className="md:w-[55%] bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px] rounded-tl-2xl md:rounded-bl-2xl overflow-hidden relative">
                {previewPost.media?.type === 'video' ? (
                  <video
                    src={previewPost.media?.variants?.original}
                    controls
                    autoPlay
                    className="w-full h-full object-contain max-h-[500px]"
                  />
                ) : (
                  <img
                    src={previewPost.media?.variants?.original}
                    alt=""
                    className="w-full h-full object-contain max-h-[500px]"
                  />
                )}
              </div>

              {/* Info Side */}
              <div className="md:w-[45%] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <div className="flex items-center gap-3">
                    <Avatar src={previewPost.user?.profilePicture} name={previewPost.user?.username} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-heading">@{previewPost.user?.username}</p>
                      <p className="text-[10px] text-muted">{formatDate(previewPost.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewPost(null)}
                    className="p-1.5 hover:bg-hover rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted" />
                  </button>
                </div>

                {/* Caption */}
                <div className="flex-1 px-4 py-3 overflow-y-auto">
                  {previewPost.caption ? (
                    <p className="text-sm text-primary leading-relaxed">{previewPost.caption}</p>
                  ) : (
                    <p className="text-sm text-faint italic">No caption</p>
                  )}
                </div>

                {/* Stats */}
                <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <div className="flex items-center gap-5 mb-3">
                    <span className="flex items-center gap-1.5 text-sm text-secondary">
                      <Heart className="w-4 h-4 text-accent-red" /> {formatNumber(previewPost.likesCount)} likes
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-secondary">
                      <MessageCircle className="w-4 h-4 text-accent-blue" /> {formatNumber(previewPost.commentsCount)} comments
                    </span>
                    {(previewPost.reportCount || 0) > 0 && (
                      <span className="flex items-center gap-1.5 text-sm text-accent-red">
                        <Flag className="w-4 h-4" /> {previewPost.reportCount} reports
                      </span>
                    )}
                  </div>

                  {/* ID */}
                  <p className="text-[10px] text-faint font-mono mb-3">ID: {previewPost._id}</p>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      setDeleteTarget(previewPost);
                    }}
                    className="btn btn-danger w-full text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete This Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Delete this post by @${deleteTarget?.user?.username}? This will also delete the media from S3 and all associated comments.`}
        confirmText="Delete Post"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}