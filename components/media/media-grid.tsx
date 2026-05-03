"use client";

import React, { useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { 
  MoreVertical, 
  Trash2, 
  ExternalLink, 
  Download,
  Image as ImageIcon,
  FileVideo,
  Search,
  Filter,
  Grid2X2,
  List,
  Calendar
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

interface MediaAsset {
  id: string;
  url: string;
  fileType: string | null;
  fileId: string | null;
  createdAt: string;
}

interface MediaGridProps {
  initialAssets: MediaAsset[];
}

export function MediaGrid({ initialAssets }: MediaGridProps) {
  const [assets, setAssets] = useState<MediaAsset[]>(initialAssets);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredAssets = assets.filter(asset => 
    asset.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.fileType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (assetId: string) => {
    try {
      const response = await fetch(`/api/media/${assetId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete asset");

      setAssets(prev => prev.filter(a => a.id !== assetId));
      toast.success("Asset deleted from library");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete asset");
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search media..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid2X2 className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
            <ImageIcon className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold">No media found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2">
            You haven't uploaded any media yet or no results match your search.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-6">
          {filteredAssets.map((asset) => (
            <div 
              key={asset.id} 
              className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="aspect-square relative bg-muted/30">
                {asset.url.match(/\.(mp4|webm|ogg)$/) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileVideo className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                ) : (
                  <Image 
                    src={asset.url} 
                    alt="Media asset" 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-9 w-9 rounded-full"
                    onClick={() => window.open(asset.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-9 w-9 rounded-full"
                    onClick={() => handleDownload(asset.url, `media-${asset.id}`)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white border-none">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => window.open(asset.url, "_blank")} className="gap-2">
                        <ExternalLink className="w-4 h-4" /> View Original
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(asset.url, `media-${asset.id}`)} className="gap-2">
                        <Download className="w-4 h-4" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(asset.id)} 
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1 bg-primary/10 rounded">
                    {asset.url.match(/\.(mp4|webm|ogg)$/) ? (
                      <FileVideo className="w-3 h-3 text-primary" />
                    ) : (
                      <ImageIcon className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {asset.fileType?.split("/")[1]?.toUpperCase() || "IMAGE"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(asset.createdAt), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6">
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Media</th>
                  <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Added On</th>
                  <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 relative rounded-lg border border-border overflow-hidden bg-muted">
                           {asset.url.match(/\.(mp4|webm|ogg)$/) ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileVideo className="w-5 h-5 text-muted-foreground/60" />
                            </div>
                          ) : (
                            <Image 
                              src={asset.url} 
                              alt="Media" 
                              fill 
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {asset.fileId || "Untitled Asset"}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {asset.url}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase">
                        {asset.fileType?.split("/")[1] || "IMAGE"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {format(new Date(asset.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => window.open(asset.url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleDownload(asset.url, `media-${asset.id}`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(asset.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
