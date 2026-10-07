"use client";

import { SquareTerminal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInterval } from "@/lib/live";
import { SUITES, makeLogLine, seededRandom, type LogLine } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

const MAX_LINES = 80;
const TICK_MS = 380;
const NEAR_BOTTOM_PX = 48;

const seed = seededRandom(1984);
const INITIAL: (LogLine & { at: number })[] = Array.from({ length: 16 }, (_, index) => ({
  ...makeLogLine(index, seed),
  at: index * 0.41,
}));

export function Terminal({ index, paused }: { index: number; paused: boolean }) {
  const [lines, setLines] = useState(INITIAL);
  const random = useRef(seededRandom(2001));
  const scroller = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  useInterval(
    () => {
      setLines((current) => {
        const last = current[current.length - 1];
        const next = { ...makeLogLine(last.id + 1, random.current), at: last.at + TICK_MS / 1000 };
        return [...current.slice(-(MAX_LINES - 1)), next];
      });
    },
    paused ? null : TICK_MS,
  );

  // Follow the tail unless the reader has scrolled up to look at something.
  useEffect(() => {
    const element = scroller.current;
    if (element && stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [lines]);

  const failures = lines.filter((line) => line.level === "FAIL").length;

  return (
    <Card
      span={7}
      tall
      index={index}
      icon={SquareTerminal}
      title="Test output"
      subtitle={`Streaming · ${failures} ${failures === 1 ? "failure" : "failures"} in the visible buffer`}
    >
      <div className={styles.terminal}>
        <div className={styles.terminalBar} aria-hidden>
          <span />
          <span />
          <span />
          <p>harness — ./gradlew test --parallel</p>
        </div>
        <div
          ref={scroller}
          className={styles.terminalBody}
          role="log"
          aria-live="off"
          tabIndex={0}
          onScroll={(event) => {
            const element = event.currentTarget;
            stickToBottom.current = element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX;
          }}
        >
          {lines.map((line) => (
            <p key={line.id} className={styles.terminalLine}>
              <span className={styles.terminalTime}>+{line.at.toFixed(2).padStart(6, "0")}s</span>
              <span className={styles.terminalLevel} data-level={line.level}>
                {line.level}
              </span>
              <span className={styles.terminalSuite}>{SUITES.find((suite) => suite.id === line.suite)?.label.toLowerCase()}</span>
              <span className={styles.terminalMessage}>{line.message}</span>
              {line.level !== "INFO" && <span className={styles.terminalMillis}>({line.millis}ms)</span>}
            </p>
          ))}
          <p className={styles.terminalPrompt}>
            <span>$</span>
            <span className={styles.terminalCursor} />
          </p>
        </div>
      </div>
    </Card>
  );
}
