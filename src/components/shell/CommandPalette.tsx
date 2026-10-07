"use client";

import { ArrowUp, CornerDownLeft, PanelLeft, Search, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { THEMES } from "@/lib/themes";
import { NAV } from "./nav";
import { THEME_ICONS } from "./ThemeSwitcher";
import { useTheme } from "./useTheme";
import styles from "./shell.module.css";

type Command = {
  id: string;
  group: "Navigate" | "Theme" | "Actions";
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
};

/** Subsequence match: "svh" finds "Service Health". Returns matched indices for highlighting, or null. */
function fuzzyMatch(query: string, text: string): number[] | null {
  if (!query) return [];
  const haystack = text.toLowerCase();
  const matches: number[] = [];
  let cursor = 0;
  for (const character of query.toLowerCase()) {
    if (character === " ") continue;
    const found = haystack.indexOf(character, cursor);
    if (found === -1) return null;
    matches.push(found);
    cursor = found + 1;
  }
  return matches;
}

function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  const marked = new Set(indices);
  return (
    <>
      {[...text].map((character, index) =>
        marked.has(index) ? (
          <mark key={index} className={styles.paletteMark}>
            {character}
          </mark>
        ) : (
          character
        ),
      )}
    </>
  );
}

type Props = { open: boolean; onClose: () => void; onToggleSidebar: () => void };

export function CommandPalette(props: Props) {
  return <AnimatePresence>{props.open && <PaletteDialog {...props} />}</AnimatePresence>;
}

function PaletteDialog({ onClose, onToggleSidebar }: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      ...NAV.map((item) => ({
        id: `nav-${item.href}`,
        group: "Navigate" as const,
        label: item.label,
        hint: item.description,
        icon: item.icon,
        run: () => router.push(item.href),
      })),
      ...THEMES.map((theme) => ({
        id: `theme-${theme.id}`,
        group: "Theme" as const,
        label: `${theme.label} theme`,
        hint: theme.tagline,
        icon: THEME_ICONS[theme.id],
        run: () => setTheme(theme.id),
      })),
      { id: "toggle-sidebar", group: "Actions", label: "Toggle sidebar", hint: "Collapse or expand navigation", icon: PanelLeft, run: onToggleSidebar },
      {
        id: "scroll-top",
        group: "Actions",
        label: "Scroll to top",
        hint: "Back to the page header",
        icon: ArrowUp,
        run: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      },
    ],
    [router, setTheme, onToggleSidebar],
  );

  const results = useMemo(
    () =>
      commands
        .map((command) => ({ command, indices: fuzzyMatch(query, command.label) }))
        .filter((result): result is { command: Command; indices: number[] } => result.indices !== null),
    [commands, query],
  );

  const activeIndex = Math.min(selected, Math.max(results.length - 1, 0));

  const runCommand = (command: Command) => {
    onClose();
    command.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!results.length) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + step + results.length) % results.length;
      setSelected(next);
      listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) runCommand(result.command);
    }
  };

  let lastGroup: Command["group"] | null = null;

  return (
    <motion.div
      className={styles.paletteOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onMouseDown={onClose}
    >
      <motion.div
        className={styles.palette}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        initial={{ opacity: 0, scale: 0.94, y: -16, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.97, y: -8, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className={styles.paletteSearch}>
          <Search size={18} />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            placeholder="Jump to a dashboard, switch theme…"
            aria-label="Search commands"
            aria-controls="palette-results"
            aria-activedescendant={results[activeIndex] ? `cmd-${results[activeIndex].command.id}` : undefined}
          />
          <kbd className={styles.kbd}>esc</kbd>
        </div>

        <ul className={styles.paletteList} id="palette-results" role="listbox" ref={listRef}>
          {results.length === 0 && <li className={styles.paletteEmpty}>Nothing matches “{query}”. Bold of you.</li>}
          {results.map(({ command, indices }, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;
            const Icon = command.icon;
            const isActive = index === activeIndex;
            return (
              <li key={command.id} role="presentation">
                {showGroup && <p className={styles.paletteGroup}>{command.group}</p>}
                <motion.div
                  id={`cmd-${command.id}`}
                  role="option"
                  aria-selected={isActive}
                  data-index={index}
                  className={styles.paletteItem}
                  data-active={isActive}
                  onMouseMove={() => setSelected(index)}
                  onClick={() => runCommand(command)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.2) }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="palette-active"
                      className={styles.paletteHighlight}
                      transition={{ type: "spring", stiffness: 600, damping: 42 }}
                    />
                  )}
                  <span className={styles.paletteIcon}>
                    <Icon size={16} />
                  </span>
                  <span className={styles.paletteLabel}>
                    <Highlighted text={command.label} indices={indices} />
                  </span>
                  <span className={styles.paletteHint}>{command.hint}</span>
                  {isActive && <CornerDownLeft size={14} className={styles.paletteEnter} />}
                </motion.div>
              </li>
            );
          })}
        </ul>

        <div className={styles.paletteFooter}>
          <span>
            <kbd className={styles.kbd}>↑</kbd>
            <kbd className={styles.kbd}>↓</kbd> move
          </span>
          <span>
            <kbd className={styles.kbd}>↵</kbd> run
          </span>
          <span>
            <kbd className={styles.kbd}>G</kbd> then <kbd className={styles.kbd}>O R S L T</kbd> to jump anywhere
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
