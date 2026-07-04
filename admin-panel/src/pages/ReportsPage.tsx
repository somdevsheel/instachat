// import { useEffect, useState, useCallback } from 'react';
// import {
//   Flag, Trash2, Ban, ShieldOff, AlertTriangle, CheckCircle,
//   XCircle, Eye, Image, Film, CircleDot, MessageCircle, User,
// } from 'lucide-react';
// import { reportsApi } from '../services/api';
// import { Report, Pagination } from '../types';
// import {
//   PageHeader, Pagination as PaginationUI,
//   LoadingState, EmptyState, Avatar, StatusBadge, ConfirmModal,
// } from '../components/UI';
// import { timeAgo, getReasonLabel, truncate } from '../utils/helpers';

// const TARGET_ICONS: Record<string, any> = {
//   post: Image,
//   reel: Film,
//   story: CircleDot,
//   comment: MessageCircle,
//   user: User,
// };

// export default function ReportsPage() {
//   const [reports, setReports] = useState<Report[]>([]);
//   const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
//   const [statusFilter, setStatusFilter] = useState('pending');
//   const [typeFilter, setTypeFilter] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [actionModal, setActionModal] = useState<{ report: Report; action: string } | null>(null);
//   const [actionLoading, setActionLoading] = useState(false);
//   const [adminNotes, setAdminNotes] = useState('');

//   const fetchReports = useCallback(async (page = 1) => {
//     setLoading(true);
//     try {
//       const params: Record<string, any> = { page, limit: 20 };
//       if (statusFilter) params.status = statusFilter;
//       if (typeFilter) params.targetType = typeFilter;
//       const res = await reportsApi.getAll(params);
//       setReports(res.data.data);
//       setPagination(res.data.pagination);
//     } catch (err) { console.error(err); }
//     finally { setLoading(false); }
//   }, [statusFilter, typeFilter]);

//   useEffect(() => { fetchReports(1); }, [fetchReports]);

//   const handleAction = async () => {
//     if (!actionModal) return;
//     setActionLoading(true);
//     try {
//       await reportsApi.takeAction(actionModal.report._id, actionModal.action, adminNotes);
//       setActionModal(null);
//       setAdminNotes('');
//       fetchReports(pagination.page);
//     } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
//     finally { setActionLoading(false); }
//   };

//   const getActionTitle = (action: string) => {
//     const titles: Record<string, string> = {
//       dismiss: 'Dismiss Report',
//       remove_content: 'Remove Content',
//       warn_user: 'Warn User',
//       suspend_user: 'Suspend User',
//       ban_user: 'Ban User',
//     };
//     return titles[action] || action;
//   };

//   const getActionMessage = (action: string, report: Report) => {
//     switch (action) {
//       case 'dismiss': return 'This report will be marked as dismissed. No action will be taken.';
//       case 'remove_content': return `The reported ${report.targetType} will be permanently deleted.`;
//       case 'warn_user': return 'The reported user will receive a warning notification.';
//       case 'suspend_user': return 'The reported user will be suspended for 7 days.';
//       case 'ban_user': return 'The reported user will be permanently banned.';
//       default: return '';
//     }
//   };

//   return (
//     <div>
//       <PageHeader title="Reports" subtitle={`${pagination.total} reports`} />

//       {/* Filters */}
//       <div className="flex items-center gap-3 mb-5">
//         <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-40">
//           <option value="">All Status</option>
//           <option value="pending">Pending</option>
//           <option value="reviewing">Reviewing</option>
//           <option value="resolved">Resolved</option>
//           <option value="dismissed">Dismissed</option>
//         </select>
//         <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-40">
//           <option value="">All Types</option>
//           <option value="post">Posts</option>
//           <option value="reel">Reels</option>
//           <option value="story">Stories</option>
//           <option value="comment">Comments</option>
//           <option value="user">Users</option>
//         </select>
//       </div>

//       <div className="card overflow-hidden">
//         {loading ? <LoadingState /> : reports.length === 0 ? (
//           <EmptyState icon={<CheckCircle className="w-10 h-10 text-accent-green" />} title="No reports to review" description="All caught up!" />
//         ) : (
//           <div className="divide-y divide-dark-800">
//             {reports.map((report) => {
//               const TargetIcon = TARGET_ICONS[report.targetType] || Flag;
//               const isPending = report.status === 'pending';

//               return (
//                 <div key={report._id} className="px-5 py-4 hover:bg-dark-800/30 transition-colors">
//                   <div className="flex items-start gap-4">
//                     {/* Reporter */}
//                     <Avatar src={report.reporter?.profilePicture} name={report.reporter?.username || '?'} size="sm" />

//                     <div className="flex-1 min-w-0">
//                       {/* Header */}
//                       <div className="flex items-center gap-2 mb-1">
//                         <span className="text-sm font-medium text-dark-100">@{report.reporter?.username}</span>
//                         <span className="text-dark-500 text-xs">reported a</span>
//                         <span className="badge bg-dark-700 text-dark-200 border border-dark-600">
//                           <TargetIcon className="w-3 h-3 mr-1" /> {report.targetType}
//                         </span>
//                         <StatusBadge status={report.status} />
//                         <span className="text-[10px] text-dark-500 ml-auto">{timeAgo(report.createdAt)}</span>
//                       </div>

//                       {/* Reason */}
//                       <div className="flex items-center gap-2 mb-2">
//                         <span className="badge bg-accent-red/10 text-accent-red border border-accent-red/20">
//                           <AlertTriangle className="w-3 h-3 mr-1" /> {getReasonLabel(report.reason)}
//                         </span>
//                         {report.description && (
//                           <span className="text-xs text-dark-400">{truncate(report.description, 80)}</span>
//                         )}
//                       </div>

//                       {/* Target preview */}
//                       {report.targetUser && (
//                         <div className="flex items-center gap-2 text-xs text-dark-300 bg-dark-800 rounded-lg px-3 py-2 w-fit mb-2">
//                           <Avatar src={report.targetUser.profilePicture} name={report.targetUser.username} size="sm" />
//                           <span>@{report.targetUser.username}</span>
//                         </div>
//                       )}
//                       {report.targetPost && (
//                         <div className="flex items-center gap-2 text-xs text-dark-300 bg-dark-800 rounded-lg px-3 py-2 w-fit mb-2">
//                           <Image className="w-3.5 h-3.5" />
//                           <span>{truncate(report.targetPost.caption || 'No caption', 60)}</span>
//                         </div>
//                       )}
//                       {report.targetReel && (
//                         <div className="flex items-center gap-2 text-xs text-dark-300 bg-dark-800 rounded-lg px-3 py-2 w-fit mb-2">
//                           <Film className="w-3.5 h-3.5" />
//                           <span>{truncate(report.targetReel.caption || 'No caption', 60)}</span>
//                         </div>
//                       )}

//                       {/* Action taken info */}
//                       {report.actionTaken && report.actionTaken !== 'none' && (
//                         <p className="text-[10px] text-dark-500 mt-1">
//                           Action: <span className="text-dark-300">{report.actionTaken.replace(/_/g, ' ')}</span>
//                           {report.reviewedBy && <> by @{report.reviewedBy.username}</>}
//                         </p>
//                       )}

//                       {/* Actions (only for pending reports) */}
//                       {isPending && (
//                         <div className="flex items-center gap-2 mt-3">
//                           <button
//                             onClick={() => setActionModal({ report, action: 'dismiss' })}
//                             className="btn btn-ghost text-xs py-1.5 px-3"
//                           >
//                             <XCircle className="w-3.5 h-3.5" /> Dismiss
//                           </button>
//                           <button
//                             onClick={() => setActionModal({ report, action: 'remove_content' })}
//                             className="btn btn-danger text-xs py-1.5 px-3"
//                           >
//                             <Trash2 className="w-3.5 h-3.5" /> Remove Content
//                           </button>
//                           <button
//                             onClick={() => setActionModal({ report, action: 'warn_user' })}
//                             className="btn text-xs py-1.5 px-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
//                           >
//                             <AlertTriangle className="w-3.5 h-3.5" /> Warn
//                           </button>
//                           <button
//                             onClick={() => setActionModal({ report, action: 'suspend_user' })}
//                             className="btn text-xs py-1.5 px-3 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20"
//                           >
//                             <ShieldOff className="w-3.5 h-3.5" /> Suspend
//                           </button>
//                           <button
//                             onClick={() => setActionModal({ report, action: 'ban_user' })}
//                             className="btn btn-danger text-xs py-1.5 px-3"
//                           >
//                             <Ban className="w-3.5 h-3.5" /> Ban
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//         <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchReports(p)} />
//       </div>

//       {/* Action Modal */}
//       <ConfirmModal
//         isOpen={!!actionModal}
//         onClose={() => { setActionModal(null); setAdminNotes(''); }}
//         onConfirm={handleAction}
//         title={actionModal ? getActionTitle(actionModal.action) : ''}
//         message={actionModal ? getActionMessage(actionModal.action, actionModal.report) : ''}
//         confirmText={actionModal ? getActionTitle(actionModal.action) : ''}
//         variant={actionModal?.action === 'dismiss' ? 'primary' : 'danger'}
//         isLoading={actionLoading}
//       >
//         <div>
//           <label className="block text-xs font-medium text-dark-300 mb-1.5">Admin Notes (optional)</label>
//           <textarea
//             value={adminNotes}
//             onChange={(e) => setAdminNotes(e.target.value)}
//             className="input min-h-[80px] resize-none"
//             placeholder="Notes about this action..."
//           />
//         </div>
//       </ConfirmModal>
//     </div>
//   );
// }






import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Flag, Trash2, Ban, ShieldOff, AlertTriangle, CheckCircle,
  XCircle, Eye, Image, Film, CircleDot, MessageCircle, User,
  X, Play, Pause, Volume2, VolumeX, Maximize,
} from 'lucide-react';
import { reportsApi } from '../services/api';
import { Report, Pagination } from '../types';
import {
  PageHeader, Pagination as PaginationUI,
  LoadingState, EmptyState, Avatar, StatusBadge, ConfirmModal,
} from '../components/UI';
import { timeAgo, getReasonLabel, truncate, formatDate, formatNumber } from '../utils/helpers';

const TARGET_ICONS: Record<string, any> = {
  post: Image,
  reel: Film,
  story: CircleDot,
  comment: MessageCircle,
  user: User,
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ report: Report; action: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Content preview
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.targetType = typeFilter;
      const res = await reportsApi.getAll(params);
      setReports(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchReports(1); }, [fetchReports]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      await reportsApi.takeAction(actionModal.report._id, actionModal.action, adminNotes);
      setActionModal(null);
      setAdminNotes('');
      setPreviewReport(null);
      fetchReports(pagination.page);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); }
  };

  const openPreview = (report: Report) => {
    setPreviewReport(report);
    setIsPlaying(false);
    setIsMuted(false);
  };

  const closePreview = () => {
    setPreviewReport(null);
    if (videoRef.current) videoRef.current.pause();
    setIsPlaying(false);
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

  const getActionTitle = (action: string) => {
    const titles: Record<string, string> = {
      dismiss: 'Dismiss Report',
      remove_content: 'Remove Content',
      warn_user: 'Warn User',
      suspend_user: 'Suspend User',
      ban_user: 'Ban User',
    };
    return titles[action] || action;
  };

  const getActionMessage = (action: string, report: Report) => {
    switch (action) {
      case 'dismiss': return 'This report will be marked as dismissed. No action will be taken.';
      case 'remove_content': return `The reported ${report.targetType} will be permanently deleted.`;
      case 'warn_user': return 'The reported user will receive a warning notification.';
      case 'suspend_user': return 'The reported user will be suspended for 7 days.';
      case 'ban_user': return 'The reported user will be permanently banned.';
      default: return '';
    }
  };

  // Check if report has viewable media
  const hasMedia = (report: Report) => {
    return report.targetPost?.media || report.targetReel?.videoUrl || report.targetStory?.media;
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle={`${pagination.total} reports`} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-40">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-40">
          <option value="">All Types</option>
          <option value="post">Posts</option>
          <option value="reel">Reels</option>
          <option value="story">Stories</option>
          <option value="comment">Comments</option>
          <option value="user">Users</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? <LoadingState /> : reports.length === 0 ? (
          <EmptyState icon={<CheckCircle className="w-10 h-10 text-accent-green" />} title="No reports to review" description="All caught up!" />
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
            {reports.map((report) => {
              const TargetIcon = TARGET_ICONS[report.targetType] || Flag;
              const isPending = report.status === 'pending';

              return (
                <div key={report._id} className="px-5 py-4 hover:bg-hover transition-colors">
                  <div className="flex items-start gap-4">
                    <Avatar src={report.reporter?.profilePicture} name={report.reporter?.username || '?'} size="sm" />

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-heading">@{report.reporter?.username}</span>
                        <span className="text-muted text-xs">reported a</span>
                        <span className="badge" style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                          <TargetIcon className="w-3 h-3 mr-1" /> {report.targetType}
                        </span>
                        <StatusBadge status={report.status} />
                        <span className="text-[10px] text-faint ml-auto">{timeAgo(report.createdAt)}</span>
                      </div>

                      {/* Reason */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="badge bg-accent-red/10 text-accent-red border border-accent-red/20">
                          <AlertTriangle className="w-3 h-3 mr-1" /> {getReasonLabel(report.reason)}
                        </span>
                        {report.description && (
                          <span className="text-xs text-muted">{truncate(report.description, 80)}</span>
                        )}
                      </div>

                      {/* Content Preview Thumbnail */}
                      {report.targetPost && (
                        <div
                          className="flex items-center gap-3 rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity mb-2 w-fit"
                          style={{ background: 'var(--bg-tertiary)' }}
                          onClick={() => openPreview(report)}
                        >
                          {report.targetPost.media?.variants?.original && (
                            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 relative">
                              <img src={report.targetPost.media.variants.original} alt="" className="w-full h-full object-cover" />
                              {report.targetPost.media.type === 'video' && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Play className="w-3 h-3 text-white fill-white" />
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-heading flex items-center gap-1">
                              <Eye className="w-3 h-3 text-accent-blue" /> View Post
                            </p>
                            <p className="text-[10px] text-muted">{truncate(report.targetPost.caption || 'No caption', 40)}</p>
                          </div>
                        </div>
                      )}

                      {report.targetReel && (
                        <div
                          className="flex items-center gap-3 rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity mb-2 w-fit"
                          style={{ background: 'var(--bg-tertiary)' }}
                          onClick={() => openPreview(report)}
                        >
                          <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0 relative">
                            {report.targetReel.thumbnailUrl ? (
                              <img src={report.targetReel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--bg-hover)' }}>
                                <Film className="w-4 h-4 text-faint" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-3 h-3 text-white fill-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-heading flex items-center gap-1">
                              <Eye className="w-3 h-3 text-accent-blue" /> Play Reel
                            </p>
                            <p className="text-[10px] text-muted">{truncate(report.targetReel.caption || 'No caption', 40)}</p>
                          </div>
                        </div>
                      )}

                      {report.targetStory && (
                        <div
                          className="flex items-center gap-3 rounded-lg p-2 cursor-pointer hover:opacity-80 transition-opacity mb-2 w-fit"
                          style={{ background: 'var(--bg-tertiary)' }}
                          onClick={() => openPreview(report)}
                        >
                          <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                            <img src={report.targetStory.media?.url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs text-heading flex items-center gap-1">
                            <Eye className="w-3 h-3 text-accent-blue" /> View Story
                          </p>
                        </div>
                      )}

                      {report.targetUser && !report.targetPost && !report.targetReel && !report.targetStory && (
                        <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2 w-fit mb-2" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                          <Avatar src={report.targetUser.profilePicture} name={report.targetUser.username} size="sm" />
                          <span>@{report.targetUser.username}</span>
                        </div>
                      )}

                      {/* Action taken info */}
                      {report.actionTaken && report.actionTaken !== 'none' && (
                        <p className="text-[10px] text-faint mt-1">
                          Action: <span className="text-muted">{report.actionTaken.replace(/_/g, ' ')}</span>
                          {report.reviewedBy && <> by @{report.reviewedBy.username}</>}
                        </p>
                      )}

                      {/* Actions (pending reports only) */}
                      {isPending && (
                        <div className="flex items-center gap-2 mt-3">
                          <button onClick={() => setActionModal({ report, action: 'dismiss' })} className="btn btn-ghost text-xs py-1.5 px-3">
                            <XCircle className="w-3.5 h-3.5" /> Dismiss
                          </button>
                          <button onClick={() => setActionModal({ report, action: 'remove_content' })} className="btn btn-danger text-xs py-1.5 px-3">
                            <Trash2 className="w-3.5 h-3.5" /> Remove Content
                          </button>
                          <button onClick={() => setActionModal({ report, action: 'warn_user' })} className="btn text-xs py-1.5 px-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
                            <AlertTriangle className="w-3.5 h-3.5" /> Warn
                          </button>
                          <button onClick={() => setActionModal({ report, action: 'suspend_user' })} className="btn text-xs py-1.5 px-3 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20">
                            <ShieldOff className="w-3.5 h-3.5" /> Suspend
                          </button>
                          <button onClick={() => setActionModal({ report, action: 'ban_user' })} className="btn btn-danger text-xs py-1.5 px-3">
                            <Ban className="w-3.5 h-3.5" /> Ban
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <PaginationUI page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => fetchReports(p)} />
      </div>

      {/* ====== CONTENT PREVIEW MODAL ====== */}
      {previewReport && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="modal-content animate-fade-in"
            style={{ maxWidth: '900px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col md:flex-row">
              {/* Media Side */}
              <div className="md:w-[55%] bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px] rounded-tl-2xl md:rounded-bl-2xl overflow-hidden relative">

                {/* POST IMAGE */}
                {previewReport.targetPost?.media?.type === 'image' && (
                  <img
                    src={previewReport.targetPost.media.variants?.original}
                    alt=""
                    className="w-full h-full object-contain max-h-[500px]"
                  />
                )}

                {/* POST VIDEO */}
                {previewReport.targetPost?.media?.type === 'video' && (
                  <>
                    <video
                      ref={videoRef}
                      src={previewReport.targetPost.media.variants?.original}
                      className="w-full h-full object-contain max-h-[500px]"
                      controls
                      autoPlay
                      onClick={togglePlay}
                    />
                  </>
                )}

                {/* REEL VIDEO */}
                {previewReport.targetReel?.videoUrl && (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      src={previewReport.targetReel.videoUrl}
                      className="w-full h-full object-contain max-h-[500px]"
                      autoPlay
                      loop
                      onClick={togglePlay}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    {/* Video controls overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-3">
                        <button onClick={togglePlay} className="text-white">
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                        </button>
                        <button onClick={toggleMute} className="text-white">
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <button onClick={() => videoRef.current?.requestFullscreen?.()} className="text-white ml-auto">
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
                        <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
                          <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STORY */}
                {previewReport.targetStory?.media && (
                  <>
                    {previewReport.targetStory.media.type === 'video' ? (
                      <video
                        ref={videoRef}
                        src={previewReport.targetStory.media.url}
                        className="w-full h-full object-contain max-h-[500px]"
                        controls
                        autoPlay
                      />
                    ) : (
                      <img
                        src={previewReport.targetStory.media.url}
                        alt=""
                        className="w-full h-full object-contain max-h-[500px]"
                      />
                    )}
                  </>
                )}

                {/* NO MEDIA (comment or user report) */}
                {!previewReport.targetPost?.media && !previewReport.targetReel?.videoUrl && !previewReport.targetStory?.media && (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-8">
                    <User className="w-12 h-12 text-faint mb-4" />
                    <p className="text-muted text-sm">No media to preview</p>
                    {previewReport.targetType === 'comment' && (
                      <p className="text-heading text-sm mt-2">Comment report</p>
                    )}
                    {previewReport.targetType === 'user' && (
                      <p className="text-heading text-sm mt-2">
                        Account: @{previewReport.targetUser?.username}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Info Side */}
              <div className="md:w-[45%] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={previewReport.status} />
                    <span className="text-xs text-muted">{formatDate(previewReport.createdAt)}</span>
                  </div>
                  <button onClick={closePreview} className="p-1.5 hover:bg-hover rounded-lg transition-colors">
                    <X className="w-4 h-4 text-muted" />
                  </button>
                </div>

                {/* Report Details */}
                <div className="flex-1 px-4 py-3 overflow-y-auto space-y-4">
                  {/* Reporter */}
                  <div>
                    <p className="text-[10px] text-faint uppercase tracking-wider mb-1.5">Reported by</p>
                    <div className="flex items-center gap-2">
                      <Avatar src={previewReport.reporter?.profilePicture} name={previewReport.reporter?.username} size="sm" />
                      <span className="text-sm text-heading font-medium">@{previewReport.reporter?.username}</span>
                    </div>
                  </div>

                  {/* Target user */}
                  {previewReport.targetUser && (
                    <div>
                      <p className="text-[10px] text-faint uppercase tracking-wider mb-1.5">Content by</p>
                      <div className="flex items-center gap-2">
                        <Avatar src={previewReport.targetUser.profilePicture} name={previewReport.targetUser.username} size="sm" />
                        <span className="text-sm text-heading font-medium">@{previewReport.targetUser.username}</span>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <p className="text-[10px] text-faint uppercase tracking-wider mb-1.5">Reason</p>
                    <span className="badge bg-accent-red/10 text-accent-red border border-accent-red/20">
                      <AlertTriangle className="w-3 h-3 mr-1" /> {getReasonLabel(previewReport.reason)}
                    </span>
                  </div>

                  {/* Description */}
                  {previewReport.description && (
                    <div>
                      <p className="text-[10px] text-faint uppercase tracking-wider mb-1.5">Additional Details</p>
                      <p className="text-sm text-primary">{previewReport.description}</p>
                    </div>
                  )}

                  {/* Caption */}
                  {(previewReport.targetPost?.caption || previewReport.targetReel?.caption) && (
                    <div>
                      <p className="text-[10px] text-faint uppercase tracking-wider mb-1.5">Caption</p>
                      <p className="text-sm text-primary">
                        {previewReport.targetPost?.caption || previewReport.targetReel?.caption}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {previewReport.status === 'pending' && (
                  <div className="px-4 py-3 space-y-2" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setActionModal({ report: previewReport, action: 'dismiss' })} className="btn btn-ghost text-xs py-2">
                        <XCircle className="w-3.5 h-3.5" /> Dismiss
                      </button>
                      <button onClick={() => setActionModal({ report: previewReport, action: 'remove_content' })} className="btn btn-danger text-xs py-2">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                      <button onClick={() => setActionModal({ report: previewReport, action: 'suspend_user' })} className="btn text-xs py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20">
                        <ShieldOff className="w-3.5 h-3.5" /> Suspend
                      </button>
                      <button onClick={() => setActionModal({ report: previewReport, action: 'ban_user' })} className="btn btn-danger text-xs py-2">
                        <Ban className="w-3.5 h-3.5" /> Ban User
                      </button>
                    </div>
                    <p className="text-[10px] text-faint font-mono">ID: {previewReport._id}</p>
                  </div>
                )}

                {previewReport.status !== 'pending' && (
                  <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                    <p className="text-xs text-muted">
                      Action taken: <span className="text-heading font-medium">{previewReport.actionTaken?.replace(/_/g, ' ') || 'none'}</span>
                    </p>
                    <p className="text-[10px] text-faint font-mono mt-1">ID: {previewReport._id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirm Modal */}
      <ConfirmModal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setAdminNotes(''); }}
        onConfirm={handleAction}
        title={actionModal ? getActionTitle(actionModal.action) : ''}
        message={actionModal ? getActionMessage(actionModal.action, actionModal.report) : ''}
        confirmText={actionModal ? getActionTitle(actionModal.action) : ''}
        variant={actionModal?.action === 'dismiss' ? 'primary' : 'danger'}
        isLoading={actionLoading}
      >
        <div>
          <label className="block text-xs font-medium text-muted mb-1.5">Admin Notes (optional)</label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="input min-h-[80px] resize-none"
            placeholder="Notes about this action..."
          />
        </div>
      </ConfirmModal>
    </div>
  );
}