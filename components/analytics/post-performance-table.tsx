"use client";

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Instagram, Twitter, Facebook, Linkedin, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const platformIcons: Record<string, any> = {
  TWITTER: <Twitter className="w-3 h-3 text-blue-400" />,
  INSTAGRAM: <Instagram className="w-3 h-3 text-pink-500" />,
  FACEBOOK: <Facebook className="w-3 h-3 text-blue-600" />,
  LINKEDIN: <Linkedin className="w-3 h-3 text-blue-700" />,
};

interface PostPerformanceTableProps {
  data: any[];
}

export function PostPerformanceTable({ data }: PostPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = data.filter(post => 
    post.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="border-border bg-card rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold">Post Performance</CardTitle>
          <CardDescription>Detailed engagement metrics for your recent posts</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Search posts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64 h-9 rounded-lg border-border"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-accent/5">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-bold text-xs uppercase tracking-wider py-4 pl-6">Post Preview</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Platforms</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Engagement</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Reach</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Engagement Rate</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider pr-6 text-right">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    No posts found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((post) => {
                  // Aggregate metrics for display
                  let totalLikes = 0, totalComments = 0, totalShares = 0, totalReach = 0;
                  const platforms = Object.keys(post.platforms);
                  
                  platforms.forEach(p => {
                    const m = post.platforms[p];
                    totalLikes += m.likes;
                    totalComments += m.comments;
                    totalShares += m.shares;
                    totalReach += m.reach;
                  });

                  const totalEngagement = totalLikes + totalComments + totalShares;
                  const avgRate = platforms.length > 0 
                    ? Object.values(post.platforms).reduce((acc: number, p: any) => acc + parseFloat(p.engagementRate), 0) / platforms.length
                    : 0;

                  return (
                    <TableRow key={post.id} className="border-border hover:bg-accent/5 transition-colors group">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center overflow-hidden shrink-0">
                            {post.mediaUrls && post.mediaUrls.length > 0 ? (
                              <img src={post.mediaUrls[0]} alt="Post preview" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[200px]">
                            <p className="text-sm font-medium text-foreground truncate">{post.content}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {platforms.map(p => (
                            <div key={p} className="p-1.5 rounded-md bg-accent/10 border border-accent/20" title={p}>
                              {platformIcons[p]}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{totalEngagement.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {totalLikes}L • {totalComments}C • {totalShares}S
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-bold text-foreground">{totalReach.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20 font-bold">
                          {avgRate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-medium text-foreground">{format(new Date(post.publishedAt), "MMM dd")}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(post.publishedAt), "h:mm a")}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
