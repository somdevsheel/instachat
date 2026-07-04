// import { NavLink } from 'react-router-dom';
// import {
//   LayoutDashboard,
//   Users,
//   Image,
//   Film,
//   CircleDot,
//   MessageSquare,
//   Flag,
//   LogOut,
//   Shield,
// } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// const navItems = [
//   { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
//   { to: '/users', icon: Users, label: 'Users' },
//   { to: '/posts', icon: Image, label: 'Posts' },
//   { to: '/reels', icon: Film, label: 'Reels' },
//   { to: '/stories', icon: CircleDot, label: 'Stories' },
//   { to: '/comments', icon: MessageSquare, label: 'Comments' },
//   { to: '/reports', icon: Flag, label: 'Reports' },
// ];

// export default function Sidebar() {
//   const { user, logout } = useAuth();

//   return (
//     <aside className="fixed left-0 top-0 bottom-0 w-[240px] bg-dark-900 border-r border-dark-700 flex flex-col z-40">
//       {/* Logo */}
//       <div className="p-5 border-b border-dark-700">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
//             <Shield className="w-5 h-5 text-white" />
//           </div>
//           <div>
//             <h1 className="font-display font-bold text-white text-base leading-tight">InstaChat</h1>
//             <p className="text-[10px] text-dark-300 font-medium tracking-widest uppercase">Admin Panel</p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation */}
//       <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
//         {navItems.map((item) => (
//           <NavLink
//             key={item.to}
//             to={item.to}
//             end={item.to === '/'}
//             className={({ isActive }) =>
//               `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
//                 isActive
//                   ? 'bg-accent-blue/10 text-accent-blue'
//                   : 'text-dark-300 hover:text-dark-100 hover:bg-dark-800'
//               }`
//             }
//           >
//             <item.icon className="w-[18px] h-[18px]" />
//             {item.label}
//           </NavLink>
//         ))}
//       </nav>

//       {/* User info */}
//       <div className="p-3 border-t border-dark-700">
//         <div className="flex items-center gap-3 px-3 py-2">
//           <div className="w-8 h-8 rounded-full bg-dark-600 overflow-hidden flex-shrink-0">
//             {user?.profilePicture ? (
//               <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center text-dark-300 text-xs font-bold">
//                 {user?.name?.charAt(0) || 'A'}
//               </div>
//             )}
//           </div>
//           <div className="flex-1 min-w-0">
//             <p className="text-xs font-medium text-dark-100 truncate">{user?.name}</p>
//             <p className="text-[10px] text-dark-400 truncate">@{user?.username}</p>
//           </div>
//           <button
//             onClick={logout}
//             className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-accent-red transition-colors"
//             title="Logout"
//           >
//             <LogOut className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </aside>
//   );
// }







import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Image,
  Film,
  CircleDot,
  MessageSquare,
  Flag,
  LogOut,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/posts', icon: Image, label: 'Posts' },
  { to: '/reels', icon: Film, label: 'Reels' },
  { to: '/stories', icon: CircleDot, label: 'Stories' },
  { to: '/comments', icon: MessageSquare, label: 'Comments' },
  { to: '/reports', icon: Flag, label: 'Reports' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[240px] sidebar-bg border-r sidebar-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-5 border-b sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-heading text-base leading-tight">InstaChat</h1>
            <p className="text-[10px] text-muted font-medium tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-accent-blue/10 text-accent-blue'
                  : 'text-muted hover:text-heading hover:bg-hover'
              }`
            }
          >
            <item.icon className="w-[18px] h-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle + User info */}
      <div className="p-3 border-t sidebar-border space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted hover:text-heading hover:bg-hover transition-all duration-150"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-[18px] h-[18px]" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-[18px] h-[18px]" />
              Dark Mode
            </>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-hover overflow-hidden flex-shrink-0">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted text-xs font-bold">
                {user?.name?.charAt(0) || 'A'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-heading truncate">{user?.name}</p>
            <p className="text-[10px] text-muted truncate">@{user?.username}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-hover text-muted hover:text-accent-red transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}