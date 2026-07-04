export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePicture: string;
  bio: string;
  role?: string;
  isVerified: boolean;
  isPrivate: boolean;
  isBanned?: boolean;
  isSuspended?: boolean;
  suspendedUntil?: string;
  banReason?: string;
  twoFactorEnabled: boolean;
  followers: string[];
  following: string[];
  followersCount?: number;
  followingCount?: number;
  postCount?: number;
  reelCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  type: 'image' | 'video';
  originalKey: string;
  variants: {
    original: string;
    thumbnail?: string;
  };
}

export interface Post {
  _id: string;
  user: Pick<User, '_id' | 'username' | 'name' | 'profilePicture'>;
  caption: string;
  media: Media;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  shareCount: number;
  reportCount?: number;
  createdAt: string;
}

export interface Reel {
  _id: string;
  user: Pick<User, '_id' | 'username' | 'name' | 'profilePicture'>;
  caption: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  shareCount: number;
  isActive: boolean;
  reportCount?: number;
  createdAt: string;
}

export interface StoryMedia {
  type: 'image' | 'video';
  key: string;
  url: string;
}

export interface Story {
  _id: string;
  user: Pick<User, '_id' | 'username' | 'name' | 'profilePicture'>;
  media: StoryMedia;
  seenBy: string[];
  expiresAt: string;
  createdAt: string;
}

export interface Comment {
  _id: string;
  user: Pick<User, '_id' | 'username' | 'profilePicture'>;
  post?: { _id: string; caption: string };
  reel?: { _id: string; caption: string };
  content: string;
  likesCount: number;
  createdAt: string;
}

export interface Report {
  _id: string;
  reporter: Pick<User, '_id' | 'username' | 'profilePicture'>;
  targetType: 'post' | 'reel' | 'story' | 'comment' | 'user';
  targetPost?: Post;
  targetReel?: Reel;
  targetStory?: Story;
  targetComment?: Comment;
  targetUser?: Pick<User, '_id' | 'username' | 'profilePicture'>;
  reason: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  reviewedBy?: Pick<User, '_id' | 'username'>;
  reviewedAt?: string;
  actionTaken: string;
  adminNotes: string;
  createdAt: string;
}

export interface DashboardStats {
  stats: {
    totalUsers: number;
    totalPosts: number;
    totalReels: number;
    totalStories: number;
    totalReports: number;
    pendingReports: number;
    bannedUsers: number;
    newUsersToday: number;
    newPostsToday: number;
  };
  userGrowth: Array<{ _id: string; count: number }>;
  contentGrowth: Array<{ _id: string; count: number }>;
  recentReports: Report[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
}
