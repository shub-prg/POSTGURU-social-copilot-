import { 
  TwitterIcon, 
  LinkedinIcon, 
  InstagramIcon, 
  FacebookIcon, 
  YoutubeIcon, 
  PinterestIcon, 
  RedditIcon, 
  ThreadsIcon 
} from '@hugeicons/core-free-icons';

export type Platform = 
  | 'TWITTER'
  | 'LINKEDIN'
  | 'INSTAGRAM'
  | 'FACEBOOK'
  | 'YOUTUBE'
  | 'PINTEREST'
  | 'REDDIT'
  | 'THREADS';

export interface PlatformConfig {
  id: Platform;
  name: string;
  color: string;
  icon: React.ElementType | any;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
  requiresPkce?: boolean;
  isDemo?: boolean;
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  TWITTER: {
    id: 'TWITTER',
    name: 'Twitter/X',
    color: '#000000',
    icon: TwitterIcon,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    requiresPkce: true,
    isDemo: false,
  },
  LINKEDIN: {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    color: '#0077B5',
    icon: LinkedinIcon,
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    isDemo: true,
  },
  INSTAGRAM: {
    id: 'INSTAGRAM',
    name: 'Instagram',
    color: '#E4405F',
    icon: InstagramIcon,
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement', 'instagram_manage_insights', 'instagram_manage_comments'],
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    isDemo: false,
  },
  FACEBOOK: {
    id: 'FACEBOOK',
    name: 'Facebook',
    color: '#1877F2',
    icon: FacebookIcon,
    scopes: [
      'public_profile', 
      'email', 
      'pages_show_list', 
      'pages_read_engagement', 
      'pages_manage_posts', 
      'pages_manage_metadata', 
      'pages_manage_engagement',
      'instagram_basic',
      'instagram_manage_insights',
      'instagram_content_publish',
      'instagram_manage_comments',
    ],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    isDemo: false,
  },
  YOUTUBE: {
    id: 'YOUTUBE',
    name: 'YouTube',
    color: '#FF0000',
    icon: YoutubeIcon,
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    isDemo: true,
  },
  PINTEREST: {
    id: 'PINTEREST',
    name: 'Pinterest',
    color: '#BD081C',
    icon: PinterestIcon,
    scopes: ['boards:read', 'pins:read', 'pins:write'],
    authUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    isDemo: true,
  },
  REDDIT: {
    id: 'REDDIT',
    name: 'Reddit',
    color: '#FF4500',
    icon: RedditIcon,
    scopes: ['identity', 'submit', 'read'],
    authUrl: 'https://www.reddit.com/api/v1/authorize',
    tokenUrl: 'https://www.reddit.com/api/v1/access_token',
    isDemo: true,
  },
  THREADS: {
    id: 'THREADS',
    name: 'Threads',
    color: '#000000',
    icon: ThreadsIcon,
    scopes: ['threads_basic', 'threads_content_publish'],
    authUrl: 'https://threads.net/oauth/authorize',
    tokenUrl: 'https://graph.threads.net/oauth/access_token',
    isDemo: true,
  },
};

export const getRedirectUri = (platform: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/oauth/callback/${platform.toLowerCase()}`;
};
