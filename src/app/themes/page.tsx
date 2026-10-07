"use client";

import { Keyboard, Palette } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import ui from "@/components/ui/ui.module.css";
import { ThemePreview } from "@/components/widgets/ThemePreview";
import themes from "@/components/widgets/themes.module.css";
import { THEMES } from "@/lib/themes";

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["⌘", "K"], action: "Open the command palette" },
  { keys: ["/"], action: "Open the command palette (one-handed)" },
  { keys: ["T"], action: "Cycle to the next theme" },
  { keys: ["["], action: "Collapse or expand the sidebar" },
  { keys: ["G", "O"], action: "Go to Mission Control" },
  { keys: ["G", "R"], action: "Go to Test Runs" },
  { keys: ["G", "S"], action: "Go to Service Health" },
  { keys: ["G", "L"], action: "Go to Live Ops" },
  { keys: ["G", "T"], action: "Go to the Theme Gallery" },
  { keys: ["←", "→"], action: "Step through a focused chart's values" },
];

export default function ThemeGalleryPage() {
  return (
    <>
      <PageHeader
        eyebrow="Theme gallery"
        icon={Palette}
        title="Pick your poison"
        description="Each preview renders live inside its own theme scope. Apply one and watch it ripple out from your cursor."
      />

      <div className={themes.gallery}>
        {THEMES.map((theme, index) => (
          <ThemePreview key={theme.id} id={theme.id} index={index} />
        ))}
      </div>

      <div className={ui.grid} style={{ marginTop: 20 }}>
        <Card span={12} icon={Keyboard} title="Keyboard first" subtitle="Everything is two keystrokes away">
          <ul className={themes.shortcuts}>
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.action}>
                <span className={themes.keys}>
                  {shortcut.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </span>
                {shortcut.action}
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
