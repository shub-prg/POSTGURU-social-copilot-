"use client";

import React, { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Twitter, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Youtube, 
  Globe,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share2,
  Repeat2,
  Send
} from "lucide-react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

interface PlatformPreviewProps {
  content: string;
  mediaUrls: string[];
  selectedPlatforms: string[];
}

export function PlatformPreview({ content, mediaUrls, selectedPlatforms }: PlatformPreviewProps) {
  const { user } = useUser();

  const renderPreview = (platform: string) => {
    switch (platform) {
      case "TWITTER":
        return renderTwitterPreview();
      case "INSTAGRAM":
        return renderInstagramPreview();
      case "LINKEDIN":
      case "FACEBOOK":
        return renderLinkedInPreview();
      default:
        return renderTwitterPreview();
    }
  };

  const renderTwitterPreview = () => (
    <div className="bg-background rounded-xl border border-border overflow-hidden p-5 space-y-4 shadow-sm w-full max-w-md mx-auto">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 border border-border">
          {user?.imageUrl && <Image src={user.imageUrl} alt="Avatar" width={40} height={40} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[14px] truncate">{user?.fullName || "Your Name"}</span>
            <span className="text-muted-foreground text-[13px] truncate">@{user?.username || "username"} · Now</span>
          </div>
          <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words mt-1">
            {content || "Your post content will appear here..."}
          </p>
          
          {mediaUrls.length > 0 && (
            <div className={`mt-3 grid gap-2 rounded-2xl overflow-hidden border border-border ${
              mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}>
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-video bg-slate-100 dark:bg-slate-900">
                  <Image src={url} alt="Preview" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 text-muted-foreground max-w-[280px]">
            <MessageCircle className="w-4 h-4 hover:text-sky-500 cursor-pointer transition-colors" />
            <Repeat2 className="w-4 h-4 hover:text-green-500 cursor-pointer transition-colors" />
            <Heart className="w-4 h-4 hover:text-pink-500 cursor-pointer transition-colors" />
            <Share2 className="w-4 h-4 hover:text-sky-500 cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderInstagramPreview = () => (
    <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm w-full max-w-md mx-auto">
      <div className="p-3 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-200 border border-border">
            {user?.imageUrl && <Image src={user.imageUrl} alt="Avatar" width={28} height={28} />}
          </div>
          <span className="text-xs font-semibold">{user?.username || "username"}</span>
        </div>
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="aspect-square bg-slate-100 dark:bg-slate-950 relative">
        {mediaUrls.length > 0 ? (
          <Image src={mediaUrls[0]} alt="Preview" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground italic text-xs px-10 text-center">
            Instagram posts require at least one image or video
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center gap-4 mb-2">
          <Heart className="w-5 h-5 hover:text-pink-500 cursor-pointer" />
          <MessageCircle className="w-5 h-5 hover:text-slate-400 cursor-pointer" />
          <Send className="w-5 h-5 hover:text-slate-400 cursor-pointer" />
        </div>
        <p className="text-[13px]">
          <span className="font-bold mr-2">{user?.username || "username"}</span>
          <span className="whitespace-pre-wrap">{content || "Your post content will appear here..."}</span>
        </p>
        <span className="text-[9px] text-muted-foreground uppercase mt-1 block">Just now</span>
      </div>
    </div>
  );

  const renderLinkedInPreview = () => (
    <div className="bg-background rounded-xl border border-border overflow-hidden p-4 space-y-3 shadow-sm w-full max-w-md mx-auto">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-slate-200 border border-border">
          {user?.imageUrl && <Image src={user.imageUrl} alt="Avatar" width={40} height={40} />}
        </div>
        <div className="min-w-0">
          <h4 className="text-[13px] font-bold truncate">{user?.fullName || "Your Name"}</h4>
          <p className="text-[11px] text-muted-foreground truncate">Social Media Manager · Now</p>
        </div>
      </div>
      
      <p className="text-[13px] leading-relaxed whitespace-pre-wrap mt-1">
        {content || "Your post content will appear here..."}
      </p>

      {mediaUrls.length > 0 && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border relative aspect-video bg-slate-100 dark:bg-slate-950">
           <Image src={mediaUrls[0]} alt="Preview" fill className="object-cover" />
        </div>
      )}

      <div className="flex items-center justify-between pt-3 mt-1 border-t border-border text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer text-[12px] font-semibold transition-colors">
          <Heart className="w-4 h-4" /> Like
        </div>
        <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer text-[12px] font-semibold transition-colors">
          <MessageCircle className="w-4 h-4" /> Comment
        </div>
        <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer text-[12px] font-semibold transition-colors">
          <Share2 className="w-4 h-4" /> Share
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 flex flex-col">
      <div className="flex items-center justify-between w-full px-1">
        <h3 className="text-xl font-bold tracking-tight text-foreground/90">Post Previews</h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">Live</span>
        </div>
      </div>

      <Card className="border border-border/60 shadow-2xl bg-card/40 backdrop-blur-xl overflow-hidden rounded-3xl w-full max-w-[500px]">
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar p-6 space-y-8">
            {selectedPlatforms.length > 0 ? (
              selectedPlatforms.map((platform) => (
                <div key={platform} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 px-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                    <h4 className="font-extrabold text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 whitespace-nowrap">
                      {platform} PREVIEW
                    </h4>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>
                  <div className="flex justify-center">
                    {renderPreview(platform)}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 px-10">
                <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/20">
                  <Globe className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-muted-foreground">No Platform Selected</h4>
                  <p className="text-sm text-muted-foreground/60">
                    Select one or more platforms on the left to see how your post will look.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
