// import { useEffect, useState, useCallback } from 'react';
// import { Trash2, Heart, Eye, Film, Flag } from 'lucide-react';
// import { reelsApi } from '../services/api';
// import { Reel, Pagination } from '../types';
// import {
//   PageHeader, SearchBar, Pagination as PaginationUI,
//   LoadingState, EmptyState, Avatar, ConfirmModal,
// } from '../components/UI';
// import { formatNumber, timeAgo, truncate } from '../utils/helpers';

// export default function ReelsPage() {
//   const [reels, setReels] = useState<Reel[]>([]);
//   const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);
//   const [deleteLoading, setDeleteLoading] = useState(false);

//   const fetchReels = useCallback(async (page = 1) => {
//     setLoading(true);
//     try {
//       const res = await reelsApi.getAll({ page, limit: 20, search });
//       setReels(res.data.data);
//       setPagination(res.data.pagination);
//     } catch (err) { console.error(err); }
//     finally { setLoading(false); }
//   }, [search]);

//   useEffect(() => {
//     const t = setTimeout(() => fetchReels(1), 300);
//     return () => clearTimeout(t);
//   }, [fetchReels]);

//   const handleDelete = async () => {
//     if (!deleteTarget) return;
//     setDeleteLoading(true);
//     try {
//       await reelsApi.delete(deleteTarget._id);
//       setDeleteTarget(null);
//       fetchReels(pagination.page);
//     } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
//     finally { setDeleteLoading(false); }
//   };

//   return (
//     <div>
//       <PageHeader title="Reels" subtitle={`${pagination.total} total reels`} />

//       <div className="max-w-sm mb-5">
//         <SearchBar value={search} onChange={setSearch} placeholder="Search by caption..." />
//       </div>

//       <div className="card overflow-hidden">
//         {loading ? <LoadingState /> : reels.length === 0 ? <EmptyState title="No reels found" /> : (
//           <div className="overflow-x-auto">
//             <table className="admin-table">
//               <thead>
//                 <tr>
//                   <th>Reel</th>
//                   <th>Author</th>
//                   <th>Views</th>
//                   <th>Likes</th>
//                   <th>Reports</th>
//                   <th>Posted</th>
//                   <th className="text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {reels.map((reel) => (
//                   <tr key={reel._id} className="group">
//                     <td>
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-14 rounded-lg bg-dark-700 overflow-hidden flex-shrink-0">
//                           {reel.thumbnailUrl ? (
//                             <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
//                           ) : (
//                             <div className="w-full h-full flex items-center justify-center">
//                               <Film className="w-4 h-4 text-dark-500" />
//                             </div>
//                           )}
//                         </div>
//                         <div className="min-w-0">
//                           <p className="text-sm text-dark-100 truncate max-w-[200px]">
//                             {truncate(reel.caption, 50) || 'No caption'}
//                           </p>
//                           <p className="text-[10px] text-dark-500 font-mono">{reel._id}</p>
//                         </div>
//                       </div>
//                     </td>
//                     <td>
//                       <div className="flex items-center gap-2">
//                         <Avatar src={reel.user?.profilePicture} name={reel.user?.username || '?'} size="sm" />
//                         <span className="text-dark-200 text-sm">@{reel.user?.username}</span>
//                       </div>
//                     </td>
//                     <td>
//                       <span className="flex items-center gap-1 text-dark-200 text-sm">
//                         <Eye className="w-3 h-3 text-dark-400" /> {formatNumber(reel.viewsCount)}
//                       </span>
//                     </td>
//                     <td>
//                       <span className="flex items-center gap-1 text-dark-200 text-sm">
//                         <Heart className="w-3 h-3 text-accent-red" /> {formatNumber(reel.likesCount)}
//                       </span>
//                     </td>
//                     <td>
//                       <span className={`flex items-center gap-1 text-sm ${(reel.reportCount || 0) > 0 ? 'text-accent-red' : 'text-dark-400'}`}>
//                         <Flag className="w-3 h-3" /> {reel.reportCount || 0}
//                       </span>
//                     </td>
//                     <td className="text-dark-400 text-xs">{timeAgo(reel.createdAt)}</td>
//                     <td>
//                       <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
//                         <button
//                           onClick={() => setDeleteTarget(reel)}
//                           className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-red"
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
//         <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchReels(p)} />
//       </div>

//       <ConfirmModal
//         isOpen={!!deleteTarget}
//         onClose={() => setDeleteTarget(null)}
//         onConfirm={handleDelete}
//         title="Delete Reel"
//         message={`Delete this reel by @${deleteTarget?.user?.username}? This will also delete the video from S3.`}
//         confirmText="Delete Reel"
//         variant="danger"
//         isLoading={deleteLoading}
//       />
//     </div>
//   );
// }






import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Trash2, Heart, Eye, Film, Flag, X, Play, Pause,
  Volume2, VolumeX, Maximize,
} from 'lucide-react';
import { reelsApi } from '../services/api';
import { Reel, Pagination } from '../types';
import {
  PageHeader, SearchBar, Pagination as PaginationUI,
  LoadingState, EmptyState, Avatar, ConfirmModal,
} from '../components/UI';
import { formatNumber, timeAgo, truncate, formatDate } from '../utils/helpers';

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Reel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [previewReel, setPreviewReel] = useState<Reel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchReels = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await reelsApi.getAll({ page, limit: 20, search });
      setReels(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => fetchReels(1), 300);
    return () => clearTimeout(t);
  }, [fetchReels]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await reelsApi.delete(deleteTarget._id);
      setDeleteTarget(null);
      setPreviewReel(null);
      fetchReels(pagination.page);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setDeleteLoading(false); }
  };

  const openPreview = (reel: Reel) => {
    setPreviewReel(reel);
    setIsPlaying(true);
    setProgress(0);
  };

  const closePreview = () => {
    setPreviewReel(null);
    setIsPlaying(false);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <PageHeader title="Reels" subtitle={`${pagination.total} total reels`} />

      <div className="max-w-sm mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by caption..." />
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingState /> : reels.length === 0 ? <EmptyState title="No reels found" /> : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reel</th>
                  <th>Author</th>
                  <th>Views</th>
                  <th>Likes</th>
                  <th>Reports</th>
                  <th>Posted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reels.map((reel) => (
                  <tr key={reel._id} className="group">
                    <td>
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => openPreview(reel)}>
                        <div className="w-10 h-14 rounded-lg bg-hover overflow-hidden flex-shrink-0 relative group/thumb">
                          {reel.thumbnailUrl ? (
                            <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-hover">
                              <Film className="w-4 h-4 text-faint" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-white" />
                          </div>
                          {/* Duration badge */}
                          {reel.duration > 0 && (
                            <div className="absolute bottom-0.5 right-0.5 bg-black/70 rounded px-1 py-0.5 text-[8px] text-white font-mono">
                              {formatDuration(reel.duration)}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-heading truncate max-w-[200px]">
                            {truncate(reel.caption, 50) || 'No caption'}
                          </p>
                          <p className="text-[10px] text-faint font-mono">{reel._id}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar src={reel.user?.profilePicture} name={reel.user?.username} size="sm" />
                        <span className="text-secondary text-sm">@{reel.user?.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-secondary text-sm">
                        <Eye className="w-3 h-3 text-muted" /> {formatNumber(reel.viewsCount)}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1 text-secondary text-sm">
                        <Heart className="w-3 h-3 text-accent-red" /> {formatNumber(reel.likesCount)}
                      </span>
                    </td>
                    <td>
                      <span className={`flex items-center gap-1 text-sm ${(reel.reportCount || 0) > 0 ? 'text-accent-red' : 'text-muted'}`}>
                        <Flag className="w-3 h-3" /> {reel.reportCount || 0}
                      </span>
                    </td>
                    <td className="text-muted text-xs">{timeAgo(reel.createdAt)}</td>
                    <td>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openPreview(reel)}
                          className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-accent-blue"
                          title="Play Reel"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(reel)}
                          className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-accent-red"
                          title="Delete Reel"
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
        <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchReels(p)} />
      </div>

      {/* ====== REEL PREVIEW MODAL ====== */}
      {previewReel && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="animate-fade-in flex gap-5"
            style={{ maxWidth: '800px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Player - Phone shaped */}
            <div className="relative rounded-2xl overflow-hidden bg-black" style={{ width: '340px', height: '600px' }}>
              <video
                ref={videoRef}
                src={previewReel.videoUrl}
                className="w-full h-full object-contain"
                autoPlay
                loop
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Play/Pause overlay on click */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-8 h-8 text-white fill-white ml-1" />
                  </div>
                </div>
              )}

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress bar */}
                <div
                  className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="p-1 text-white hover:text-white/80">
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                    </button>
                    <button onClick={toggleMute} className="p-1 text-white hover:text-white/80">
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    {videoRef.current && (
                      <span className="text-white/70 text-xs font-mono">
                        {formatDuration(videoRef.current.currentTime || 0)} / {formatDuration(videoRef.current.duration || 0)}
                      </span>
                    )}
                  </div>
                  <button onClick={handleFullscreen} className="p-1 text-white hover:text-white/80">
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="flex-1 modal-content rounded-2xl flex flex-col" style={{ maxHeight: '600px' }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <div className="flex items-center gap-3">
                  <Avatar src={previewReel.user?.profilePicture} name={previewReel.user?.username} />
                  <div>
                    <p className="text-sm font-semibold text-heading">@{previewReel.user?.username}</p>
                    <p className="text-[10px] text-muted">{formatDate(previewReel.createdAt)}</p>
                  </div>
                </div>
                <button onClick={closePreview} className="p-1.5 hover:bg-hover rounded-lg transition-colors">
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>

              {/* Caption */}
              <div className="flex-1 px-5 py-4 overflow-y-auto">
                {previewReel.caption ? (
                  <p className="text-sm text-primary leading-relaxed">{previewReel.caption}</p>
                ) : (
                  <p className="text-sm text-faint italic">No caption</p>
                )}

                {/* Audio info */}
                <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                  <Film className="w-3.5 h-3.5" />
                  {previewReel.duration > 0
                    ? `Duration: ${formatDuration(previewReel.duration)}`
                    : 'Duration unknown'
                  }
                </div>
              </div>

              {/* Stats */}
              <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center bg-surface rounded-lg py-2.5">
                    <p className="text-lg font-bold text-heading">{formatNumber(previewReel.viewsCount)}</p>
                    <p className="text-[10px] text-muted flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" /> Views
                    </p>
                  </div>
                  <div className="text-center bg-surface rounded-lg py-2.5">
                    <p className="text-lg font-bold text-heading">{formatNumber(previewReel.likesCount)}</p>
                    <p className="text-[10px] text-muted flex items-center justify-center gap-1">
                      <Heart className="w-3 h-3" /> Likes
                    </p>
                  </div>
                  <div className="text-center bg-surface rounded-lg py-2.5">
                    <p className="text-lg font-bold text-heading">{formatNumber(previewReel.commentsCount)}</p>
                    <p className="text-[10px] text-muted flex items-center justify-center gap-1">
                      <Flag className="w-3 h-3" /> Comments
                    </p>
                  </div>
                </div>

                {(previewReel.reportCount || 0) > 0 && (
                  <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2 mb-3 text-center">
                    <span className="text-accent-red text-xs font-medium">
                      ⚠ {previewReel.reportCount} report{(previewReel.reportCount || 0) > 1 ? 's' : ''} filed
                    </span>
                  </div>
                )}

                <p className="text-[10px] text-faint font-mono mb-3">ID: {previewReel._id}</p>

                <button
                  onClick={() => setDeleteTarget(previewReel)}
                  className="btn btn-danger w-full text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete This Reel
                </button>
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
        title="Delete Reel"
        message={`Delete this reel by @${deleteTarget?.user?.username}? This will also delete the video from S3.`}
        confirmText="Delete Reel"
        variant="danger"
        isLoading={deleteLoading}
      />
    </div>
  );
}