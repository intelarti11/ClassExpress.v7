"use client";

import * as React from "react";
import { ColorSwitcher } from "@/components/color-switcher";

export default function HomePage() {
  const [backgroundColor, setBackgroundColor] = React.useState<string>("bg-background"); // Default to theme's white

  return (
    <div className={`relative flex min-h-screen w-full flex-col items-center justify-center transition-colors duration-300 ${backgroundColor}`}>
      <div className="absolute top-4 right-4">
        <ColorSwitcher currentColor={backgroundColor} setColor={setBackgroundColor} />
      </div>
      {/* The rest of the page is the colored canvas */}
    </div>
  );
}
