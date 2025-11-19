-- Create enum types for dietary preferences and goals
CREATE TYPE dietary_preference AS ENUM ('none', 'vegetarian', 'vegan', 'keto', 'paleo', 'mediterranean', 'high_protein');
CREATE TYPE health_goal AS ENUM ('lose_weight', 'maintain_weight', 'gain_muscle', 'general_health');
CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'active', 'very_active');
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Create user profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  age INTEGER,
  gender TEXT,
  height_cm DECIMAL,
  weight_kg DECIMAL,
  health_goal health_goal,
  dietary_preference dietary_preference DEFAULT 'none',
  activity_level activity_level DEFAULT 'moderate',
  allergies TEXT[],
  daily_calorie_target INTEGER,
  daily_water_target_ml INTEGER DEFAULT 2000,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create meals table for tracking what users eat
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meal_type meal_type NOT NULL,
  description TEXT NOT NULL,
  calories INTEGER,
  protein_g DECIMAL,
  carbs_g DECIMAL,
  fats_g DECIMAL,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now(),
  meal_date DATE DEFAULT CURRENT_DATE
);

-- Create water intake tracking table
CREATE TABLE public.water_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT now(),
  intake_date DATE DEFAULT CURRENT_DATE
);

-- Create chat conversations table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_intake ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for meals
CREATE POLICY "Users can view own meals"
  ON public.meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON public.meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON public.meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON public.meals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for water_intake
CREATE POLICY "Users can view own water intake"
  ON public.water_intake FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water intake"
  ON public.water_intake FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_meals_user_date ON public.meals(user_id, meal_date DESC);
CREATE INDEX idx_water_user_date ON public.water_intake(user_id, intake_date DESC);
CREATE INDEX idx_chat_messages_user ON public.chat_messages(user_id, created_at DESC);