import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: Message[];
  userProfile?: {
    dietary_preference?: string;
    health_goal?: string;
    daily_calorie_target?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userProfile }: ChatRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    // Build system prompt based on user profile
    let systemPrompt = `You are a friendly, supportive Diet Maintenance Chatbot. Your role is to help users maintain healthy eating habits, track nutrition, and reach their health goals.

Key responsibilities:
- Provide personalized nutrition guidance
- Help log meals with calorie and macro estimates
- Offer meal suggestions and healthier alternatives
- Give motivational, non-judgmental support
- Educate with simple, evidence-based nutrition insights

Tone: Friendly, encouraging, positive, supportive
Always confirm meal entries and provide constructive feedback.`;

    if (userProfile) {
      systemPrompt += `\n\nUser Profile:`;
      if (userProfile.health_goal) {
        systemPrompt += `\n- Goal: ${userProfile.health_goal.replace('_', ' ')}`;
      }
      if (userProfile.dietary_preference && userProfile.dietary_preference !== 'none') {
        systemPrompt += `\n- Diet: ${userProfile.dietary_preference}`;
      }
      if (userProfile.daily_calorie_target) {
        systemPrompt += `\n- Daily calorie target: ${userProfile.daily_calorie_target} calories`;
      }
    }

    systemPrompt += `\n\nWhen users log meals:
1. Confirm what they ate
2. Provide estimated calories and macros (if not provided)
3. Offer a brief nutritional tip or suggestion
4. Keep responses concise and encouraging

When asked for meal suggestions:
- Consider their dietary preferences
- Provide 2-3 specific options with brief descriptions
- Include approximate calorie counts

Keep responses conversational and concise (2-4 sentences typically).`;

    console.log('Calling Lovable AI with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service quota exceeded. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });

  } catch (error) {
    console.error('Chat function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred processing your request' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
