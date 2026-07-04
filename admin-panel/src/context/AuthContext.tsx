// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { authApi } from '../services/api';

// interface AdminUser {
//   _id: string;
//   name: string;
//   username: string;
//   email: string;
//   role: string;
//   profilePicture: string;
// }

// interface AuthContextType {
//   user: AdminUser | null;
//   token: string | null;
//   login: (email: string, password: string) => Promise<void>;
//   logout: () => void;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<AdminUser | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const savedToken = localStorage.getItem('admin_token');
//     const savedUser = localStorage.getItem('admin_user');
//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(JSON.parse(savedUser));
//     }
//     setIsLoading(false);
//   }, []);

//   const login = async (email: string, password: string) => {
//     const res = await authApi.login(email, password);
//     const { token: newToken, user: userData } = res.data;

//     // Check admin role
//     if (!userData.role || !['admin', 'superadmin'].includes(userData.role)) {
//       throw new Error('Access denied. Admin privileges required.');
//     }

//     localStorage.setItem('admin_token', newToken);
//     localStorage.setItem('admin_user', JSON.stringify(userData));
//     setToken(newToken);
//     setUser(userData);
//   };

//   const logout = () => {
//     localStorage.removeItem('admin_token');
//     localStorage.removeItem('admin_user');
//     setToken(null);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// }









// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { authApi } from '../services/api';
// import api from '../services/api';

// interface AdminUser {
//   _id: string;
//   name: string;
//   username: string;
//   email: string;
//   role: string;
//   profilePicture: string;
// }

// interface TwoFAState {
//   required: boolean;
//   tempUserId: string;
//   email: string;
// }

// interface AuthContextType {
//   user: AdminUser | null;
//   token: string | null;
//   twoFA: TwoFAState | null;
//   login: (email: string, password: string) => Promise<void>;
//   verify2FA: (otp: string) => Promise<void>;
//   resend2FA: () => Promise<void>;
//   cancel2FA: () => void;
//   logout: () => void;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<AdminUser | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [twoFA, setTwoFA] = useState<TwoFAState | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const savedToken = localStorage.getItem('admin_token');
//     const savedUser = localStorage.getItem('admin_user');
//     if (savedToken && savedUser) {
//       setToken(savedToken);
//       setUser(JSON.parse(savedUser));
//     }
//     setIsLoading(false);
//   }, []);

//   /**
//    * After getting a token, verify this user has admin role.
//    * Your login response may not include `role`, so we also
//    * try hitting /auth/me or /admin/dashboard to confirm access.
//    */
//   const completeLogin = async (newToken: string, userData: any) => {
//     localStorage.setItem('admin_token', newToken);

//     // First check if role is already in userData
//     let role = userData?.role;

//     // If no role in login response, try fetching profile
//     if (!role) {
//       try {
//         const profileRes = await api.get('/auth/me', {
//           headers: { Authorization: `Bearer ${newToken}` },
//         });
//         const profile = profileRes.data?.data || profileRes.data?.user || profileRes.data;
//         role = profile?.role;
//       } catch {
//         // /auth/me might not return role either, try admin endpoint
//       }
//     }

//     // Still no role? Try hitting admin dashboard to verify access
//     if (!role || !['admin', 'superadmin'].includes(role)) {
//       try {
//         await api.get('/admin/dashboard', {
//           headers: { Authorization: `Bearer ${newToken}` },
//         });
//         // If this succeeds, user has admin access — middleware verified it
//         if (!role) role = 'admin';
//       } catch (adminErr: any) {
//         localStorage.removeItem('admin_token');
//         if (adminErr.response?.status === 403) {
//           throw new Error('Access denied. Admin privileges required. Run makeAdmin.js first.');
//         }
//         throw new Error('Could not verify admin access. Is your backend running?');
//       }
//     }

//     if (!role || !['admin', 'superadmin'].includes(role)) {
//       localStorage.removeItem('admin_token');
//       throw new Error('Access denied. Admin privileges required. Run makeAdmin.js first.');
//     }

//     const adminUser: AdminUser = {
//       _id: userData?._id || '',
//       name: userData?.name || '',
//       username: userData?.username || '',
//       email: userData?.email || '',
//       role: role,
//       profilePicture: userData?.profilePicture || '',
//     };

//     localStorage.setItem('admin_user', JSON.stringify(adminUser));
//     setToken(newToken);
//     setUser(adminUser);
//     setTwoFA(null);
//   };

//   const login = async (email: string, password: string) => {
//     const res = await authApi.login(email, password);
//     const data = res.data;

//     // Check if 2FA is required
//     if (data.requires2FA) {
//       setTwoFA({
//         required: true,
//         tempUserId: data.tempUserId,
//         email: data.email,
//       });
//       return;
//     }

//     // Safety check — make sure we got a token and user
//     if (!data.token) {
//       throw new Error('Login failed — no token received');
//     }

//     if (!data.user) {
//       throw new Error('Login failed — no user data received');
//     }

//     // No 2FA — complete login directly
//     await completeLogin(data.token, data.user);
//   };

//   const verify2FA = async (otp: string) => {
//     if (!twoFA) throw new Error('No 2FA session active');

//     const res = await api.post('/auth/verify-2fa', {
//       email: twoFA.email,
//       otp,
//       tempUserId: twoFA.tempUserId,
//     });

//     const data = res.data;
//     await completeLogin(data.token, data.user);
//   };

//   const resend2FA = async () => {
//     if (!twoFA) throw new Error('No 2FA session active');

//     await api.post('/auth/resend-2fa', {
//       email: twoFA.email,
//       tempUserId: twoFA.tempUserId,
//     });
//   };

//   const cancel2FA = () => {
//     setTwoFA(null);
//   };

//   const logout = () => {
//     localStorage.removeItem('admin_token');
//     localStorage.removeItem('admin_user');
//     setToken(null);
//     setUser(null);
//     setTwoFA(null);
//   };

//   return (
//     <AuthContext.Provider value={{ user, token, twoFA, login, verify2FA, resend2FA, cancel2FA, logout, isLoading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// }







import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '../services/api';
import api from '../services/api';

interface AdminUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  profilePicture: string;
}

interface TwoFAState {
  required: boolean;
  tempUserId: string;
  email: string;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  twoFA: TwoFAState | null;
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (otp: string) => Promise<void>;
  resend2FA: () => Promise<void>;
  cancel2FA: () => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [twoFA, setTwoFA] = useState<TwoFAState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * After getting a token, verify this user has admin role.
   * Your login response may not include `role`, so we also
   * try hitting /auth/me or /admin/dashboard to confirm access.
   */
  const completeLogin = async (newToken: string, userData: any) => {
    localStorage.setItem('admin_token', newToken);

    // First check if role is already in userData
    let role = userData?.role;

    // If no role in login response, try fetching profile
    if (!role) {
      try {
        const profileRes = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        const profile = profileRes.data?.data || profileRes.data?.user || profileRes.data;
        role = profile?.role;
      } catch {
        // /auth/me might not return role either, try admin endpoint
      }
    }

    // Still no role? Try hitting admin dashboard to verify access
    if (!role || !['admin', 'superadmin'].includes(role)) {
      try {
        await api.get('/admin/dashboard', {
          headers: { Authorization: `Bearer ${newToken}` },
        });
        // If this succeeds, user has admin access — middleware verified it
        if (!role) role = 'admin';
      } catch (adminErr: any) {
        localStorage.removeItem('admin_token');
        if (adminErr.response?.status === 403) {
          throw new Error('Access denied. Admin privileges required. Run makeAdmin.js first.');
        }
        throw new Error('Could not verify admin access. Is your backend running?');
      }
    }

    if (!role || !['admin', 'superadmin'].includes(role)) {
      localStorage.removeItem('admin_token');
      throw new Error('Access denied. Admin privileges required. Run makeAdmin.js first.');
    }

    const adminUser: AdminUser = {
      _id: userData?._id || '',
      name: userData?.name || '',
      username: userData?.username || '',
      email: userData?.email || '',
      role: role,
      profilePicture: userData?.profilePicture || '',
    };

    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setToken(newToken);
    setUser(adminUser);
    setTwoFA(null);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const data = res.data;

    // Check if 2FA is required
    if (data.requires2FA) {
      setTwoFA({
        required: true,
        tempUserId: data.tempUserId,
        email: data.email,
      });
      return;
    }

    // Safety check — make sure we got a token and user
    if (!data.token) {
      throw new Error('Login failed — no token received');
    }

    if (!data.user) {
      throw new Error('Login failed — no user data received');
    }

    // No 2FA — complete login directly
    await completeLogin(data.token, data.user);
  };

  const verify2FA = async (otp: string) => {
    if (!twoFA) throw new Error('No 2FA session active');

    const res = await api.post('/auth/verify-2fa', {
      email: twoFA.email,
      otp,
      tempUserId: twoFA.tempUserId,
    });

    const data = res.data;
    await completeLogin(data.token, data.user);
  };

  const resend2FA = async () => {
    if (!twoFA) throw new Error('No 2FA session active');

    await api.post('/auth/resend-2fa', {
      email: twoFA.email,
      tempUserId: twoFA.tempUserId,
    });
  };

  const cancel2FA = () => {
    setTwoFA(null);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
    setTwoFA(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, twoFA, login, verify2FA, resend2FA, cancel2FA, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
