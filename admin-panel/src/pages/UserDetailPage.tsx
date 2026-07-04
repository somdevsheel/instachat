import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Calendar, Image, Film, Users, Flag, Ban,
  ShieldCheck, Globe, Lock, Trash2,
} from 'lucide-react';
import { usersApi } from '../services/api';
import { User } from '../types';
import { LoadingState, Avatar, StatusBadge, ConfirmModal } from '../components/UI';
import { formatDate, formatNumber, timeAgo, truncate } from '../utils/helpers';

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'reports'>('posts');
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!userId) return;
    usersApi.getById(userId)
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return <LoadingState />;
  if (!data) return null;

  const user: User = data;
  const status = user.isBanned ? 'banned' : user.isSuspended ? 'suspended' : 'active';

  const handleAction = async () => {
    if (!userId || !actionModal) return;
    setActionLoading(true);
    try {
      if (actionModal === 'ban') await usersApi.ban(userId, reason);
      else if (actionModal === 'unban') await usersApi.unban(userId);
      else if (actionModal === 'delete') {
        await usersApi.delete(userId);
        navigate('/users');
        return;
      }
      const res = await usersApi.getById(userId);
      setData(res.data.data);
      setActionModal(null);
      setReason('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = ['posts', 'reels', 'reports'] as const;

  return (
    <div>
      <button onClick={() => navigate('/users')} className="flex items-center gap-2 text-dark-400 hover:text-dark-100 mb-5 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Users
      </button>

      {/* Profile Header */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex items-start gap-5">
            <Avatar src={user.profilePicture} name={user.name} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-display text-xl font-bold text-white">{user.name}</h2>
                <StatusBadge status={status} />
                {user.isVerified && <ShieldCheck className="w-4 h-4 text-accent-blue" />}
              </div>
              <p className="text-dark-400 text-sm mb-2">@{user.username}</p>
              {user.bio && <p className="text-dark-300 text-sm mb-3">{user.bio}</p>}
              <div className="flex items-center gap-5 text-xs text-dark-300">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Joined {formatDate(user.createdAt)}</span>
                <span className="flex items-center gap-1.5">
                  {user.isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  {user.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {user.isBanned ? (
                <button onClick={() => setActionModal('unban')} className="btn btn-success text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" /> Unban
                </button>
              ) : (
                <button onClick={() => setActionModal('ban')} className="btn btn-danger text-xs">
                  <Ban className="w-3.5 h-3.5" /> Ban
                </button>
              )}
              <button onClick={() => setActionModal('delete')} className="btn btn-danger text-xs">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t border-dark-700">
            {[
              { val: data.posts?.length || 0, label: 'Posts', icon: Image },
              { val: data.reels?.length || 0, label: 'Reels', icon: Film },
              { val: data.followersCount || 0, label: 'Followers', icon: Users },
              { val: data.reportsAgainst?.length || 0, label: 'Reports Against', icon: Flag },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-white">{formatNumber(s.val)}</p>
                <p className="text-xs text-dark-400 flex items-center justify-center gap-1">
                  <s.icon className="w-3 h-3" /> {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-dark-900 rounded-lg p-1 w-fit border border-dark-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              activeTab === tab ? 'bg-dark-700 text-white' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {tab} ({tab === 'posts' ? data.posts?.length : tab === 'reels' ? data.reels?.length : data.reportsAgainst?.length || 0})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'posts' && (
          <div className="grid grid-cols-3 gap-1 p-1">
            {data.posts?.length === 0 && (
              <div className="col-span-3 py-12 text-center text-dark-400 text-sm">No posts</div>
            )}
            {data.posts?.map((post: any) => (
              <div key={post._id} className="relative aspect-square bg-dark-800 overflow-hidden rounded group cursor-pointer">
                <img src={post.media?.variants?.original} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white text-xs px-3 text-center">{truncate(post.caption, 60)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reels' && (
          <div className="grid grid-cols-3 gap-1 p-1">
            {data.reels?.length === 0 && (
              <div className="col-span-3 py-12 text-center text-dark-400 text-sm">No reels</div>
            )}
            {data.reels?.map((reel: any) => (
              <div key={reel._id} className="relative aspect-[9/16] bg-dark-800 overflow-hidden rounded group cursor-pointer">
                {reel.thumbnailUrl ? (
                  <img src={reel.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-8 h-8 text-dark-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div>
                    <p className="text-white text-xs">{truncate(reel.caption, 60)}</p>
                    <p className="text-dark-300 text-[10px] mt-1">
                      {formatNumber(reel.viewsCount || 0)} views · {formatNumber(reel.likesCount || 0)} likes
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="divide-y divide-dark-800">
            {data.reportsAgainst?.length === 0 && (
              <div className="py-12 text-center text-dark-400 text-sm">No reports against this user</div>
            )}
            {data.reportsAgainst?.map((report: any) => (
              <div key={report._id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-dark-100">
                    Reported for <span className="text-accent-blue font-medium">{report.reason}</span>
                  </p>
                  {report.description && <p className="text-xs text-dark-400 mt-0.5">{report.description}</p>}
                  <p className="text-[10px] text-dark-500 mt-1">{timeAgo(report.createdAt)}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setReason(''); }}
        onConfirm={handleAction}
        title={actionModal === 'ban' ? `Ban @${user.username}` : actionModal === 'unban' ? `Unban @${user.username}` : `Delete @${user.username}`}
        message={actionModal === 'delete' ? 'This will permanently delete this user and ALL their content. Cannot be undone.' : undefined}
        confirmText={actionModal === 'ban' ? 'Ban User' : actionModal === 'unban' ? 'Unban User' : 'Delete User'}
        variant={actionModal === 'unban' ? 'primary' : 'danger'}
        isLoading={actionLoading}
      >
        {actionModal === 'ban' && (
          <div>
            <label className="block text-xs font-medium text-dark-300 mb-1.5">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="input min-h-[80px] resize-none" placeholder="Reason for ban..." />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
