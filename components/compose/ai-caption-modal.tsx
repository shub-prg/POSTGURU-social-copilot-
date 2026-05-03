"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Copy, Check, ScrollText, Wand2, Zap, BrainCircuit } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AICaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (caption: string) => void;
  currentPlatforms: string[];
  mediaUrls?: string[];
}

export function AICaptionModal({ isOpen, onClose, onSelect, currentPlatforms, mediaUrls = [] }: AICaptionModalProps) {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setOptions([]);

    try {
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          keywords,
          platforms: currentPlatforms.length > 0 ? currentPlatforms : ["GENERAL"],
          mediaUrls,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate captions");
      
      setOptions(data.options || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "AI Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border border-border/50 shadow-2xl rounded-3xl overflow-hidden p-0 gap-0">
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                  <BrainCircuit className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">Gemini Content AI</DialogTitle>
                  <DialogDescription className="text-muted-foreground mt-1 text-sm font-medium">
                    {mediaUrls.length > 0 ? "Analyze your media & generate high-converting posts." : "Generate high-converting posts in seconds."}
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3">
                <Zap className="w-3 h-3 fill-primary" />
                Gemini Flash
              </Badge>
            </div>
          </DialogHeader>

          <div className="grid gap-5">
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/40 space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="topic" className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-1">
                  Topic or Message
                </Label>
                <Input 
                  id="topic" 
                  placeholder="e.g. Announcing our new product launch..." 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-12 bg-background border-border/60 focus:ring-primary/20 rounded-xl px-4 text-[15px] shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="keywords" className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground px-1">
                  Keywords & Tone
                </Label>
                <Input 
                  id="keywords" 
                  placeholder="e.g. professional, exciting, tech, innovation" 
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="h-12 bg-background border-border/60 focus:ring-primary/20 rounded-xl px-4 text-[15px] shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
              </div>
            </div>
            
            <Button 
              className="h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.98] border-none"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Generating variants...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Generate Smart Captions
                </>
              )}
            </Button>
          </div>

          {options.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center justify-between px-1">
                <Label className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">
                  Select a Variant
                </Label>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary px-2 py-0.5 bg-primary/5 rounded-full border border-primary/10">
                  <ScrollText className="w-3 h-3" />
                  Generated Results
                </div>
              </div>
              
              {/* The "Box" with scrolling feature */}
              <ScrollArea className="h-[320px] w-full rounded-2xl border border-border/80 bg-muted/20 p-4 shadow-inner">
                <div className="space-y-4 pr-3">
                  {options.map((option, idx) => (
                    <div 
                      key={idx}
                      className="group relative p-5 rounded-2xl border border-border/50 bg-background hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer ring-offset-background focus-within:ring-2 focus-within:ring-primary/20"
                      onClick={() => {
                        onSelect(option);
                        onClose();
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Variant {idx + 1}</span>
                        <Check className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[14px] text-foreground/90 whitespace-pre-wrap leading-relaxed font-medium">
                        {option}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        <div className="bg-muted/30 px-8 py-4 border-t border-border/40 text-center">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-[0.1em]">
            Tip: Select an option to automatically populate your post editor
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
