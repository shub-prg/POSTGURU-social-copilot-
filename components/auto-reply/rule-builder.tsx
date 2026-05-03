"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Sparkles, MessageSquare, Facebook, Instagram } from "lucide-react";
import { toast } from "sonner";

const ruleSchema = z.object({
  name: z.string().min(2, "Name is required"),
  triggerType: z.enum(["ANY_COMMENT", "KEYWORD_MATCH", "POSITIVE_SENTIMENT", "NEGATIVE_SENTIMENT"]),
  keywords: z.array(z.string()),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  replyMode: z.enum(["TEMPLATE", "AI_GENERATED"]),
  replyTemplate: z.string().optional(),
  aiPrompt: z.string().optional(),
  isActive: z.boolean(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

interface RuleBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
  onSave: (data: any) => Promise<void>;
}

export function RuleBuilder({ open, onOpenChange, initialData, onSave }: RuleBuilderProps) {
  const [keywordInput, setKeywordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      triggerType: "ANY_COMMENT",
      keywords: [],
      platforms: ["FACEBOOK", "INSTAGRAM"],
      replyMode: "TEMPLATE",
      replyTemplate: "",
      aiPrompt: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        platforms: initialData.platforms || ["FACEBOOK", "INSTAGRAM"],
        replyTemplate: initialData.replyTemplate ?? "",
        aiPrompt: initialData.aiPrompt ?? "",
      });
    } else {
      form.reset({
        name: "",
        triggerType: "ANY_COMMENT",
        keywords: [],
        platforms: ["FACEBOOK", "INSTAGRAM"],
        replyMode: "TEMPLATE",
        replyTemplate: "",
        aiPrompt: "",
        isActive: true,
      });
    }
  }, [initialData, form, open]);

  const onSubmit = async (values: RuleFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave(values);
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to save rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    const currentKeywords = form.getValues("keywords");
    if (!currentKeywords.includes(keywordInput.trim())) {
      form.setValue("keywords", [...currentKeywords, keywordInput.trim()]);
    }
    setKeywordInput("");
  };

  const removeKeyword = (kw: string) => {
    const currentKeywords = form.getValues("keywords");
    form.setValue("keywords", currentKeywords.filter((k) => k !== kw));
  };

  const togglePlatform = (platform: string) => {
    const current = form.getValues("platforms");
    if (current.includes(platform)) {
      form.setValue("platforms", current.filter((p) => p !== platform));
    } else {
      form.setValue("platforms", [...current, platform]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {initialData ? "Edit Auto-Reply Rule" : "Create Auto-Reply Rule"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rule Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Warm Welcome Rule" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="triggerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ANY_COMMENT">Any Comment</SelectItem>
                        <SelectItem value="KEYWORD_MATCH">Keyword Match</SelectItem>
                        <SelectItem value="POSITIVE_SENTIMENT">Positive Sentiment</SelectItem>
                        <SelectItem value="NEGATIVE_SENTIMENT">Negative Sentiment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Platforms</FormLabel>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant={form.watch("platforms").includes("FACEBOOK") ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => togglePlatform("FACEBOOK")}
                  >
                    <Facebook className="w-4 h-4" /> Facebook
                  </Button>
                  <Button
                    type="button"
                    variant={form.watch("platforms").includes("INSTAGRAM") ? "default" : "outline"}
                    className="flex-1 gap-2"
                    onClick={() => togglePlatform("INSTAGRAM")}
                  >
                    <Instagram className="w-4 h-4" /> Instagram
                  </Button>
                </div>
                {form.formState.errors.platforms && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.platforms.message}
                  </p>
                )}
              </FormItem>
            </div>

            {form.watch("triggerType") === "KEYWORD_MATCH" && (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    placeholder="Type keyword and press Enter"
                  />
                  <Button type="button" onClick={addKeyword} variant="secondary">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch("keywords").map((kw) => (
                    <Badge key={kw} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                      {kw}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeKeyword(kw)}
                      />
                    </Badge>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}

            <div className="space-y-4 rounded-xl border border-border bg-accent/30 p-4">
              <FormField
                control={form.control}
                name="replyMode"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div>
                      <FormLabel className="text-base font-semibold">Reply Mode</FormLabel>
                      <FormDescription>Choose between template or AI-generated</FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border">
                        <Button
                          type="button"
                          variant={field.value === "TEMPLATE" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => field.onChange("TEMPLATE")}
                          className="gap-2"
                        >
                          <MessageSquare className="w-4 h-4" /> Template
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === "AI_GENERATED" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => field.onChange("AI_GENERATED")}
                          className="gap-2"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-500" /> AI
                        </Button>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("replyMode") === "TEMPLATE" ? (
                <FormField
                  control={form.control}
                  name="replyTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reply Template</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Hi {{commenter_name}}! Thanks for your comment."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Use <code className="text-primary">{"{{commenter_name}}"}</code> or <code className="text-primary">{"{{post_title}}"}</code> as variables.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="aiPrompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Instructions (Prompt)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Reply warmly, thank them for their interest, and invite them to check our bio."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Gemini will generate a unique reply based on these instructions and the comment context.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>Enable or disable this rule globally.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update Rule" : "Create Rule"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
