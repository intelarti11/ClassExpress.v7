
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Palette, Image as ImageIcon, Trash2 } from "lucide-react";
import type { AIStyleSuggestion } from '@/app/actions';
import Image from 'next/image';

interface CustomizationPanelProps {
  currentMessage: string;
  initialBackgroundColor: string;
  initialFontStyle: string;
  onBackgroundColorChange: (color: string) => void;
  onFontStyleChange: (font: string) => void;
  onBackgroundImageApply: (image: string) => void;
  onClearBackgroundImage: () => void;
  onFetchAIStyles: (message: string) => Promise<AIStyleSuggestion | { error: string }>;
}

export const CustomizationPanel: FC<CustomizationPanelProps> = ({
  currentMessage,
  initialBackgroundColor,
  initialFontStyle,
  onBackgroundColorChange,
  onFontStyleChange,
  onBackgroundImageApply,
  onClearBackgroundImage,
  onFetchAIStyles,
}) => {
  const [bgColor, setBgColor] = useState(initialBackgroundColor);
  const [fontStyle, setFontStyle] = useState(initialFontStyle);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIStyleSuggestion | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    setBgColor(initialBackgroundColor);
  }, [initialBackgroundColor]);

  useEffect(() => {
    setFontStyle(initialFontStyle);
  }, [initialFontStyle]);

  const handleBackgroundColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBgColor(e.target.value);
    onBackgroundColorChange(e.target.value);
  };

  const handleFontStyleChange = (value: string) => {
    setFontStyle(value);
    onFontStyleChange(value);
  };

  const fetchAIStyles = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    setAiSuggestions(null);
    const result = await onFetchAIStyles(currentMessage);
    if ('error' in result) {
      setAiError(result.error);
    } else {
      setAiSuggestions(result);
    }
    setIsLoadingAI(false);
  };

  const fontOptions = [
    { value: "Default", label: "Default Sans-Serif" },
    { value: "Serif", label: "Serif (Georgia)" },
    { value: "Monospace", label: "Monospace (Courier)" },
  ];

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Customize Your Card</CardTitle>
        <CardDescription>Adjust the appearance of your message card.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bgColor" className="font-medium">Background Color</Label>
          <div className="flex items-center gap-2">
            <Input
              id="bgColor"
              type="color"
              value={bgColor}
              onChange={handleBackgroundColorInputChange}
              className="w-16 h-10 p-1"
            />
            <Input
                type="text"
                value={bgColor}
                onChange={handleBackgroundColorInputChange}
                placeholder="#FFFFFF"
                className="flex-grow"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fontStyle" className="font-medium">Font Style</Label>
          <Select value={fontStyle} onValueChange={handleFontStyleChange}>
            <SelectTrigger id="fontStyle">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold flex items-center"><Sparkles className="mr-2 h-5 w-5 text-accent" /> AI Styling</h3>
          <Button onClick={fetchAIStyles} disabled={isLoadingAI || !currentMessage.trim()} className="w-full" variant="outline">
            {isLoadingAI ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            {isLoadingAI ? "Generating Styles..." : "Get AI Style Suggestions"}
          </Button>
          {!currentMessage.trim() && <p className="text-sm text-muted-foreground text-center">Enter a message to enable AI styling.</p>}
          
          {aiError && <p className="text-sm text-destructive">{aiError}</p>}

          {aiSuggestions && (
            <div className="space-y-4 p-4 border rounded-md bg-secondary/30">
              <div>
                <Label className="font-medium flex items-center mb-2"><ImageIcon className="mr-2 h-4 w-4" /> Suggested Background</Label>
                <div className="relative w-full h-32 rounded-md overflow-hidden border">
                  <Image src={aiSuggestions.backgroundImage} alt="AI Suggested Background" layout="fill" objectFit="cover" data-ai-hint="abstract background" />
                </div>
                <div className="flex gap-2 mt-2">
                    <Button onClick={() => onBackgroundImageApply(aiSuggestions.backgroundImage)} size="sm" className="flex-1">Apply Image</Button>
                    <Button onClick={onClearBackgroundImage} size="sm" variant="outline" className="flex-1"><Trash2 className="mr-1 h-4 w-4" />Clear Image</Button>
                </div>
              </div>
              <div>
                <Label className="font-medium flex items-center mb-2"><Palette className="mr-2 h-4 w-4" /> Suggested Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.colorPalette.map((color, index) => (
                    <Button
                      key={index}
                      style={{ backgroundColor: color, width: '3rem', height: '3rem', border: '2px solid white' }}
                      onClick={() => {
                        setBgColor(color);
                        onBackgroundColorChange(color);
                      }}
                      aria-label={`Apply color ${color}`}
                      className="rounded-md shadow-md hover:opacity-80 transition-opacity"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
