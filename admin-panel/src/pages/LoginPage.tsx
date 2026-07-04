// import { useState, FormEvent } from 'react';
// import { Shield, Loader2, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';
// import { useAuth } from '../context/AuthContext';

// export default function LoginPage() {
//   const { login, twoFA, verify2FA, resend2FA, cancel2FA } = useAuth();
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [otp, setOtp] = useState('');
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [resendCooldown, setResendCooldown] = useState(0);

//   const handleLogin = async (e: FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       await login(email, password);
//     } catch (err: any) {
//       setError(err.response?.data?.message || err.message || 'Login failed');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleVerify2FA = async (e: FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setIsLoading(true);

//     try {
//       await verify2FA(otp);
//     } catch (err: any) {
//       setError(err.response?.data?.message || err.message || 'Verification failed');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleResend = async () => {
//     if (resendCooldown > 0) return;
//     try {
//       await resend2FA();
//       setResendCooldown(30);
//       const interval = setInterval(() => {
//         setResendCooldown((prev) => {
//           if (prev <= 1) { clearInterval(interval); return 0; }
//           return prev - 1;
//         });
//       }, 1000);
//     } catch (err: any) {
//       setError(err.response?.data?.message || 'Failed to resend code');
//     }
//   };

//   const handleBack = () => {
//     cancel2FA();
//     setOtp('');
//     setError('');
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
//       {/* Background effects */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px]" />
//         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-[120px]" />
//       </div>

//       <div className="relative w-full max-w-[380px] animate-fade-in">
//         {/* Logo */}
//         <div className="flex flex-col items-center mb-8">
//           <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mb-4 pulse-glow">
//             <Shield className="w-7 h-7 text-white" />
//           </div>
//           <h1 className="font-display text-2xl font-bold text-white">InstaChat Admin</h1>
//           <p className="text-dark-400 text-sm mt-1">
//             {twoFA ? 'Enter verification code' : 'Sign in to manage your platform'}
//           </p>
//         </div>

//         {/* Form Card */}
//         <div className="bg-dark-900 border border-dark-700 rounded-2xl p-6">
//           {/* Error message */}
//           {error && (
//             <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm px-4 py-3 rounded-lg mb-4">
//               {error}
//             </div>
//           )}

//           {/* ====== 2FA VERIFICATION SCREEN ====== */}
//           {twoFA ? (
//             <form onSubmit={handleVerify2FA} className="space-y-4">
//               <button
//                 type="button"
//                 onClick={handleBack}
//                 className="flex items-center gap-1.5 text-dark-400 hover:text-dark-200 text-sm transition-colors mb-2"
//               >
//                 <ArrowLeft className="w-3.5 h-3.5" /> Back to login
//               </button>

//               <div className="bg-dark-800 rounded-lg px-4 py-3 text-center">
//                 <p className="text-dark-300 text-xs">
//                   A verification code was sent to
//                 </p>
//                 <p className="text-dark-100 text-sm font-medium mt-0.5">
//                   {twoFA.email}
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-xs font-medium text-dark-300 mb-1.5">
//                   Verification Code
//                 </label>
//                 <input
//                   type="text"
//                   value={otp}
//                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
//                   className="input text-center text-lg tracking-[0.5em] font-mono"
//                   placeholder="000000"
//                   maxLength={6}
//                   autoFocus
//                   required
//                 />
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading || otp.length < 4}
//                 className="btn btn-primary w-full py-3"
//               >
//                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Sign In'}
//               </button>

//               <div className="text-center">
//                 <button
//                   type="button"
//                   onClick={handleResend}
//                   disabled={resendCooldown > 0}
//                   className="text-xs text-dark-400 hover:text-accent-blue transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
//                 >
//                   <RefreshCw className="w-3 h-3" />
//                   {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
//                 </button>
//               </div>
//             </form>
//           ) : (
//             /* ====== NORMAL LOGIN SCREEN ====== */
//             <form onSubmit={handleLogin} className="space-y-4">
//               <div>
//                 <label className="block text-xs font-medium text-dark-300 mb-1.5">Email</label>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="input"
//                   placeholder="admin@instachat.com"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-xs font-medium text-dark-300 mb-1.5">Password</label>
//                 <div className="relative">
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     className="input pr-10"
//                     placeholder="••••••••"
//                     required
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
//                   >
//                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                   </button>
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={isLoading}
//                 className="btn btn-primary w-full py-3"
//               >
//                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
//               </button>
//             </form>
//           )}
//         </div>

//         <p className="text-center text-dark-500 text-xs mt-6">
//           Only authorized admins can access this panel
//         </p>
//       </div>
//     </div>
//   );
// }






import { useState, FormEvent } from 'react';
import { Shield, Loader2, Eye, EyeOff, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, twoFA, verify2FA, resend2FA, cancel2FA } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await verify2FA(otp);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await resend2FA();
      setResendCooldown(30);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) { clearInterval(interval); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleBack = () => {
    cancel2FA();
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[380px] animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center mb-4 pulse-glow">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-heading">InstaChat Admin</h1>
          <p className="text-muted text-sm mt-1">
            {twoFA ? 'Enter verification code' : 'Sign in to manage your platform'}
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {twoFA ? (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <button type="button" onClick={handleBack} className="flex items-center gap-1.5 text-muted hover:text-heading text-sm transition-colors mb-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </button>
              <div className="bg-surface rounded-lg px-4 py-3 text-center">
                <p className="text-muted text-xs">A verification code was sent to</p>
                <p className="text-heading text-sm font-medium mt-0.5">{twoFA.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Verification Code</label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="input text-center text-lg tracking-[0.5em] font-mono" placeholder="000000" maxLength={6} autoFocus required />
              </div>
              <button type="submit" disabled={isLoading || otp.length < 4} className="btn btn-primary w-full py-3">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Sign In'}
              </button>
              <div className="text-center">
                <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="text-xs text-muted hover:text-accent-blue transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
                  <RefreshCw className="w-3 h-3" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="admin@instachat.com" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pr-10" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="btn btn-primary w-full py-3">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-faint text-xs mt-6">
          Only authorized admins can access this panel
        </p>
      </div>
    </div>
  );
}