"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "./platform-selector";
import { MediaUpload } from "./media-upload";
import { PlatformPreview } from "./platform-preview";
import { AICaptionModal } from "./ai-caption-modal";
import { SchedulingOptions } from "./scheduling-options";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";
import { 
  Smile, 
  Hash, 
  Sparkles, 
  Send, 
  Calendar as CalendarIcon,
  Save,
  Trash2,
  Loader2,
  X,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface PostComposerProps {
  connectedAccounts: any[];
  userId: string;
  initialDate?: string;
}

export function PostComposer({ connectedAccounts, userId, initialDate }: PostComposerProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<{ url: string; fileId: string }[]>([]);
  const [isScheduling, setIsScheduling] = useState(!!initialDate);
  const [scheduledAt, setScheduledAt] = useState<Date | undefined>(initialDate ? new Date(initialDate) : undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);
  const [isGeneratingHashtags, setIsGeneratingHashtags] = useState(false);
  const [lastPostAt, setLastPostAt] = useState<number | null>(null);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const fetchLatestPost = async () => {
    try {
      const response = await fetch("/api/posts");
      const data = await response.json();
      if (data && data.createdAt) {
        setLastPostAt(new Date(data.createdAt).getTime());
      }
    } catch (error) {
      console.error("Failed to fetch latest post", error);
    }
  };

  useEffect(() => {
    fetchLatestPost();
  }, []);

  useEffect(() => {
    if (!lastPostAt) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastPostAt;
      const fifteenMinutes = 15 * 60 * 1000;
      const remaining = Math.max(0, fifteenMinutes - elapsed);
      setCooldownTime(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastPostAt]);

  const formatCooldown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Auto-save logic
  useEffect(() => {
    const savedDraft = localStorage.getItem("post-draft");
    if (savedDraft) {
      const { content: savedContent, selectedPlatforms: savedPlatforms } = JSON.parse(savedDraft);
      if (!content && selectedPlatforms.length === 0) {
        setContent(savedContent);
        setSelectedPlatforms(savedPlatforms);
      }
    }
  }, []);

  useEffect(() => {
    const draft = JSON.stringify({ content, selectedPlatforms });
    const timer = setTimeout(() => {
      localStorage.setItem("post-draft", draft);
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, selectedPlatforms]);

  const handleEmojiClick = (emojiData: any) => {
    setContent(prev => prev + emojiData.emoji);
  };

  const generateHashtags = async () => {
    if (!content) {
      toast.error("Please add some content first to generate relevant hashtags");
      return;
    }

    setIsGeneratingHashtags(true);
    try {
      const response = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error("Failed to generate hashtags");
      const data = await response.json();
      setSuggestedHashtags(data.hashtags || []);
    } catch (error) {
      console.error(error);
      toast.error("Could not generate hashtags");
    } finally {
      setIsGeneratingHashtags(false);
    }
  };

  const addHashtag = (tag: string) => {
    setContent(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${tag}` : tag;
    });
    setSuggestedHashtags(prev => prev.filter(t => t !== tag));
  };

  const handlePublish = async (status: 'PUBLISHED' | 'SCHEDULED' | 'DRAFT') => {
    if (!content && mediaUrls.length === 0) {
      toast.error("Please add some content or media");
      return;
    }

    if (selectedPlatforms.length === 0 && status !== 'DRAFT') {
      toast.error("Please select at least one platform");
      return;
    }

    if (status === 'SCHEDULED' && !scheduledAt) {
      toast.error("Please select a date and time for scheduling");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          mediaUrls,
          platforms: selectedPlatforms,
          scheduledAt: status === 'SCHEDULED' ? scheduledAt?.toISOString() : null,
          status,
          userId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save post");

      toast.success(status === 'SCHEDULED' ? "Post scheduled successfully!" : status === 'DRAFT' ? "Draft saved!" : "Post published!");
      localStorage.removeItem("post-draft");
      
      // Refresh cooldown
      await fetchLatestPost();
      
      if (status !== 'DRAFT') {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Composer */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="border border-border shadow-xl bg-card">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create Your Post
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                Select Platforms
              </label>
              <PlatformSelector 
                connectedAccounts={connectedAccounts} 
                selectedPlatforms={selectedPlatforms} 
                setSelectedPlatforms={setSelectedPlatforms} 
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-muted-foreground">Post Content</label>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[11px] font-bold uppercase tracking-wider gap-1.5 text-primary hover:text-primary hover:bg-primary/10 border border-primary/20 rounded-lg"
                    onClick={() => setIsAIModalOpen(true)}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Write with AI
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Textarea 
                  placeholder="What's on your mind? Or use the AI assistant to help you write..." 
                  className="min-h-[220px] resize-none text-base p-6 bg-background border border-border focus:ring-2 focus:ring-primary/20 transition-all rounded-2xl text-foreground"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                {!content && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40"
                    style={{ zIndex: 0 }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Sparkles className="w-10 h-10 text-primary/30" />
                      <p className="text-sm font-medium">Use AI to generate amazing content</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    content.length > 280 
                      ? "bg-destructive/10 text-destructive border-destructive/20" 
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}>
                    {content.length} / 280
                  </span>
                </div>
              </div>

              {/* Tools: Emoji & Hashtags */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger 
                      render={(props) => (
                        <Button {...props} variant="outline" size="sm" className="h-9 px-3 gap-2">
                          <Smile className="w-4 h-4" />
                          Emoji
                        </Button>
                      )}
                    />
                    <PopoverContent className="w-auto p-0 border-none shadow-2xl" side="right">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        theme={resolvedTheme === 'dark' ? Theme.DARK : Theme.LIGHT}
                        width={350}
                        height={400}
                      />
                    </PopoverContent>
                  </Popover>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 gap-2"
                    onClick={generateHashtags}
                    disabled={isGeneratingHashtags}
                  >
                    {isGeneratingHashtags ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Hash className="w-4 h-4" />
                    )}
                    Generate Hashtags
                  </Button>
                </div>

                {/* Suggested Hashtags Area */}
                {suggestedHashtags.length > 0 && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary/60">AI Suggested Hashtags</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSuggestedHashtags([])}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {suggestedHashtags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-primary hover:text-white transition-colors py-1 px-2.5 rounded-lg text-xs"
                          onClick={() => addHashtag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media Upload */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-muted-foreground">Media</label>
              <MediaUpload mediaUrls={mediaUrls} setMediaUrls={setMediaUrls} />
            </div>

            {/* Scheduling */}
            <div className="space-y-3 pt-2 border-t border-border">
              <SchedulingOptions 
                isScheduling={isScheduling} 
                setIsScheduling={setIsScheduling}
                scheduledAt={scheduledAt}
                setScheduledAt={setScheduledAt}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button 
                variant="ghost" 
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setContent("");
                  setMediaUrls([]);
                  setSelectedPlatforms([]);
                  setSuggestedHashtags([]);
                  localStorage.removeItem("post-draft");
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
              <div className="flex flex-col items-end gap-3">
                {cooldownTime > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 animate-pulse">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Wait {formatCooldown(cooldownTime)} to post again
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handlePublish('DRAFT')}
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Draft
                  </Button>
                  <Button 
                    onClick={() => handlePublish(isScheduling ? 'SCHEDULED' : 'PUBLISHED')}
                    disabled={isSubmitting || (selectedPlatforms.length === 0) || cooldownTime > 0}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      "Processing..."
                    ) : cooldownTime > 0 ? (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Cooling Down
                      </>
                    ) : isScheduling ? (
                      <>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Schedule Post
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publish Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Previews */}
      <div className="lg:col-span-5 space-y-6">
        <div className="sticky top-8">
          <PlatformPreview 
            content={content} 
            mediaUrls={mediaUrls.map(m => m.url)} 
            selectedPlatforms={selectedPlatforms} 
          />
        </div>
      </div>

      <AICaptionModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onSelect={(caption) => setContent(caption)}
        currentPlatforms={selectedPlatforms}
        mediaUrls={mediaUrls.map(m => m.url)}
      />
    </div>
  );
}
