// import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// import {
//   getReelsFeed,
//   likeReel,
//   deleteReel as deleteReelApi,
//   incrementReelView,
// } from '../../api/reels.api';

// /**
//  * ======================================================
//  * FETCH REELS FEED
//  * ======================================================
//  */
// export const fetchReels = createAsyncThunk(
//   'reels/fetchReels',
//   async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
//     try {
//       const res = await getReelsFeed(page, limit);

//       if (!res?.success) {
//         throw new Error('Invalid reels response');
//       }

//       return {
//         reels: res.data || [],
//         pagination: res.pagination,
//         page,
//       };
//     } catch (err) {
//       return rejectWithValue(
//         err?.response?.data?.message || 'Failed to load reels'
//       );
//     }
//   }
// );

// /**
//  * ======================================================
//  * LIKE / UNLIKE REEL
//  * ======================================================
//  */
// export const toggleReelLike = createAsyncThunk(
//   'reels/toggleLike',
//   async (reelId, { rejectWithValue }) => {
//     try {
//       if (!reelId) {
//         throw new Error('Reel ID is required');
//       }

//       const res = await likeReel(reelId);

//       if (!res?.success) {
//         throw new Error('Like failed');
//       }

//       return {
//         reelId,
//         liked: res.data.liked,
//         likesCount: res.data.likesCount,
//       };
//     } catch (err) {
//       return rejectWithValue(
//         err?.response?.data?.message || err.message || 'Failed to like reel'
//       );
//     }
//   }
// );

// /**
//  * ======================================================
//  * INCREMENT VIEW COUNT
//  * ======================================================
//  */
// export const trackReelView = createAsyncThunk(
//   'reels/trackView',
//   async (reelId, { rejectWithValue }) => {
//     try {
//       if (!reelId) return;

//       const res = await incrementReelView(reelId);

//       return {
//         reelId,
//         viewsCount: res.data?.viewsCount,
//       };
//     } catch (err) {
//       // Silent fail for view tracking
//       return rejectWithValue('View tracking failed');
//     }
//   }
// );

// /**
//  * ======================================================
//  * DELETE REEL
//  * ======================================================
//  */
// export const deleteReel = createAsyncThunk(
//   'reels/deleteReel',
//   async (reelId, { rejectWithValue }) => {
//     try {
//       if (!reelId) {
//         throw new Error('Reel ID is required');
//       }

//       const res = await deleteReelApi(reelId);

//       if (!res?.success) {
//         throw new Error('Delete failed');
//       }

//       return { reelId };
//     } catch (err) {
//       return rejectWithValue(
//         err?.response?.data?.message || 'Failed to delete reel'
//       );
//     }
//   }
// );

// /**
//  * ======================================================
//  * SLICE
//  * ======================================================
//  */
// const reelSlice = createSlice({
//   name: 'reels',

//   initialState: {
//     reels: [],
//     loading: false,
//     refreshing: false,
//     error: null,
//     currentIndex: 0,
//     pagination: {
//       page: 1,
//       totalPages: 1,
//       totalReels: 0,
//     },
//   },

//   reducers: {
//     clearReels: (state) => {
//       state.reels = [];
//       state.loading = false;
//       state.error = null;
//       state.currentIndex = 0;
//       state.pagination = { page: 1, totalPages: 1, totalReels: 0 };
//     },

//     setCurrentIndex: (state, action) => {
//       state.currentIndex = action.payload;
//     },

//     addNewReel: (state, action) => {
//       // Add new reel at the beginning
//       state.reels.unshift(action.payload);
//     },

//     // Socket: update like from another device
//     updateReelLikeFromSocket: (state, action) => {
//       const { reelId, liked, likesCount } = action.payload;
//       const reel = state.reels.find((r) => r._id === reelId);
//       if (reel) {
//         reel.isLiked = liked;
//         reel.likesCount = likesCount;
//       }
//     },

//     // Socket: remove deleted reel
//     removeReelFromSocket: (state, action) => {
//       const { reelId } = action.payload;
//       state.reels = state.reels.filter((r) => r._id !== reelId);
//     },
//   },

//   extraReducers: (builder) => {
//     builder
//       /* ================= FETCH REELS ================= */
//       .addCase(fetchReels.pending, (state, action) => {
//         const page = action.meta.arg?.page || 1;
//         if (page === 1) {
//           state.loading = true;
//         } else {
//           state.refreshing = true;
//         }
//         state.error = null;
//       })

//       .addCase(fetchReels.fulfilled, (state, action) => {
//         state.loading = false;
//         state.refreshing = false;

//         const { reels, pagination, page } = action.payload;

//         if (page === 1) {
//           // Fresh load or pull to refresh
//           state.reels = reels.map((reel) => ({
//             ...reel,
//             isLiked: reel.isLiked ?? false,
//             likesCount: reel.likesCount ?? 0,
//           }));
//         } else {
//           // Load more - append
//           const newReels = reels.map((reel) => ({
//             ...reel,
//             isLiked: reel.isLiked ?? false,
//             likesCount: reel.likesCount ?? 0,
//           }));
          
//           // Avoid duplicates
//           const existingIds = new Set(state.reels.map((r) => r._id));
//           const uniqueNew = newReels.filter((r) => !existingIds.has(r._id));
//           state.reels = [...state.reels, ...uniqueNew];
//         }

//         state.pagination = pagination;
//       })

//       .addCase(fetchReels.rejected, (state, action) => {
//         state.loading = false;
//         state.refreshing = false;
//         state.error = action.payload;
//       })

//       /* ================= LIKE REEL ================= */
//       .addCase(toggleReelLike.fulfilled, (state, action) => {
//         const { reelId, liked, likesCount } = action.payload;
//         const reel = state.reels.find((r) => r._id === reelId);
//         if (reel) {
//           reel.isLiked = liked;
//           reel.likesCount = likesCount;
//         }
//       })

//       .addCase(toggleReelLike.rejected, (state, action) => {
//         state.error = action.payload;
//       })

//       /* ================= VIEW TRACKING ================= */
//       .addCase(trackReelView.fulfilled, (state, action) => {
//         const { reelId, viewsCount } = action.payload;
//         if (viewsCount !== undefined) {
//           const reel = state.reels.find((r) => r._id === reelId);
//           if (reel) {
//             reel.viewsCount = viewsCount;
//           }
//         }
//       })

//       /* ================= DELETE REEL ================= */
//       .addCase(deleteReel.fulfilled, (state, action) => {
//         const { reelId } = action.payload;
//         state.reels = state.reels.filter((r) => r._id !== reelId);
//       })

//       .addCase(deleteReel.rejected, (state, action) => {
//         state.error = action.payload;
//       });
//   },
// });

// export const {
//   clearReels,
//   setCurrentIndex,
//   addNewReel,
//   updateReelLikeFromSocket,
//   removeReelFromSocket,
// } = reelSlice.actions;

// export default reelSlice.reducer;






import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getReelsFeed,
  likeReel,
  deleteReel as deleteReelApi,
  incrementReelView,
} from '../../api/reels.api';

/**
 * ======================================================
 * FETCH REELS FEED
 * ======================================================
 */
export const fetchReels = createAsyncThunk(
  'reels/fetchReels',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const res = await getReelsFeed(page, limit);

      if (!res?.success) {
        throw new Error('Invalid reels response');
      }

      return {
        reels: res.data || [],
        pagination: res.pagination,
        page,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Failed to load reels'
      );
    }
  }
);

/**
 * ======================================================
 * LIKE / UNLIKE REEL
 * ======================================================
 */
export const toggleReelLike = createAsyncThunk(
  'reels/toggleLike',
  async (reelId, { rejectWithValue }) => {
    try {
      if (!reelId) {
        throw new Error('Reel ID is required');
      }

      const res = await likeReel(reelId);

      if (!res?.success) {
        throw new Error('Like failed');
      }

      return {
        reelId,
        liked: res.data.liked,
        likesCount: res.data.likesCount,
      };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err.message || 'Failed to like reel'
      );
    }
  }
);

/**
 * ======================================================
 * INCREMENT VIEW COUNT
 * ======================================================
 */
export const trackReelView = createAsyncThunk(
  'reels/trackView',
  async (reelId, { rejectWithValue }) => {
    try {
      if (!reelId) return;

      const res = await incrementReelView(reelId);

      return {
        reelId,
        viewsCount: res.data?.viewsCount,
      };
    } catch (err) {
      // Silent fail for view tracking
      return rejectWithValue('View tracking failed');
    }
  }
);

/**
 * ======================================================
 * DELETE REEL
 * ======================================================
 */
export const deleteReel = createAsyncThunk(
  'reels/deleteReel',
  async (reelId, { rejectWithValue }) => {
    try {
      if (!reelId) {
        throw new Error('Reel ID is required');
      }

      const res = await deleteReelApi(reelId);

      if (!res?.success) {
        throw new Error('Delete failed');
      }

      return { reelId };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || 'Failed to delete reel'
      );
    }
  }
);

/**
 * ======================================================
 * SLICE
 * ======================================================
 */
const reelSlice = createSlice({
  name: 'reels',

  initialState: {
    reels: [],
    loading: false,
    refreshing: false,
    error: null,
    currentIndex: 0,
    pagination: {
      page: 1,
      totalPages: 1,
      totalReels: 0,
    },
  },

  reducers: {
    clearReels: (state) => {
      state.reels = [];
      state.loading = false;
      state.error = null;
      state.currentIndex = 0;
      state.pagination = { page: 1, totalPages: 1, totalReels: 0 };
    },

    setCurrentIndex: (state, action) => {
      state.currentIndex = action.payload;
    },

    addNewReel: (state, action) => {
      // Add new reel at the beginning
      state.reels.unshift(action.payload);
    },

    // ⭐ NEW: Update follow status for a user across all reels
    updateUserFollowStatus: (state, action) => {
      const { userId, following } = action.payload;
      
      // Update all reels from this user
      state.reels.forEach((reel) => {
        if (reel.user?._id === userId) {
          reel.user.isFollowing = following;
        }
      });
    },

    // Socket: update like from another device
    updateReelLikeFromSocket: (state, action) => {
      const { reelId, liked, likesCount } = action.payload;
      const reel = state.reels.find((r) => r._id === reelId);
      if (reel) {
        reel.isLiked = liked;
        reel.likesCount = likesCount;
      }
    },

    // Socket: remove deleted reel
    removeReelFromSocket: (state, action) => {
      const { reelId } = action.payload;
      state.reels = state.reels.filter((r) => r._id !== reelId);
    },
  },

  extraReducers: (builder) => {
    builder
      /* ================= FETCH REELS ================= */
      .addCase(fetchReels.pending, (state, action) => {
        const page = action.meta.arg?.page || 1;
        if (page === 1) {
          state.loading = true;
        } else {
          state.refreshing = true;
        }
        state.error = null;
      })

      .addCase(fetchReels.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;

        const { reels, pagination, page } = action.payload;

        if (page === 1) {
          // Fresh load or pull to refresh
          state.reels = reels.map((reel) => ({
            ...reel,
            isLiked: reel.isLiked ?? false,
            likesCount: reel.likesCount ?? 0,
            // Ensure user follow status is preserved
            user: {
              ...reel.user,
              isFollowing: reel.user?.isFollowing ?? false,
            },
          }));
        } else {
          // Load more - append
          const newReels = reels.map((reel) => ({
            ...reel,
            isLiked: reel.isLiked ?? false,
            likesCount: reel.likesCount ?? 0,
            user: {
              ...reel.user,
              isFollowing: reel.user?.isFollowing ?? false,
            },
          }));
          
          // Avoid duplicates
          const existingIds = new Set(state.reels.map((r) => r._id));
          const uniqueNew = newReels.filter((r) => !existingIds.has(r._id));
          state.reels = [...state.reels, ...uniqueNew];
        }

        state.pagination = pagination;
      })

      .addCase(fetchReels.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
      })

      /* ================= LIKE REEL ================= */
      .addCase(toggleReelLike.fulfilled, (state, action) => {
        const { reelId, liked, likesCount } = action.payload;
        const reel = state.reels.find((r) => r._id === reelId);
        if (reel) {
          reel.isLiked = liked;
          reel.likesCount = likesCount;
        }
      })

      .addCase(toggleReelLike.rejected, (state, action) => {
        state.error = action.payload;
      })

      /* ================= VIEW TRACKING ================= */
      .addCase(trackReelView.fulfilled, (state, action) => {
        const { reelId, viewsCount } = action.payload;
        if (viewsCount !== undefined) {
          const reel = state.reels.find((r) => r._id === reelId);
          if (reel) {
            reel.viewsCount = viewsCount;
          }
        }
      })

      /* ================= DELETE REEL ================= */
      .addCase(deleteReel.fulfilled, (state, action) => {
        const { reelId } = action.payload;
        state.reels = state.reels.filter((r) => r._id !== reelId);
      })

      .addCase(deleteReel.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearReels,
  setCurrentIndex,
  addNewReel,
  updateUserFollowStatus,
  updateReelLikeFromSocket,
  removeReelFromSocket,
} = reelSlice.actions;

export default reelSlice.reducer;