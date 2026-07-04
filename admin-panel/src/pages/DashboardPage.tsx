// import { useEffect, useState } from 'react';
// import {
//   Users,
//   Image,
//   Film,
//   CircleDot,
//   Flag,
//   ShieldAlert,
//   TrendingUp,
//   Clock,
// } from 'lucide-react';
// import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
// import { dashboardApi } from '../services/api';
// import { DashboardStats } from '../types';
// import { LoadingState, StatusBadge, Avatar, PageHeader } from '../components/UI';
// import { timeAgo, formatNumber, getReasonLabel } from '../utils/helpers';
// import { useNavigate } from 'react-router-dom';

// export default function DashboardPage() {
//   const [data, setData] = useState<DashboardStats | null>(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     dashboardApi
//       .getStats()
//       .then((res) => setData(res.data.data))
//       .catch(console.error)
//       .finally(() => setLoading(false));
//   }, []);

//   if (loading) return <LoadingState text="Loading dashboard..." />;
//   if (!data) return null;

//   const { stats } = data;

//   const statCards = [
//     { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', sub: `+${stats.newUsersToday} today` },
//     { label: 'Total Posts', value: stats.totalPosts, icon: Image, color: 'green', sub: `+${stats.newPostsToday} today` },
//     { label: 'Total Reels', value: stats.totalReels, icon: Film, color: 'purple' },
//     { label: 'Active Stories', value: stats.totalStories, icon: CircleDot, color: 'orange' },
//     { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'red', sub: `${stats.totalReports} total` },
//     { label: 'Banned Users', value: stats.bannedUsers, icon: ShieldAlert, color: 'pink' },
//   ];

//   return (
//     <div>
//       <PageHeader title="Dashboard" subtitle="Overview of your platform" />

//       {/* Stat Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
//         {statCards.map((card, i) => (
//           <div
//             key={card.label}
//             className={`stat-card ${card.color} animate-fade-in`}
//             style={{ animationDelay: `${i * 50}ms` }}
//           >
//             <div className="flex items-start justify-between">
//               <div>
//                 <p className="text-dark-400 text-xs font-medium mb-1">{card.label}</p>
//                 <p className="text-2xl font-display font-bold text-white">
//                   {formatNumber(card.value)}
//                 </p>
//                 {card.sub && (
//                   <p className="text-dark-400 text-xs mt-1 flex items-center gap-1">
//                     <TrendingUp className="w-3 h-3" /> {card.sub}
//                   </p>
//                 )}
//               </div>
//               <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
//                 <card.icon className="w-5 h-5 text-dark-300" />
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
//         {/* User Growth Chart */}
//         <div className="card">
//           <div className="card-header">
//             <h3 className="text-sm font-semibold text-white">User Growth (7 days)</h3>
//           </div>
//           <div className="p-4 h-[240px]">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={data.userGrowth}>
//                 <defs>
//                   <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor="#0095f6" stopOpacity={0.3} />
//                     <stop offset="100%" stopColor="#0095f6" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <XAxis
//                   dataKey="_id"
//                   tickFormatter={(v) => v.split('-').slice(1).join('/')}
//                   tick={{ fill: '#737373', fontSize: 11 }}
//                   axisLine={false}
//                   tickLine={false}
//                 />
//                 <YAxis hide />
//                 <Tooltip
//                   contentStyle={{
//                     background: '#1a1a1a',
//                     border: '1px solid #2e2e2e',
//                     borderRadius: 8,
//                     fontSize: 12,
//                   }}
//                   labelFormatter={(v) => `Date: ${v}`}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="count"
//                   stroke="#0095f6"
//                   fill="url(#userGrad)"
//                   strokeWidth={2}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Content Growth Chart */}
//         <div className="card">
//           <div className="card-header">
//             <h3 className="text-sm font-semibold text-white">Content Growth (7 days)</h3>
//           </div>
//           <div className="p-4 h-[240px]">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={data.contentGrowth}>
//                 <defs>
//                   <linearGradient id="contentGrad" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="0%" stopColor="#2ecc71" stopOpacity={0.3} />
//                     <stop offset="100%" stopColor="#2ecc71" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <XAxis
//                   dataKey="_id"
//                   tickFormatter={(v) => v.split('-').slice(1).join('/')}
//                   tick={{ fill: '#737373', fontSize: 11 }}
//                   axisLine={false}
//                   tickLine={false}
//                 />
//                 <YAxis hide />
//                 <Tooltip
//                   contentStyle={{
//                     background: '#1a1a1a',
//                     border: '1px solid #2e2e2e',
//                     borderRadius: 8,
//                     fontSize: 12,
//                   }}
//                   labelFormatter={(v) => `Date: ${v}`}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="count"
//                   stroke="#2ecc71"
//                   fill="url(#contentGrad)"
//                   strokeWidth={2}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* Recent Reports */}
//       <div className="card">
//         <div className="card-header flex items-center justify-between">
//           <h3 className="text-sm font-semibold text-white flex items-center gap-2">
//             <Clock className="w-4 h-4 text-dark-400" />
//             Recent Reports
//           </h3>
//           <button onClick={() => navigate('/reports')} className="text-xs text-accent-blue hover:underline">
//             View all
//           </button>
//         </div>
//         <div className="divide-y divide-dark-800">
//           {data.recentReports.length === 0 ? (
//             <div className="py-8 text-center text-dark-400 text-sm">No pending reports</div>
//           ) : (
//             data.recentReports.map((report) => (
//               <div
//                 key={report._id}
//                 className="flex items-center gap-4 px-5 py-3 hover:bg-dark-800/50 cursor-pointer transition-colors"
//                 onClick={() => navigate('/reports')}
//               >
//                 <Avatar src={report.reporter?.profilePicture} name={report.reporter?.username || '?'} size="sm" />
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm text-dark-100">
//                     <span className="font-medium">@{report.reporter?.username}</span>{' '}
//                     reported a <span className="text-accent-blue">{report.targetType}</span>
//                   </p>
//                   <p className="text-xs text-dark-400">{getReasonLabel(report.reason)} · {timeAgo(report.createdAt)}</p>
//                 </div>
//                 <StatusBadge status={report.status} />
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }






import { useEffect, useState } from 'react';
import {
  Users,
  Image,
  Film,
  CircleDot,
  Flag,
  ShieldAlert,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '../services/api';
import { DashboardStats } from '../types';
import { LoadingState, StatusBadge, Avatar, PageHeader } from '../components/UI';
import { timeAgo, formatNumber, getReasonLabel } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    dashboardApi
      .getStats()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Loading dashboard..." />;
  if (!data) return null;

  const { stats } = data;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue', sub: `+${stats.newUsersToday} today` },
    { label: 'Total Posts', value: stats.totalPosts, icon: Image, color: 'green', sub: `+${stats.newPostsToday} today` },
    { label: 'Total Reels', value: stats.totalReels, icon: Film, color: 'purple' },
    { label: 'Active Stories', value: stats.totalStories, icon: CircleDot, color: 'orange' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'red', sub: `${stats.totalReports} total` },
    { label: 'Banned Users', value: stats.bannedUsers, icon: ShieldAlert, color: 'pink' },
  ];

  const tooltipStyle = {
    background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    border: `1px solid ${theme === 'dark' ? '#2e2e2e' : '#dee2e6'}`,
    borderRadius: 8,
    fontSize: 12,
    color: theme === 'dark' ? '#d4d4d4' : '#333333',
  };

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your platform" />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card ${card.color} animate-fade-in`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted text-xs font-medium mb-1">{card.label}</p>
                <p className="text-2xl font-display font-bold text-heading">
                  {formatNumber(card.value)}
                </p>
                {card.sub && (
                  <p className="text-muted text-xs mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {card.sub}
                  </p>
                )}
              </div>
              <div className="w-10 h-10 rounded-lg bg-hover flex items-center justify-center">
                <card.icon className="w-5 h-5 text-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-heading">User Growth (7 days)</h3>
          </div>
          <div className="p-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.userGrowth}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0095f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0095f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="_id"
                  tickFormatter={(v) => v.split('-').slice(1).join('/')}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `Date: ${v}`} />
                <Area type="monotone" dataKey="count" stroke="#0095f6" fill="url(#userGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-heading">Content Growth (7 days)</h3>
          </div>
          <div className="p-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.contentGrowth}>
                <defs>
                  <linearGradient id="contentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2ecc71" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2ecc71" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="_id"
                  tickFormatter={(v) => v.split('-').slice(1).join('/')}
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `Date: ${v}`} />
                <Area type="monotone" dataKey="count" stroke="#2ecc71" fill="url(#contentGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-semibold text-heading flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            Recent Reports
          </h3>
          <button onClick={() => navigate('/reports')} className="text-xs text-accent-blue hover:underline">
            View all
          </button>
        </div>
        <div className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
          {data.recentReports.length === 0 ? (
            <div className="py-8 text-center text-muted text-sm">No pending reports</div>
          ) : (
            data.recentReports.map((report) => (
              <div
                key={report._id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-hover cursor-pointer transition-colors"
                onClick={() => navigate('/reports')}
              >
                <Avatar src={report.reporter?.profilePicture} name={report.reporter?.username || '?'} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-heading">
                    <span className="font-medium">@{report.reporter?.username}</span>{' '}
                    reported a <span className="text-accent-blue">{report.targetType}</span>
                  </p>
                  <p className="text-xs text-muted">{getReasonLabel(report.reason)} · {timeAgo(report.createdAt)}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}