"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { 
  User, 
  Bell, 
  Sparkles, 
  Palette, 
  LogOut, 
  Save, 
  ChevronRight,
  Mail,
  ShieldCheck,
  Globe,
  Clock,
  Moon,
  Sun,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserSettings {
  emailNotificationsEnabled: boolean;
  notifyOnPostSuccess: boolean;
  notifyOnPostFailure: boolean;
  notifyOnNewComment: boolean;
  aiReplyTone: string;
  timezone: string;
  weeklyReportEnabled: boolean;
}

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [settings, setSettings] = useState<UserSettings>({
    emailNotificationsEnabled: true,
    notifyOnPostSuccess: true,
    notifyOnPostFailure: true,
    notifyOnNewComment: false,
    aiReplyTone: "Friendly",
    timezone: "UTC",
    weeklyReportEnabled: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          // Ensure no nulls from API for string fields
          setSettings({
            ...data,
            aiReplyTone: data.aiReplyTone || "Friendly",
            timezone: data.timezone || "UTC",
          });
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="shadow-lg shadow-primary/20"
        >
          {loading ? "Saving..." : "Save Changes"}
          <Save className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="profile" className="flex flex-col w-full space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-muted/50 p-1 rounded-xl !w-full">
          <TabsTrigger value="profile" className="rounded-lg transition-all"><User className="w-4 h-4 mr-2" /> Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg transition-all"><Bell className="w-4 h-4 mr-2" /> Notifications</TabsTrigger>
          <TabsTrigger value="ai" className="rounded-lg transition-all"><Sparkles className="w-4 h-4 mr-2" /> AI Engine</TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg transition-all"><Palette className="w-4 h-4 mr-2" /> Appearance</TabsTrigger>
          <TabsTrigger value="account" className="rounded-lg transition-all text-destructive"><ShieldCheck className="w-4 h-4 mr-2" /> Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal details synced from your account provider.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <img 
                    src={user?.imageUrl || ""} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-2xl object-cover ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-xl"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{user?.fullName || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || ""}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">Free Plan</span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider">Verified</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Display Name</Label>
                  <Input id="fullName" value={user?.fullName || ""} disabled className="bg-muted/50 border-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" value={user?.primaryEmailAddress?.emailAddress || ""} disabled className="bg-muted/50 border-none" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Email Notifications</CardTitle>
              <CardDescription>
                Powered by Plunk. Choose what you want to be notified about.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive important updates via email.
                  </p>
                </div>
                <Switch 
                  checked={settings.emailNotificationsEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotificationsEnabled: checked})}
                />
              </div>

              <div className="space-y-4 pl-4 border-l-2 border-primary/20 ml-2">
                <div className="flex items-center justify-between opacity-90">
                  <div className="space-y-0.5">
                    <Label>Post Success</Label>
                    <p className="text-xs text-muted-foreground">When a post is successfully published.</p>
                  </div>
                  <Switch 
                    disabled={!settings.emailNotificationsEnabled}
                    checked={settings.notifyOnPostSuccess}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnPostSuccess: checked})}
                  />
                </div>
                <div className="flex items-center justify-between opacity-90">
                  <div className="space-y-0.5">
                    <Label>Post Failure</Label>
                    <p className="text-xs text-muted-foreground">When a post fails to publish.</p>
                  </div>
                  <Switch 
                    disabled={!settings.emailNotificationsEnabled}
                    checked={settings.notifyOnPostFailure}
                    onCheckedChange={(checked) => setSettings({...settings, notifyOnPostFailure: checked})}
                  />
                </div>
                <div className="flex items-center justify-between opacity-90">
                  <div className="space-y-0.5">
                    <Label>Weekly Growth Report</Label>
                    <p className="text-xs text-muted-foreground">A summary of your account performance.</p>
                  </div>
                  <Switch 
                    disabled={!settings.emailNotificationsEnabled}
                    checked={settings.weeklyReportEnabled}
                    onCheckedChange={(checked) => setSettings({...settings, weeklyReportEnabled: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> AI Engine Configuration</CardTitle>
              <CardDescription>
                Customize how the AI interacts with your audience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Reply Tone</Label>
                <p className="text-xs text-muted-foreground mb-3">The tone used for AI-generated comments and replies.</p>
                <Select 
                  value={settings.aiReplyTone} 
                  onValueChange={(val) => setSettings({...settings, aiReplyTone: val})}
                >
                  <SelectTrigger className="w-full md:w-[300px] bg-muted/50 border-none h-11">
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Friendly">Friendly & Approachable</SelectItem>
                    <SelectItem value="Professional">Professional & Corporate</SelectItem>
                    <SelectItem value="Witty">Witty & Sarcastic</SelectItem>
                    <SelectItem value="Informative">Informative & Helpful</SelectItem>
                    <SelectItem value="Direct">Direct & Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex gap-3">
                <Monitor className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">AI Preview</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {settings.aiReplyTone === 'Friendly' && '"Hey! Thanks so much for reaching out, we love the feedback! 😊"'}
                    {settings.aiReplyTone === 'Professional' && '"We appreciate your engagement. Our team is currently reviewing your inquiry."'}
                    {settings.aiReplyTone === 'Witty' && '"Oh, another comment? My processor is basically on fire with excitement. 🔥"'}
                    {settings.aiReplyTone === 'Informative' && '"Great question! You can find more details in our documentation linked above."'}
                    {settings.aiReplyTone === 'Direct' && '"Thanks for the comment. Noted."'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-blue-500" /> Interface Theme</CardTitle>
              <CardDescription>
                Customize how the application looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div 
                  onClick={() => setTheme("light")}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/20'}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Light</span>
                  </div>
                </div>
                <div 
                  onClick={() => setTheme("dark")}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/20'}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">Dark</span>
                  </div>
                </div>
                <div 
                  onClick={() => setTheme("system")}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/20'}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Monitor className={`w-8 h-8 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">System</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <Select 
                    value={settings.timezone} 
                    onValueChange={(val) => setSettings({...settings, timezone: val})}
                  >
                    <SelectTrigger className="w-full md:w-[300px] bg-muted/50 border-none h-11">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                      <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                      <SelectItem value="IST">India Standard Time (IST)</SelectItem>
                      <SelectItem value="CET">Central European Time (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm border-t-4 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Actions that affect your entire account and access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Sign Out</Label>
                  <p className="text-sm text-muted-foreground">
                    End your current session safely.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="shadow-lg shadow-destructive/20"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 opacity-50 cursor-not-allowed">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently remove your account and all data.
                  </p>
                </div>
                <Button variant="outline" disabled>Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
