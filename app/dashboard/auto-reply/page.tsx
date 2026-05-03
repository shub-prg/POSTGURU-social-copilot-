"use client";

import { useState, useEffect } from "react";
import { RuleList } from "@/components/auto-reply/rule-list";
import { RuleBuilder } from "@/components/auto-reply/rule-builder";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, Info } from "lucide-react";
import { toast } from "sonner";
import {
  getRules,
  saveRule,
  deleteRule,
  toggleRule,
  reorderRule,
} from "./actions";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function AutoReplyPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const data = await getRules();
      setRules(data);
    } catch (error) {
      toast.error("Failed to fetch rules");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (data: any) => {
    try {
      await saveRule(data, editingRule?.id);
      toast.success(editingRule ? "Rule updated" : "Rule created");
      fetchRules();
      setIsBuilderOpen(false);
      setEditingRule(null);
    } catch (error) {
      toast.error("Failed to save rule");
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await deleteRule(id);
      toast.success("Rule deleted");
      fetchRules();
    } catch (error) {
      toast.error("Failed to delete rule");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleRule(id, isActive);
      setRules(rules.map(r => r.id === id ? { ...r, isActive } : r));
    } catch (error) {
      toast.error("Failed to toggle rule");
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    try {
      await reorderRule(id, direction);
      fetchRules();
    } catch (error) {
      toast.error("Failed to reorder rules");
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setIsBuilderOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditingRule(rule);
    setIsBuilderOpen(true);
  };

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Auto-Reply Rules
          </h2>
          <p className="text-muted-foreground">
            Automate your engagement with AI-powered comment replies.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Create Rule
        </Button>
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle>How it works</AlertTitle>
        <AlertDescription>
          Our system scans for new comments on your Facebook and Instagram posts every 15 minutes. 
          Rules are processed in order of priority. Only one rule will be applied per comment.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full animate-pulse bg-muted rounded-xl" />
          ))}
        </div>
      ) : (
        <RuleList
          rules={rules}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggle={handleToggle}
          onReorder={handleReorder}
        />
      )}

      <RuleBuilder
        open={isBuilderOpen}
        onOpenChange={setIsBuilderOpen}
        initialData={editingRule}
        onSave={handleSave}
      />
    </div>
  );
}
