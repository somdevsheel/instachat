# InstaChat Admin Panel

React + TypeScript + Tailwind CSS admin dashboard for InstaChat.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:5173
```

## Configuration

The Vite dev server proxies `/api` requests to `http://localhost:5000` (your backend).

To change this, edit `vite.config.ts`:
```ts
proxy: {
  '/api': {
    target: 'http://localhost:5000', // Change this
  },
},
```

## Production Build

```bash
npm run build
# Output in dist/ folder
```

## Backend Setup Required

See `backend/INTEGRATION_GUIDE.js` for backend integration steps.












<!-- @tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background-color: #0a0a0a;
  color: #d4d4d4;
  font-family: 'DM Sans', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: #111111;
}
::-webkit-scrollbar-thumb {
  background: #3a3a3a;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #525252;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 149, 246, 0.3); }
  50% { box-shadow: 0 0 12px 4px rgba(0, 149, 246, 0.15); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-slide-in {
  animation: slideIn 0.25s ease-out forwards;
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* Table styles */
.admin-table {
  @apply w-full text-sm;
}
.admin-table th {
  @apply text-left text-dark-300 font-medium py-3 px-4 border-b border-dark-700 text-xs uppercase tracking-wider;
}
.admin-table td {
  @apply py-3 px-4 border-b border-dark-800;
}
.admin-table tr:hover td {
  @apply bg-dark-800/50;
}

/* Card styles */
.card {
  @apply bg-dark-900 border border-dark-700 rounded-xl;
}
.card-header {
  @apply px-5 py-4 border-b border-dark-700;
}
.card-body {
  @apply p-5;
}

/* Stat card gradient borders */
.stat-card {
  @apply relative overflow-hidden rounded-xl bg-dark-900 p-5;
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
}
.stat-card.blue::before { background: linear-gradient(90deg, #0095f6, #00d4ff); }
.stat-card.green::before { background: linear-gradient(90deg, #2ecc71, #27ae60); }
.stat-card.red::before { background: linear-gradient(90deg, #ed4956, #ff6b6b); }
.stat-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
.stat-card.orange::before { background: linear-gradient(90deg, #f39c12, #f1c40f); }
.stat-card.pink::before { background: linear-gradient(90deg, #ec4899, #f472b6); }

/* Badge */
.badge {
  @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium;
}

/* Button */
.btn {
  @apply inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed;
}
.btn-primary {
  @apply bg-accent-blue text-white hover:bg-accent-blue/90;
}
.btn-danger {
  @apply bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20;
}
.btn-ghost {
  @apply text-dark-200 hover:bg-dark-700 hover:text-white;
}
.btn-success {
  @apply bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20;
}

/* Input */
.input {
  @apply w-full bg-dark-800 border border-dark-600 rounded-lg px-4 py-2.5 text-dark-100 placeholder-dark-400 
         focus:outline-none focus:border-accent-blue/50 focus:ring-1 focus:ring-accent-blue/25 transition-all text-sm;
}

/* Modal overlay */
.modal-overlay {
  @apply fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4;
}
.modal-content {
  @apply bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto;
} -->
