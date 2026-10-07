import { CircleAlert, CircleCheck, CircleX, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Status } from "@/lib/mock";
import styles from "./ui.module.css";

const STATUS_META: Record<Status, { icon: LucideIcon; label: string }> = {
  good: { icon: CircleCheck, label: "Healthy" },
  warning: { icon: TriangleAlert, label: "Degraded" },
  serious: { icon: CircleAlert, label: "At risk" },
  critical: { icon: CircleX, label: "Failing" },
};

/** Status always travels as icon + label; the color is reinforcement, never the only signal. */
export function StatusBadge({ status, label, pulse = false }: { status: Status; label?: string; pulse?: boolean }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={styles.statusBadge} data-status={status} data-pulse={pulse}>
      <Icon size={13} strokeWidth={2.4} className={styles.statusIcon} />
      {label ?? meta.label}
    </span>
  );
}
