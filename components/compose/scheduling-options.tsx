"use client";

import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface SchedulingOptionsProps {
  isScheduling: boolean;
  setIsScheduling: (val: boolean) => void;
  scheduledAt: Date | undefined;
  setScheduledAt: (date: Date | undefined) => void;
}

export function SchedulingOptions({ 
  isScheduling, 
  setIsScheduling, 
  scheduledAt, 
  setScheduledAt 
}: SchedulingOptionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold">Schedule this post</Label>
          <p className="text-[11px] text-muted-foreground">Pick a future date and time to publish</p>
        </div>
        <Switch 
          checked={isScheduling} 
          onCheckedChange={setIsScheduling} 
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {isScheduling && (
        <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Date</Label>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal border-border bg-background",
                      !scheduledAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {scheduledAt ? format(scheduledAt, "PPP") : <span>Pick a date</span>}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledAt}
                  onSelect={setScheduledAt}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="w-[120px] space-y-2">
            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Time</Label>
            <div className="relative">
              <input 
                type="time" 
                className="flex h-10 w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                onChange={(e) => {
                  if (scheduledAt) {
                    const [hours, minutes] = e.target.value.split(":");
                    const newDate = new Date(scheduledAt);
                    newDate.setHours(parseInt(hours));
                    newDate.setMinutes(parseInt(minutes));
                    setScheduledAt(newDate);
                  }
                }}
              />
              <Clock className="absolute right-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
