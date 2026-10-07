"use client";

import { CircleHelp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { ExplainerDialog } from "./ExplainerDialog";
import styles from "../shell/shell.module.css";

export function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        type="button"
        className={styles.helpButton}
        onClick={() => setOpen(true)}
        aria-label="Watch the 90-second tour"
        aria-haspopup="dialog"
        title="Take the tour"
        whileHover={{ rotate: -12, scale: 1.08 }}
        whileTap={{ scale: 0.9 }}
      >
        <CircleHelp size={17} />
      </motion.button>
      <ExplainerDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
