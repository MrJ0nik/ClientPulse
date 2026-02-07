import { SimpleGrid, Paper, Group, Text, ThemeIcon, rem } from "@mantine/core";
import { TrendingUp, Activity, AlertCircle } from "lucide-react";
import styles from "./StatsGrid.module.css";

export interface StatItem {
  label: string;
  value: string;
  diff?: number;
  type: "growth" | "activity" | "alert" | "neutral";
  color?: string;
}

interface StatsGridProps {
  data?: StatItem[];
}

const getIconConfig = (type: string) => {
  switch (type) {
    case "growth":
      return { icon: TrendingUp, color: "teal" };
    case "activity":
      return { icon: Activity, color: "violet" };
    case "alert":
      return { icon: AlertCircle, color: "orange" };
    default:
      return { icon: Activity, color: "blue" };
  }
};

const defaultStats: StatItem[] = [
  { label: "Pipeline Uncovered", value: "$0.0M", diff: 0, type: "growth" },
  { label: "Active Signals", value: "0", diff: 0, type: "activity" },
  { label: "Pending Actions", value: "0", diff: 0, type: "alert" },
];

export function StatsGrid({ data = defaultStats }: StatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
      {data.map((stat) => {
        const config = getIconConfig(stat.type);
        const IconComponent = config.icon;
        const accentColor = stat.color || config.color;

        let diffColor = "gray.6";
        let diffText = "0";

        if (stat.diff !== undefined) {
          if (stat.diff > 0) {
            diffColor = "teal.4";
            diffText = `+${stat.diff}`;
          } else if (stat.diff < 0) {
            diffColor = "red.5";
            diffText = `${stat.diff}`;
          } else {
            diffColor = "dimmed";
            diffText = "0";
          }
        }

        return (
          <Paper key={stat.label} p="xl" radius="md" className={styles.card}>
            <Group justify="space-between" align="flex-start" mb="xs">
              <Group className={styles.valueGroup}>
                <Text
                  size="xl"
                  fw={700}
                  className={styles.value}
                  style={{ fontSize: rem(32) }}
                >
                  {stat.value}
                </Text>

                {stat.diff !== undefined && (
                  <Text className={styles.diff} c={diffColor}>
                    {diffText}
                  </Text>
                )}
              </Group>

              <ThemeIcon
                variant="light"
                size="lg"
                color={accentColor}
                radius="md"
                className={styles.iconWrapper}
              >
                <IconComponent size={20} />
              </ThemeIcon>
            </Group>

            <Text size="sm" fw={500} mt="auto" className={styles.label}>
              {stat.label}
            </Text>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}
