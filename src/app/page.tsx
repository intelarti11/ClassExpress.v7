
"use client";

import { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageCard } from "@/components/MessageCard";
import { CustomizationPanel } from "@/components/CustomizationPanel";
import { getAIStyleSuggestions, type AIStyleSuggestion } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { Send, Zap } from 'lucide-react'; // Zap for a generic "Create" icon or similar

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [cardBackgroundColor, setCardBackgroundColor] = useState<string>("#FFFFFF");
  const [cardFontStyle, setCardFontStyle] = useState<string>("Default");
  const [cardBackgroundImage, setCardBackgroundImage] = useState<string | null>(null);

  const { toast } = useToast();

  const handleFetchAIStyles = async (currentMsg: string): Promise<AIStyleSuggestion | { error: string }> => {
    const result = await getAIStyleSuggestions(currentMsg);
    if ('error' in result) {
      toast({
        title: "AI Styling Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "AI Styles Generated!",
        description: "Review the suggestions in the panel.",
      });
    }
    return result;
  };
  
  // Effect to handle client-side only logic if needed, e.g., loading from localStorage
  useEffect(() => {
    // Placeholder for any client-side specific initializations
    // For example, loading saved preferences from localStorage:
    // const savedMessage = localStorage.getItem('messagePoster_message');
    // if (savedMessage) setMessage(savedMessage);
    // ... and so on for styles
  }, []);


  return (
    <main className="min-h-screen bg-background flex flex-col items-center p-4 sm:p-8 transition-colors duration-300">
      <div className="w-full max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold text-primary tracking-tight">Message Poster</h1>
          <p className="mt-2 text-lg text-foreground/80">Create and customize your beautiful message cards.</p>
        </header>

        <div className="space-y-4">
          <Textarea
            placeholder="Craft your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[120px] p-4 text-base rounded-lg shadow-sm focus:ring-2 focus:ring-primary"
            rows={4}
          />
          {/* A button to explicitly "create" or "update" the card might be good if there were a save step. 
              For now, it's live-updated.
          <Button variant="default" size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <Send className="mr-2 h-5 w-5" />
            Create Card (Example, not wired)
          </Button>
          */}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex justify-center items-center md:sticky md:top-8">
             <MessageCard
              message={message}
              backgroundColor={cardBackgroundColor}
              fontStyle={cardFontStyle}
              backgroundImage={cardBackgroundImage}
            />
          </div>
          
          <CustomizationPanel
            currentMessage={message}
            initialBackgroundColor={cardBackgroundColor}
            initialFontStyle={cardFontStyle}
            onBackgroundColorChange={setCardBackgroundColor}
            onFontStyleChange={setCardFontStyle}
            onBackgroundImageApply={setCardBackgroundImage}
            onClearBackgroundImage={() => setCardBackgroundImage(null)}
            onFetchAIStyles={handleFetchAIStyles}
          />
        </div>
      </div>
       <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Message Poster App. Built with Next.js and Firebase Studio.</p>
      </footer>
    </main>
  );
}
