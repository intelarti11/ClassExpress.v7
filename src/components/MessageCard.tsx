
"use client";

import type { FC } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

interface MessageCardProps {
  message: string;
  backgroundColor?: string;
  fontStyle?: string;
  backgroundImage?: string | null;
}

const fontStyleMapping: Record<string, string> = {
  Default: "var(--font-inter), sans-serif",
  Serif: "Georgia, 'Times New Roman', serif",
  Monospace: "Menlo, Monaco, 'Courier New', monospace",
};

export const MessageCard: FC<MessageCardProps> = ({
  message,
  backgroundColor = "#FFFFFF", // Default to white
  fontStyle = "Default",
  backgroundImage,
}) => {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: 'My Message Card',
      text: message,
      // url: window.location.href, // Or a specific URL if the card is shareable via link
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } else {
        // Fallback for browsers that don't support navigator.share
        navigator.clipboard.writeText(message);
        toast({ title: "Message copied to clipboard!", description: "Share functionality not available on this browser." });
      }
    } catch (err) {
      toast({ title: "Error sharing", description: "Could not share the message.", variant: "destructive" });
      console.error("Share failed:", err);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: backgroundImage ? 'transparent' : backgroundColor,
    fontFamily: fontStyleMapping[fontStyle] || fontStyleMapping["Default"],
    minHeight: '250px',
    width: '100%',
    maxWidth: '500px',
    position: 'relative',
    overflow: 'hidden', // Ensure background image respects card boundaries
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 10px 20px rgba(0,0,0,0.1), 0 6px 6px rgba(0,0,0,0.1)', // Professional shadow
    borderRadius: 'var(--radius)',
  };

  return (
    <Card style={cardStyle} className="transition-all duration-300 ease-in-out">
      {backgroundImage && (
        <Image
          src={backgroundImage}
          alt="Card background"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0 opacity-80" 
          data-ai-hint="abstract pattern" // Generic hint if AI doesn't specify
        />
      )}
      <div className="relative z-10 flex flex-col flex-grow p-6">
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-lg font-semibold" style={{ color: 'hsl(var(--card-foreground))' }}>Your Message</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex-grow break-words whitespace-pre-wrap" style={{ color: 'hsl(var(--card-foreground))' }}>
          <p className="text-base leading-relaxed">{message || "Your message will appear here..."}</p>
        </CardContent>
        <CardFooter className="p-0 mt-auto pt-4 flex justify-end">
          <Button variant="accent" onClick={handleShare} className="shadow-md hover:shadow-lg transition-shadow">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};
