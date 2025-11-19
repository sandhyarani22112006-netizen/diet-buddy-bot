import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

export default function ProfileSetup() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    health_goal: "",
    dietary_preference: "none",
    activity_level: "moderate",
    daily_calorie_target: "",
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setProfile({
        age: data.age?.toString() || "",
        gender: data.gender || "",
        height_cm: data.height_cm?.toString() || "",
        weight_kg: data.weight_kg?.toString() || "",
        health_goal: data.health_goal || "",
        dietary_preference: data.dietary_preference || "none",
        activity_level: data.activity_level || "moderate",
        daily_calorie_target: data.daily_calorie_target?.toString() || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const profileData: any = {
        user_id: user.id,
        age: profile.age ? parseInt(profile.age) : null,
        gender: profile.gender || null,
        height_cm: profile.height_cm ? parseFloat(profile.height_cm) : null,
        weight_kg: profile.weight_kg ? parseFloat(profile.weight_kg) : null,
        health_goal: profile.health_goal || null,
        dietary_preference: profile.dietary_preference,
        activity_level: profile.activity_level,
        daily_calorie_target: profile.daily_calorie_target ? parseInt(profile.daily_calorie_target) : null,
      };

      const { error } = await supabase
        .from("user_profiles")
        .upsert([profileData], { onConflict: 'user_id' });

      if (error) throw error;

      toast({ title: "Profile saved successfully!" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-custom-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Up Your Profile</CardTitle>
          <CardDescription>
            Help us personalize your nutrition journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  placeholder="25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={profile.gender} onValueChange={(v) => setProfile({ ...profile, gender: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={profile.height_cm}
                  onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                  placeholder="170"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profile.weight_kg}
                  onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
                  placeholder="70"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Health Goal</Label>
              <Select value={profile.health_goal} onValueChange={(v) => setProfile({ ...profile, health_goal: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose_weight">Lose Weight</SelectItem>
                  <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                  <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                  <SelectItem value="general_health">General Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diet">Dietary Preference</Label>
              <Select value={profile.dietary_preference} onValueChange={(v) => setProfile({ ...profile, dietary_preference: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Preference</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="paleo">Paleo</SelectItem>
                  <SelectItem value="mediterranean">Mediterranean</SelectItem>
                  <SelectItem value="high_protein">High Protein</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select value={profile.activity_level} onValueChange={(v) => setProfile({ ...profile, activity_level: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="very_active">Very Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calories">Daily Calorie Target (optional)</Label>
              <Input
                id="calories"
                type="number"
                value={profile.daily_calorie_target}
                onChange={(e) => setProfile({ ...profile, daily_calorie_target: e.target.value })}
                placeholder="2000"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                className="flex-1 gradient-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
