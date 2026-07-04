import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, UserX, ShieldOff, Eye, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { usersApi } from '../services/api';
import { User, Pagination } from '../types';
import {
  PageHeader,
  SearchBar,
  Pagination as PaginationUI,
  LoadingState,
  EmptyState,
  Avatar,
  StatusBadge,
  ConfirmModal,
} from '../components/UI';
import { formatNumber, formatDate } from '../utils/helpers';

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{
    type: 'ban' | 'unban' | 'suspend' | 'delete';
    user: User;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [suspendDays, setSuspendDays] = useState(7);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page, limit: 20, search, status: statusFilter });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(1), 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleAction = async () => {
    if (!actionModal) return;
    setActionLoading(true);
    try {
      switch (actionModal.type) {
        case 'ban':
          await usersApi.ban(actionModal.user._id, reason);
          break;
        case 'unban':
          await usersApi.unban(actionModal.user._id);
          break;
        case 'suspend':
          await usersApi.suspend(actionModal.user._id, suspendDays, reason);
          break;
        case 'delete':
          await usersApi.delete(actionModal.user._id);
          break;
      }
      setActionModal(null);
      setReason('');
      fetchUsers(pagination.page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getUserStatus = (user: User) => {
    if (user.isBanned) return 'banned';
    if (user.isSuspended) return 'suspended';
    return 'active';
  };

  return (
    <div>
      <PageHeader title="Users" subtitle={`${pagination.total} total users`} />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, username or email..." />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : users.length === 0 ? (
          <EmptyState title="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Posts</th>
                  <th>Reels</th>
                  <th>Followers</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar src={user.profilePicture} name={user.name} size="sm" />
                        <div>
                          <p className="text-dark-100 font-medium text-sm">{user.name}</p>
                          <p className="text-dark-400 text-xs">@{user.username}</p>
                        </div>
                        {user.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-accent-blue" />
                        )}
                      </div>
                    </td>
                    <td className="text-dark-300 text-xs font-mono">{user.email}</td>
                    <td className="text-dark-200">{formatNumber(user.postCount || 0)}</td>
                    <td className="text-dark-200">{formatNumber(user.reelCount || 0)}</td>
                    <td className="text-dark-200">{formatNumber(user.followersCount || 0)}</td>
                    <td><StatusBadge status={getUserStatus(user)} /></td>
                    <td className="text-dark-400 text-xs">{formatDate(user.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/users/${user._id}`)}
                          className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-blue"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!user.isBanned ? (
                          <>
                            <button
                              onClick={() => setActionModal({ type: 'suspend', user })}
                              className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-orange"
                              title="Suspend"
                            >
                              <ShieldOff className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActionModal({ type: 'ban', user })}
                              className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-red"
                              title="Ban"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setActionModal({ type: 'unban', user })}
                            className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-green"
                            title="Unban"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setActionModal({ type: 'delete', user })}
                          className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-red"
                          title="Delete"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationUI
          page={pagination.page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={(p) => fetchUsers(p)}
        />
      </div>

      {/* Action Modal */}
      <ConfirmModal
        isOpen={!!actionModal}
        onClose={() => { setActionModal(null); setReason(''); }}
        onConfirm={handleAction}
        title={
          actionModal?.type === 'ban' ? `Ban @${actionModal.user.username}` :
          actionModal?.type === 'unban' ? `Unban @${actionModal?.user.username}` :
          actionModal?.type === 'suspend' ? `Suspend @${actionModal?.user.username}` :
          `Delete @${actionModal?.user.username}`
        }
        message={
          actionModal?.type === 'delete'
            ? 'This will permanently delete this user and ALL their content (posts, reels, stories, comments). This cannot be undone.'
            : undefined
        }
        confirmText={
          actionModal?.type === 'ban' ? 'Ban User' :
          actionModal?.type === 'unban' ? 'Unban User' :
          actionModal?.type === 'suspend' ? 'Suspend User' :
          'Delete User'
        }
        variant={actionModal?.type === 'unban' ? 'primary' : 'danger'}
        isLoading={actionLoading}
      >
        {(actionModal?.type === 'ban' || actionModal?.type === 'suspend') && (
          <div className="space-y-3">
            {actionModal.type === 'suspend' && (
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1.5">
                  Suspend for (days)
                </label>
                <input
                  type="number"
                  value={suspendDays}
                  onChange={(e) => setSuspendDays(parseInt(e.target.value) || 7)}
                  className="input w-32"
                  min={1}
                  max={365}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-dark-300 mb-1.5">Reason</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input min-h-[80px] resize-none"
                placeholder="Reason for this action..."
              />
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
