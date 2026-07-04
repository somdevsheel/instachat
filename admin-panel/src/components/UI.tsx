// import { ReactNode } from 'react';
// import { Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from 'lucide-react';

// /* ============ PAGE HEADER ============ */
// export function PageHeader({
//   title,
//   subtitle,
//   actions,
// }: {
//   title: string;
//   subtitle?: string;
//   actions?: ReactNode;
// }) {
//   return (
//     <div className="flex items-center justify-between mb-6">
//       <div>
//         <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
//         {subtitle && <p className="text-dark-300 text-sm mt-0.5">{subtitle}</p>}
//       </div>
//       {actions && <div className="flex items-center gap-3">{actions}</div>}
//     </div>
//   );
// }

// /* ============ SEARCH BAR ============ */
// export function SearchBar({
//   value,
//   onChange,
//   placeholder = 'Search...',
// }: {
//   value: string;
//   onChange: (val: string) => void;
//   placeholder?: string;
// }) {
//   return (
//     <div className="relative">
//       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
//       <input
//         type="text"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="input pl-10"
//       />
//     </div>
//   );
// }

// /* ============ PAGINATION ============ */
// export function Pagination({
//   page,
//   pages,
//   total,
//   onPageChange,
// }: {
//   page: number;
//   pages: number;
//   total: number;
//   onPageChange: (p: number) => void;
// }) {
//   if (pages <= 1) return null;

//   return (
//     <div className="flex items-center justify-between px-1 py-4">
//       <p className="text-xs text-dark-400">{total} total results</p>
//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => onPageChange(page - 1)}
//           disabled={page <= 1}
//           className="btn btn-ghost p-2"
//         >
//           <ChevronLeft className="w-4 h-4" />
//         </button>
//         <span className="text-sm text-dark-200 font-mono">
//           {page} / {pages}
//         </span>
//         <button
//           onClick={() => onPageChange(page + 1)}
//           disabled={page >= pages}
//           className="btn btn-ghost p-2"
//         >
//           <ChevronRight className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ============ LOADING SPINNER ============ */
// export function LoadingState({ text = 'Loading...' }: { text?: string }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 gap-3">
//       <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
//       <p className="text-dark-400 text-sm">{text}</p>
//     </div>
//   );
// }

// /* ============ EMPTY STATE ============ */
// export function EmptyState({
//   icon,
//   title,
//   description,
// }: {
//   icon?: ReactNode;
//   title: string;
//   description?: string;
// }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 gap-3">
//       {icon || <AlertTriangle className="w-10 h-10 text-dark-500" />}
//       <p className="text-dark-200 font-medium">{title}</p>
//       {description && <p className="text-dark-400 text-sm">{description}</p>}
//     </div>
//   );
// }

// /* ============ AVATAR ============ */
// export function Avatar({
//   src,
//   name,
//   size = 'md',
// }: {
//   src?: string;
//   name: string;
//   size?: 'sm' | 'md' | 'lg';
// }) {
//   const sizes = {
//     sm: 'w-7 h-7 text-[10px]',
//     md: 'w-9 h-9 text-xs',
//     lg: 'w-12 h-12 text-sm',
//   };

//   return (
//     <div className={`${sizes[size]} rounded-full bg-dark-600 overflow-hidden flex-shrink-0`}>
//       {src ? (
//         <img src={src} alt={name} className="w-full h-full object-cover" />
//       ) : (
//         <div className="w-full h-full flex items-center justify-center text-dark-300 font-bold">
//           {name.charAt(0).toUpperCase()}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ============ CONFIRM MODAL ============ */
// export function ConfirmModal({
//   isOpen,
//   onClose,
//   onConfirm,
//   title,
//   message,
//   confirmText = 'Confirm',
//   variant = 'danger',
//   isLoading = false,
//   children,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
//   title: string;
//   message?: string;
//   confirmText?: string;
//   variant?: 'danger' | 'primary';
//   isLoading?: boolean;
//   children?: ReactNode;
// }) {
//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
//         <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
//           <h3 className="font-display font-semibold text-white">{title}</h3>
//           <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded-lg transition-colors">
//             <X className="w-4 h-4 text-dark-400" />
//           </button>
//         </div>
//         <div className="p-5">
//           {message && <p className="text-dark-300 text-sm mb-4">{message}</p>}
//           {children}
//           <div className="flex justify-end gap-3 mt-6">
//             <button onClick={onClose} className="btn btn-ghost" disabled={isLoading}>
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
//               disabled={isLoading}
//             >
//               {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
//               {confirmText}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ============ STATUS BADGE ============ */
// export function StatusBadge({ status }: { status: string }) {
//   const colors: Record<string, string> = {
//     pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
//     reviewing: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
//     resolved: 'bg-green-500/15 text-green-400 border-green-500/20',
//     dismissed: 'bg-dark-500/30 text-dark-300 border-dark-500/20',
//     active: 'bg-green-500/15 text-green-400 border-green-500/20',
//     banned: 'bg-red-500/15 text-red-400 border-red-500/20',
//     suspended: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
//   };

//   return (
//     <span className={`badge border ${colors[status] || colors.dismissed}`}>
//       {status}
//     </span>
//   );
// }





// import { ReactNode } from 'react';
// import { Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from 'lucide-react';

// /* ============ PAGE HEADER ============ */
// export function PageHeader({
//   title,
//   subtitle,
//   actions,
// }: {
//   title: string;
//   subtitle?: string;
//   actions?: ReactNode;
// }) {
//   return (
//     <div className="flex items-center justify-between mb-6">
//       <div>
//         <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
//         {subtitle && <p className="text-dark-300 text-sm mt-0.5">{subtitle}</p>}
//       </div>
//       {actions && <div className="flex items-center gap-3">{actions}</div>}
//     </div>
//   );
// }

// /* ============ SEARCH BAR ============ */
// export function SearchBar({
//   value,
//   onChange,
//   placeholder = 'Search...',
// }: {
//   value: string;
//   onChange: (val: string) => void;
//   placeholder?: string;
// }) {
//   return (
//     <div className="relative">
//       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
//       <input
//         type="text"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="input pl-10"
//       />
//     </div>
//   );
// }

// /* ============ PAGINATION ============ */
// export function Pagination({
//   page,
//   pages,
//   total,
//   onPageChange,
// }: {
//   page: number;
//   pages: number;
//   total: number;
//   onPageChange: (p: number) => void;
// }) {
//   if (pages <= 1) return null;

//   return (
//     <div className="flex items-center justify-between px-1 py-4">
//       <p className="text-xs text-dark-400">{total} total results</p>
//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => onPageChange(page - 1)}
//           disabled={page <= 1}
//           className="btn btn-ghost p-2"
//         >
//           <ChevronLeft className="w-4 h-4" />
//         </button>
//         <span className="text-sm text-dark-200 font-mono">
//           {page} / {pages}
//         </span>
//         <button
//           onClick={() => onPageChange(page + 1)}
//           disabled={page >= pages}
//           className="btn btn-ghost p-2"
//         >
//           <ChevronRight className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ============ LOADING SPINNER ============ */
// export function LoadingState({ text = 'Loading...' }: { text?: string }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 gap-3">
//       <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
//       <p className="text-dark-400 text-sm">{text}</p>
//     </div>
//   );
// }

// /* ============ EMPTY STATE ============ */
// export function EmptyState({
//   icon,
//   title,
//   description,
// }: {
//   icon?: ReactNode;
//   title: string;
//   description?: string;
// }) {
//   return (
//     <div className="flex flex-col items-center justify-center py-20 gap-3">
//       {icon || <AlertTriangle className="w-10 h-10 text-dark-500" />}
//       <p className="text-dark-200 font-medium">{title}</p>
//       {description && <p className="text-dark-400 text-sm">{description}</p>}
//     </div>
//   );
// }

// /* ============ AVATAR ============ */
// export function Avatar({
//   src,
//   name = '',
//   size = 'md',
// }: {
//   src?: string;
//   name?: string;
//   size?: 'sm' | 'md' | 'lg';
// }) {
//   const sizes = {
//     sm: 'w-7 h-7 text-[10px]',
//     md: 'w-9 h-9 text-xs',
//     lg: 'w-12 h-12 text-sm',
//   };

//   const displayName = name || '?';

//   return (
//     <div className={`${sizes[size]} rounded-full bg-dark-600 overflow-hidden flex-shrink-0`}>
//       {src ? (
//         <img src={src} alt={displayName} className="w-full h-full object-cover" />
//       ) : (
//         <div className="w-full h-full flex items-center justify-center text-dark-300 font-bold">
//           {displayName.charAt(0).toUpperCase()}
//         </div>
//       )}
//     </div>
//   );
// }

// /* ============ CONFIRM MODAL ============ */
// export function ConfirmModal({
//   isOpen,
//   onClose,
//   onConfirm,
//   title,
//   message,
//   confirmText = 'Confirm',
//   variant = 'danger',
//   isLoading = false,
//   children,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onConfirm: () => void;
//   title: string;
//   message?: string;
//   confirmText?: string;
//   variant?: 'danger' | 'primary';
//   isLoading?: boolean;
//   children?: ReactNode;
// }) {
//   if (!isOpen) return null;

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
//         <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
//           <h3 className="font-display font-semibold text-white">{title}</h3>
//           <button onClick={onClose} className="p-1 hover:bg-dark-700 rounded-lg transition-colors">
//             <X className="w-4 h-4 text-dark-400" />
//           </button>
//         </div>
//         <div className="p-5">
//           {message && <p className="text-dark-300 text-sm mb-4">{message}</p>}
//           {children}
//           <div className="flex justify-end gap-3 mt-6">
//             <button onClick={onClose} className="btn btn-ghost" disabled={isLoading}>
//               Cancel
//             </button>
//             <button
//               onClick={onConfirm}
//               className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
//               disabled={isLoading}
//             >
//               {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
//               {confirmText}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ============ STATUS BADGE ============ */
// export function StatusBadge({ status }: { status: string }) {
//   const colors: Record<string, string> = {
//     pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
//     reviewing: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
//     resolved: 'bg-green-500/15 text-green-400 border-green-500/20',
//     dismissed: 'bg-dark-500/30 text-dark-300 border-dark-500/20',
//     active: 'bg-green-500/15 text-green-400 border-green-500/20',
//     banned: 'bg-red-500/15 text-red-400 border-red-500/20',
//     suspended: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
//   };

//   return (
//     <span className={`badge border ${colors[status] || colors.dismissed}`}>
//       {status}
//     </span>
//   );
// }





import { ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle, X } from 'lucide-react';

/* ============ PAGE HEADER ============ */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-heading">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ============ SEARCH BAR ============ */
export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  );
}

/* ============ PAGINATION ============ */
export function Pagination({
  page,
  pages,
  total,
  onPageChange,
}: {
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <p className="text-xs text-muted">{total} total results</p>
      <div className="flex items-center gap-2">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn-ghost p-2">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-secondary font-mono">{page} / {pages}</span>
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="btn btn-ghost p-2">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ============ LOADING SPINNER ============ */
export function LoadingState({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      <p className="text-muted text-sm">{text}</p>
    </div>
  );
}

/* ============ EMPTY STATE ============ */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      {icon || <AlertTriangle className="w-10 h-10 text-faint" />}
      <p className="text-secondary font-medium">{title}</p>
      {description && <p className="text-muted text-sm">{description}</p>}
    </div>
  );
}

/* ============ AVATAR ============ */
export function Avatar({
  src,
  name = '',
  size = 'md',
}: {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  const displayName = name || '?';

  return (
    <div className={`${sizes[size]} rounded-full bg-hover overflow-hidden flex-shrink-0`}>
      {src ? (
        <img src={src} alt={displayName} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

/* ============ CONFIRM MODAL ============ */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  variant = 'danger',
  isLoading = false,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmText?: string;
  variant?: 'danger' | 'primary';
  isLoading?: boolean;
  children?: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <h3 className="font-display font-semibold text-heading">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-hover rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>
        <div className="p-5">
          {message && <p className="text-muted text-sm mb-4">{message}</p>}
          {children}
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="btn btn-ghost" disabled={isLoading}>Cancel</button>
            <button
              onClick={onConfirm}
              className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ STATUS BADGE ============ */
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
    reviewing: 'bg-blue-500/15 text-blue-500 border-blue-500/20',
    resolved: 'bg-green-500/15 text-green-500 border-green-500/20',
    dismissed: 'bg-gray-500/15 text-gray-500 border-gray-500/20',
    active: 'bg-green-500/15 text-green-500 border-green-500/20',
    banned: 'bg-red-500/15 text-red-500 border-red-500/20',
    suspended: 'bg-orange-500/15 text-orange-500 border-orange-500/20',
  };

  return (
    <span className={`badge border ${colors[status] || colors.dismissed}`}>
      {status}
    </span>
  );
}