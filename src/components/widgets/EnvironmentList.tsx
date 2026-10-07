"use client";

import { Boxes } from "lucide-react";
import { motion } from "motion/react";
import { ENVIRONMENTS } from "@/lib/mock";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import styles from "./widgets.module.css";

function ago(minutes: number) {
  return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
}

export function EnvironmentList({ index }: { index: number }) {
  return (
    <Card
      span={5}
      index={index}
      icon={Boxes}
      title="Environments"
      subtitle="Where the harness is pointed right now"
      table={{
        caption: "Environment status",
        columns: ["Environment", "Status", "Version", "Deployed", "Tests"],
        rows: ENVIRONMENTS.map((environment) => [
          environment.label,
          environment.status,
          environment.version,
          ago(environment.deployedMinutesAgo),
          environment.tests,
        ]),
      }}
    >
      <ul className={styles.envList}>
        {ENVIRONMENTS.map((environment, rowIndex) => (
          <motion.li
            key={environment.id}
            className={styles.envRow}
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + rowIndex * 0.08, type: "spring", stiffness: 300, damping: 26 }}
            whileHover={{ x: 4 }}
          >
            <div className={styles.envName}>
              <span className={styles.envGlyph} data-status={environment.status} />
              <div>
                <p>{environment.label}</p>
                <p className={styles.envMeta}>
                  <code>{environment.version}</code> · deployed {ago(environment.deployedMinutesAgo)}
                </p>
              </div>
            </div>
            <StatusBadge status={environment.status} pulse={environment.status === "critical"} />
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
