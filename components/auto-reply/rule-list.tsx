"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { 
  Edit2, 
  Trash2, 
  GripVertical, 
  Facebook, 
  Instagram,
  Sparkles,
  MessageSquare,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface RuleListProps {
  rules: any[];
  onEdit: (rule: any) => void;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, active: boolean) => Promise<void>;
  onReorder: (id: string, direction: "up" | "down") => Promise<void>;
}

export function RuleList({ rules, onEdit, onDelete, onToggle, onReorder }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">No rules found</h3>
          <p className="text-muted-foreground max-w-[300px] mt-1">
            Create your first auto-reply rule to start automating your social interactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Rule Name</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Platforms</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.sort((a, b) => a.priority - b.priority).map((rule, index) => (
            <TableRow key={rule.id} className="group transition-colors hover:bg-muted/30">
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => onReorder(rule.id, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => onReorder(rule.id, "down")}
                    disabled={index === rules.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  {rule.name}
                  {rule.triggerType === "KEYWORD_MATCH" && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(rule.keywords || []).map((kw: string) => (
                        <Badge key={kw} variant="secondary" className="text-[10px] px-1.5 h-4">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {rule.triggerType.replace(/_/g, " ").toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  {rule.platforms.includes("FACEBOOK") && (
                    <Facebook className="w-4 h-4 text-blue-600" />
                  )}
                  {rule.platforms.includes("INSTAGRAM") && (
                    <Instagram className="w-4 h-4 text-pink-600" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                {rule.replyMode === "AI_GENERATED" ? (
                  <Badge variant="default" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1 hover:bg-yellow-500/20">
                    <Sparkles className="w-3 h-3" /> AI
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <MessageSquare className="w-3 h-3" /> Template
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <Switch
                  checked={rule.isActive}
                  onCheckedChange={(checked) => onToggle(rule.id, checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(rule)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete(rule.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
