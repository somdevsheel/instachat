// import api from '../services/api';

// /* =========================
//    AUTH
// ========================= */

// /**
//  * ❌ Old direct register (keep only if backend still supports it)
//  * If backend register route is removed, do NOT use this.
//  */
// export const register = async (userData) => {
//   const res = await api.post('/auth/register', userData);
//   return res.data;
// };

// export const login = async (email, password) => {
//   const res = await api.post('/auth/login', { email, password });
//   return res.data;
// };

// export const logout = async () => {
//   const res = await api.post('/auth/logout');
//   return res.data;
// };

// export const getMe = async () => {
//   const res = await api.get('/auth/me');
//   return res.data;
// };

// /* =========================
//    REGISTER WITH OTP (NEW)
// ========================= */

// /**
//  * STEP 1: Request OTP for registration
//  * Backend: POST /api/v1/auth/register/request-otp
//  */
// // export const requestRegisterOtp = async (email) => {
// //   const res = await api.post('/auth/register/request-otp', { email });
// //   return res.data;
// // };

// // /**
// //  * STEP 2: Verify OTP & create account
// //  * Backend: POST /api/v1/auth/register/verify-otp
// //  */
// // export const verifyRegisterOtp = async (email, otp, password) => {
// //   const res = await api.post('/auth/register/verify-otp', {
// //     email,
// //     otp,
// //     password,
// //   });
// //   return res.data;
// // };

// export const requestRegisterOtp = async (email) => {
//   const res = await api.post('/auth/register/request-otp', {
//     email,
//   });
//   return res.data;
// };

// /**
//  * STEP 2: Verify OTP & create account
//  * Backend: POST /api/v1/auth/register/verify-otp
//  */
// export const verifyRegisterOtp = async ({
//   email,
//   otp,
//   password,
//   username,
//   fullName,
// }) => {
//   const res = await api.post('/auth/register/verify-otp', {
//     email,
//     otp,
//     password,
//     username,
//     fullName,
//   });
//   return res.data;
// };

// /* =========================
//    PASSWORD
// ========================= */

// /**
//  * 🔐 Update password (logged-in user)
//  * Backend: PATCH /api/v1/users/update-password
//  */
// export const updatePassword = async (currentPassword, newPassword) => {
//   const res = await api.patch('/users/update-password', {
//     currentPassword,
//     newPassword,
//   });
//   return res.data;
// };






// /* =========================
//    FORGOT PASSWORD
// ========================= */

// export const requestForgotPasswordOtp = async (email) => {
//   const res = await api.post(
//     "/auth/forgot-password/request-otp",
//     { email }
//   );
//   return res.data;
// };

// export const verifyForgotPasswordOtp = async ({
//   email,
//   otp,
//   newPassword,
// }) => {
//   const res = await api.post(
//     "/auth/forgot-password/verify-otp",
//     {
//       email,
//       otp,
//       newPassword,
//     }
//   );
//   return res.data;
// };








import api from '../services/api';

/* =========================
   AUTH
========================= */

export const register = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

/* =========================
   REGISTER WITH OTP
========================= */

export const requestRegisterOtp = async (email) => {
  const res = await api.post('/auth/register/request-otp', {
    email,
  });
  return res.data;
};

export const verifyRegisterOtp = async ({
  email,
  otp,
  password,
  username,
  fullName,
}) => {
  const res = await api.post('/auth/register/verify-otp', {
    email,
    otp,
    password,
    username,
    fullName,
  });
  return res.data;
};

/* =========================
   PASSWORD
========================= */

export const updatePassword = async (currentPassword, newPassword) => {
  const res = await api.patch('/users/update-password', {
    currentPassword,
    newPassword,
  });
  return res.data;
};

/* =========================
   FORGOT PASSWORD
========================= */

export const requestForgotPasswordOtp = async (email) => {
  const res = await api.post(
    "/auth/forgot-password/request-otp",
    { email }
  );
  return res.data;
};

export const verifyForgotPasswordOtp = async ({
  email,
  otp,
  newPassword,
}) => {
  const res = await api.post(
    "/auth/forgot-password/verify-otp",
    {
      email,
      otp,
      newPassword,
    }
  );
  return res.data;
};

/* =========================
   🔐 TWO-FACTOR AUTH (NEW)
========================= */

export const verify2FA = async ({ email, otp, tempUserId }) => {
  const res = await api.post('/auth/verify-2fa', {
    email,
    otp,
    tempUserId,
  });
  return res.data;
};

export const resend2FA = async ({ email, tempUserId }) => {
  const res = await api.post('/auth/resend-2fa', {
    email,
    tempUserId,
  });
  return res.data;
};