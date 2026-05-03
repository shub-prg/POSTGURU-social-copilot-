"use client";

import React, { useRef, useState } from "react";
import { ImageKitProvider, IKUpload } from "imagekitio-next";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, FileVideo, Film, Loader2, Wand2, Sparkles, Crop, Scissors, Globe, Maximize, Square, Check } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
const authenticator = async () => {
  try {
    const response = await fetch("/api/imagekit/auth");
    if (!response.ok) throw new Error("Authentication failed");
    return await response.json();
  } catch (error) {
    throw new Error(`Authentication request failed: ${error}`);
  }
};

interface MediaUploadProps {
  mediaUrls: { url: string; fileId: string }[];
  setMediaUrls: React.Dispatch<React.SetStateAction<{ url: string; fileId: string }[]>>;
}

export function MediaUpload({ mediaUrls, setMediaUrls }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUrlImportOpen, setIsUrlImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isTextOverlayOpen, setIsTextOverlayOpen] = useState(false);
  const [overlayText, setOverlayText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [previewTransformation, setPreviewTransformation] = useState<string>("");
  
  const ikUploadRef = useRef<HTMLInputElement>(null);

  const onError = (err: any) => {
    console.error("Upload error:", err);
    toast.error("Failed to upload image");
    setIsUploading(false);
  };

  const onSuccess = async (res: any) => {
    const newMedia = { url: res.url, fileId: res.fileId };
    setMediaUrls((prev) => [...prev, newMedia]);
    
    // Save to media library (media_assets table)
    try {
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: res.url,
          fileId: res.fileId,
          fileType: res.fileType || "image/jpeg"
        }),
      });
    } catch (e) {
      console.error("Failed to save to media library:", e);
    }

    setIsUploading(false);
    toast.success("Media uploaded and saved to library");
  };

  const onUploadStart = () => {
    setIsUploading(true);
  };

  const removeMedia = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTransformation = (index: number, transformation: string) => {
    setMediaUrls((prev) => {
      const newUrls = [...prev];
      const url = new URL(newUrls[index].url);
      
      if (!transformation) {
        url.searchParams.delete("tr");
      } else {
        url.searchParams.set("tr", transformation);
      }
      
      newUrls[index] = { ...newUrls[index], url: url.toString() };
      return newUrls;
    });
    toast.success(transformation ? "Transformation applied" : "Transformations reset");
  };

  const handleApplyTextOverlay = () => {
    if (selectedIndex === null || !overlayText) return;
    
    // ImageKit text overlay transformation
    // Format: l-text,i-TEXT_HERE,fs-50,co-FFFFFF,tg-b,pa-20,l-end
    // Simpler version: ot-TEXT,otc-FFFFFF,ots-40
    const textTransform = `ot-${encodeURIComponent(overlayText)},otc-FFFFFF,ots-50,otf-Ubuntu`;
    
    applyTransformation(selectedIndex, textTransform);
    setIsTextOverlayOpen(false);
    setOverlayText("");
    setSelectedIndex(null);
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      // Use Pollinations.ai for quick generation
      const generatedUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      
      // In a real app, we should fetch this and upload to ImageKit
      // For now, we can use it directly or try to proxy it through ImageKit
      // ImageKit can fetch from remote URL if configured, but let's just add it
      
      // Upload to ImageKit via our backend to make it "permanent"
      const response = await fetch("/api/imagekit/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: generatedUrl, fileName: `ai-${Date.now()}.jpg` }),
      });
      
      if (!response.ok) throw new Error("Failed to save AI image to ImageKit");
      
      const data = await response.json();
      setMediaUrls((prev) => [...prev, { url: data.url, fileId: data.fileId }]);
      
      // Save to media library
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          fileId: data.fileId,
          fileType: "image/jpeg"
        }),
      });

      setIsDialogOpen(false);
      setAiPrompt("");
      toast.success("AI Image generated and saved to library!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl) return;
    setIsUploading(true);
    try {
      const response = await fetch("/api/imagekit/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl, fileName: `import-${Date.now()}.jpg` }),
      });
      
      if (!response.ok) throw new Error("Failed to import URL");
      
      const data = await response.json();
      setMediaUrls((prev) => [...prev, { url: data.url, fileId: data.fileId }]);

      // Save to media library
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          fileId: data.fileId,
          fileType: "image/jpeg"
        }),
      });

      setIsUrlImportOpen(false);
      setImportUrl("");
      toast.success("Image imported and saved to library");
    } catch (error) {
      console.error(error);
      toast.error("Failed to import image from URL");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ImageKitProvider publicKey={publicKey} urlEndpoint={urlEndpoint} authenticator={authenticator}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mediaUrls.map((item, index) => (
            <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-border bg-slate-100 dark:bg-slate-900">
              {item.url.includes(".mp4") ? (
                <div className="w-full h-full flex items-center justify-center">
                  <FileVideo className="w-8 h-8 text-muted-foreground" />
                </div>
              ) : (
                <Image 
                  src={item.url} 
                  alt="Uploaded media" 
                  fill 
                  className="object-cover"
                />
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!item.url.includes(".mp4") && (
                  <button 
                    onClick={() => {
                      setSelectedIndex(index);
                      try {
                        const url = new URL(mediaUrls[index].url);
                        setPreviewTransformation(url.searchParams.get("tr") || "");
                      } catch {
                        setPreviewTransformation("");
                      }
                      setIsEditModalOpen(true);
                    }}
                    className="p-1.5 bg-black/50 text-white rounded-full hover:bg-primary transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => removeMedia(index)}
                  className="p-1.5 bg-black/50 text-white rounded-full hover:bg-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {mediaUrls.length < 4 && (
            <>
              <div 
                onClick={() => ikUploadRef.current?.click()}
                className={`aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center cursor-pointer group ${isUploading ? 'pointer-events-none' : ''}`}
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-2 transition-colors" />
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors">Add Media</span>
                  </>
                )}
                <IKUpload
                  ref={ikUploadRef}
                  onError={onError}
                  onSuccess={onSuccess}
                  onUploadStart={onUploadStart}
                  style={{ display: "none" }}
                />
              </div>

              {/* AI Image Generation Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger render={
                  <button type="button" className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <Sparkles className="w-6 h-6 text-muted-foreground group-hover:text-purple-500 mb-2 transition-colors" />
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-purple-500 transition-colors">AI Generate</span>
                  </button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate AI Image</DialogTitle>
                    <DialogDescription>
                      Describe the image you want to create. It will be saved to your ImageKit library.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Prompt</Label>
                      <Input
                        id="prompt"
                        placeholder="A futuristic city with neon lights..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating || !aiPrompt}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : "Generate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* URL Import Button */}
              <Dialog open={isUrlImportOpen} onOpenChange={setIsUrlImportOpen}>
                <DialogTrigger render={
                  <button type="button" className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all flex flex-col items-center justify-center cursor-pointer group">
                    <Globe className="w-6 h-6 text-muted-foreground group-hover:text-blue-500 mb-2 transition-colors" />
                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-blue-500 transition-colors">Import URL</span>
                  </button>
                } />
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import from URL</DialogTitle>
                    <DialogDescription>
                      Paste a direct image URL to import it to your media library via ImageKit.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">Image URL</Label>
                      <Input
                        id="url"
                        placeholder="https://example.com/image.jpg"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUrlImportOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleImportUrl} 
                      disabled={isUploading || !importUrl}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : "Import"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-5xl w-full p-0 overflow-hidden gap-0 border-none bg-background shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">AI Image Editor</h2>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-[60vh] min-h-[500px] max-h-[800px] w-full">
              {/* Sidebar */}
              <div className="w-72 border-r flex flex-col p-4 space-y-6 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest pl-1">
                  Tools
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                  {[
                    { id: "", label: "Original", desc: "No changes applied", Icon: Square },
                    { id: "e-bgremove", label: "Remove BG", desc: "AI background removal", Icon: Scissors },
                    { id: "e-retouch", label: "Retouch", desc: "Smooth & enhance", Icon: Wand2 },
                    { id: "e-upscale", label: "Upscale", desc: "Increase resolution", Icon: Maximize },
                    { id: "fo-auto", label: "Smart Crop", desc: "Auto-focus subject", Icon: Crop },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setPreviewTransformation(tool.id)}
                      className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all ${
                        previewTransformation === tool.id
                          ? "bg-white dark:bg-slate-800 shadow-sm border border-border ring-1 ring-primary/10"
                          : "hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="relative">
                        <tool.Icon className={`w-5 h-5 ${previewTransformation === tool.id ? "text-primary" : "text-muted-foreground"}`} />
                        {previewTransformation === tool.id && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white dark:border-slate-800" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[13px] font-semibold ${previewTransformation === tool.id ? "text-foreground" : "text-muted-foreground"}`}>
                          {tool.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {tool.desc}
                        </div>
                      </div>
                      {previewTransformation === tool.id && (
                        <div className="flex-shrink-0 bg-primary/10 text-primary rounded-full p-1">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Area */}
              <div className="flex-1 p-6 flex flex-col bg-slate-100/50 dark:bg-slate-950/50 relative min-w-0">
                <div className="flex-1 rounded-2xl overflow-hidden border bg-white dark:bg-slate-900 shadow-sm relative flex items-center justify-center">
                  {/* Checkerboard background for transparent images */}
                  <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-5" style={{
                    backgroundImage: 'repeating-conic-gradient(#000 0% 25%, transparent 0% 50%)',
                    backgroundSize: '16px 16px'
                  }} />
                  {selectedIndex !== null && (
                    <Image
                      src={(() => {
                        if (selectedIndex === null || !mediaUrls[selectedIndex]) return "";
                        try {
                          const url = new URL(mediaUrls[selectedIndex].url);
                          if (!previewTransformation) {
                            url.searchParams.delete("tr");
                          } else {
                            url.searchParams.set("tr", previewTransformation);
                          }
                          return url.toString();
                        } catch {
                          return mediaUrls[selectedIndex]?.url || "";
                        }
                      })()}
                      alt="Preview"
                      fill
                      className="object-contain z-10 p-4 transition-all duration-300"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-background flex items-center justify-end gap-3 rounded-b-lg">
              <Button variant="outline" className="min-w-[100px]" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedIndex !== null) {
                    applyTransformation(selectedIndex, previewTransformation);
                  }
                  setIsEditModalOpen(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px] shadow-lg shadow-indigo-600/20"
              >
                <Check className="w-4 h-4 mr-2" />
                Apply & Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Text Overlay Dialog */}
        <Dialog open={isTextOverlayOpen} onOpenChange={setIsTextOverlayOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Text Overlay</DialogTitle>
              <DialogDescription>
                Add a custom text overlay to your image using ImageKit.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="overlay-text">Overlay Text</Label>
                <Input
                  id="overlay-text"
                  placeholder="Enter text..."
                  value={overlayText}
                  onChange={(e) => setOverlayText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyTextOverlay()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTextOverlayOpen(false)}>Cancel</Button>
              <Button onClick={handleApplyTextOverlay} disabled={!overlayText}>
                Apply Overlay
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <p className="text-[10px] text-muted-foreground">
          Supported: JPG, PNG, GIF, WebP (up to 10MB). Max 4 items.
        </p>
      </div>
    </ImageKitProvider>
  );
}
