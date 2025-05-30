"use client";

import * as React from "react";
import { Cog } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ColorSwitcherProps {
  currentColor: string;
  setColor: (color: string) => void;
}

const colorOptions = [
  { label: "White", value: "bg-background", tailwindClass: "bg-background" }, // Uses theme's white
  { label: "Off-White", value: "bg-[hsl(0,0%,98%)]", tailwindClass: "bg-[hsl(0,0%,98%)]" }, // #FAFAFA
  { label: "Light Gray", value: "bg-[hsl(0,0%,94.1%)]", tailwindClass: "bg-[hsl(0,0%,94.1%)]" }, // #F0F0F0
];

export function ColorSwitcher({ currentColor, setColor }: ColorSwitcherProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change color settings">
          <Cog className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Background Color</h4>
            <p className="text-sm text-muted-foreground">
              Select a background color for the canvas.
            </p>
          </div>
          <RadioGroup
            defaultValue={currentColor}
            onValueChange={setColor}
            className="grid gap-2"
          >
            {colorOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.tailwindClass} id={option.value} />
                <Label htmlFor={option.value} className="flex items-center">
                  <span
                    className={`mr-2 inline-block h-4 w-4 rounded-full border ${option.value === "bg-background" ? "bg-white" : option.tailwindClass}`}
                  ></span>
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
