'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  PLATFORM_CONFIGS, 
  Platform 
} from '@/lib/platforms';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';

interface Account {
  id: string;
  platform: Platform;
  platformUsername: string | null;
  profilePictureUrl: string | null;
  followersCount: number;
  isActive: boolean;
  expiresAt: string | null;
}

interface AccountsGridProps {
  connectedAccounts: Account[];
}

export function AccountsGrid({ connectedAccounts }: AccountsGridProps) {
  const router = useRouter();

  const handleConnect = (platform: string) => {
    // Add a cache-busting timestamp to prevent the browser from using a cached redirect
    window.location.href = `/api/oauth/connect/${platform.toLowerCase()}?t=${Date.now()}`;
  };

  const handleDisconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/oauth/manage/disconnect/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(`Successfully disconnected ${data.platform} account`);
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to disconnect account');
      }
    } catch (err) {
      toast.error('An error occurred while disconnecting');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
      {Object.values(PLATFORM_CONFIGS).map((config) => {
        const connection = connectedAccounts.find((a) => a.platform === config.id);
        const Icon = config.icon;

        return (
          <Card key={config.id} className="overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 group">
            <div 
              className="h-1.5 w-full" 
              style={{ backgroundColor: config.color }} 
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-lg text-white" 
                  style={{ backgroundColor: config.color }}
                >
                  <HugeiconsIcon icon={config.icon} size={20} />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold">{config.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {connection ? (config.isDemo ? 'Connected (Demo)' : 'Connected') : 'Not connected'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {connection && (
                  <Badge variant={connection.isActive ? "default" : "destructive"} className="h-5 text-[10px]">
                    {connection.isActive ? 'Active' : 'Expired'}
                  </Badge>
                )}
                {config.isDemo && (
                  <Badge variant="secondary" className="h-4 text-[9px] px-1 opacity-70">
                    Demo
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {connection ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarImage src={connection.profilePictureUrl || ''} />
                    <AvatarFallback>{connection.platformUsername?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{connection.platformUsername || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{connection.followersCount.toLocaleString()} followers</p>
                  </div>
                </div>
              ) : (
                <div className="h-12 flex items-center justify-center text-muted-foreground/50 italic text-sm">
                  Ready to connect
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-2">
              {connection ? (
                <div className="w-full flex gap-2">
                  {!connection.isActive && (
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="w-full text-xs font-semibold bg-white dark:bg-zinc-900 text-black dark:text-white border-border hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
                      onClick={() => handleConnect(config.id)}
                    >
                      Reconnect
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={() => handleDisconnect(connection.id)}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full text-xs font-semibold bg-white dark:bg-zinc-900 text-black dark:text-white border-border hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
                  onClick={() => handleConnect(config.id)}
                >
                  Connect {config.name}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
