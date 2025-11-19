import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChatInterface from "@/components/ChatInterface";
import { LogOut, User, Droplets, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if profile exists
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    setUserProfile(profile);
    setLoading(false);

    // If no profile, navigate to profile setup
    if (!profile) {
      navigate("/profile-setup");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      <div className="container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">NutriBot</h1>
              <p className="text-sm text-muted-foreground">Your nutrition companion</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/profile-setup")}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="md:col-span-1 space-y-4">
            <Card className="shadow-custom-sm">
              <CardHeader>
                <CardTitle className="text-lg">Today's Goal</CardTitle>
                <CardDescription>Track your daily nutrition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userProfile?.daily_calorie_target && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-primary" />
                      <span className="text-sm">Calories</span>
                    </div>
                    <span className="font-bold">{userProfile.daily_calorie_target}</span>
                  </div>
                )}
                {userProfile?.daily_water_target_ml && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-4 h-4 text-accent" />
                      <span className="text-sm">Water</span>
                    </div>
                    <span className="font-bold">{userProfile.daily_water_target_ml}ml</span>
                  </div>
                )}
                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  {userProfile?.health_goal && (
                    <p>Goal: {userProfile.health_goal.replace('_', ' ')}</p>
                  )}
                  {userProfile?.dietary_preference && userProfile.dietary_preference !== 'none' && (
                    <p>Diet: {userProfile.dietary_preference}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-custom-sm gradient-primary text-primary-foreground">
              <CardContent className="pt-6">
                <p className="text-sm font-medium mb-2">💪 Keep it up!</p>
                <p className="text-xs opacity-90">
                  Small changes lead to big results. Log your meals and stay consistent!
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-2 h-[calc(100vh-12rem)]">
            <ChatInterface userProfile={userProfile} />
          </div>
        </div>
      </div>
    </div>
  );
}
