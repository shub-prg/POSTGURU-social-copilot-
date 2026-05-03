"use client";

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  Twitter, 
  Linkedin, 
  Instagram, 
  Facebook, 
  Youtube, 
  PiIcon, 
  MessageSquare,
  Globe
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const PLATFORMS = [
  { id: "TWITTER", name: "X (Twitter)", icon: Twitter, color: "hover:bg-sky-500/10 hover:text-sky-500 data-[state=on]:bg-sky-500 data-[state=on]:text-white" },
  { id: "LINKEDIN", name: "LinkedIn", icon: Linkedin, color: "hover:bg-blue-600/10 hover:text-blue-600 data-[state=on]:bg-blue-600 data-[state=on]:text-white" },
  { id: "INSTAGRAM", name: "Instagram", icon: Instagram, color: "hover:bg-pink-600/10 hover:text-pink-600 data-[state=on]:bg-pink-600 data-[state=on]:text-white" },
  { id: "FACEBOOK", name: "Facebook", icon: Facebook, color: "hover:bg-blue-700/10 hover:text-blue-700 data-[state=on]:bg-blue-700 data-[state=on]:text-white" },
  { id: "YOUTUBE", name: "YouTube", icon: Youtube, color: "hover:bg-red-600/10 hover:text-red-600 data-[state=on]:bg-red-600 data-[state=on]:text-white" },
  { id: "REDDIT", name: "Reddit", icon: Globe, color: "hover:bg-orange-600/10 hover:text-orange-600 data-[state=on]:bg-orange-600 data-[state=on]:text-white" },
];

interface PlatformSelectorProps {
  connectedAccounts: any[];
  selectedPlatforms: string[];
  setSelectedPlatforms: (platforms: string[]) => void;
}

export function PlatformSelector({ 
  connectedAccounts, 
  selectedPlatforms, 
  setSelectedPlatforms 
}: PlatformSelectorProps) {
  const isConnected = (platformId: string) => {
    return connectedAccounts.some(acc => acc.platform === platformId);
  };

  const toggleAll = () => {
    if (selectedPlatforms.length === connectedAccounts.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(connectedAccounts.map(acc => acc.platform));
    }
  };

  return (
    <div className="space-y-4">
      {connectedAccounts.length > 1 && (
        <div className="flex justify-end">
          <button 
            onClick={toggleAll}
            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            {selectedPlatforms.length === connectedAccounts.length ? "Deselect All" : "Select All Connected"}
          </button>
        </div>
      )}
      <TooltipProvider>
        <ToggleGroup 
          multiple
          value={selectedPlatforms} 
          onValueChange={setSelectedPlatforms}
          className="flex flex-wrap gap-3 justify-start"
        >
          {PLATFORMS.map((platform) => {
            const connected = isConnected(platform.id);
            return (
              <Tooltip key={platform.id}>
                <TooltipTrigger render={<div className="relative" />}>
                  <ToggleGroupItem 
                    value={platform.id} 
                    disabled={!connected}
                    className={`h-12 w-12 rounded-xl border border-border bg-background transition-all duration-300 ${platform.color} disabled:opacity-40`}
                  >
                    <platform.icon className="w-5 h-5" />
                  </ToggleGroupItem>
                  {!connected && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-background pointer-events-none" />
                  )}
                </TooltipTrigger>
                {!connected && (
                  <TooltipContent>
                    <p>Connect your {platform.name} account first</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
}
