import { SimpleGrid, Paper, Group, Text, ThemeIcon, rem } from '@mantine/core';
import { Activity, AlertCircle, Building2 } from 'lucide-react';
import styles from './StatsGrid.module.css';

export interface StatItem {
  label: string;
  value: string;
  diff?: number;
  type: 'activity' | 'alert' | 'neutral' | 'accounts';
  color?: string;
}

interface StatsGridProps {
  data?: StatItem[];
}

const getIconConfig = (type: string) => {
  switch (type) {
    case 'activity':
      return { icon: Activity, color: 'violet' };
    case 'alert':
      return { icon: AlertCircle, color: 'orange' };
    case 'accounts':
      return { icon: Building2, color: 'indigo' };
    default:
      return { icon: Activity, color: 'blue' };
  }
};

const defaultStats: StatItem[] = [
  { label: 'Active Accounts', value: '15', diff: 2, type: 'accounts' },
  { label: 'Active Signals', value: '0', diff: 0, type: 'activity' },
  { label: 'Pending Actions', value: '0', diff: 0, type: 'alert' },
];

export function StatsGrid({ data = defaultStats }: StatsGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mb="xl">
      {data.map((stat) => {
        const config = getIconConfig(stat.type);
        const IconComponent = config.icon;
        const accentColor = stat.color || config.color;

        let diffColor = 'gray.6';
        let diffText = '';

        if (stat.diff !== undefined) {
          if (stat.diff > 0) {
            diffColor = 'teal.4';
            diffText = `+${stat.diff} new`;
          } else if (stat.diff < 0) {
            diffColor = 'red.5';
            diffText = `${stat.diff}`;
          } else {
            diffColor = 'dimmed';
            diffText = '';
          }
        }

        return (
          <Paper key={stat.label} p="xl" radius="md" className={styles.card}>
            <Group justify="space-between" align="flex-start" mb="xs">
              <Text
                className={styles.value}
                fw={700}
                style={{ fontSize: rem(32), lineHeight: 1 }}
              >
                {stat.value}
              </Text>

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

            <Text
              size="xs"
              c="dimmed"
              tt="uppercase"
              fw={700}
              className={styles.label}
              mt={5}
            >
              {stat.label}
            </Text>

            {diffText && (
              <Text c={diffColor} size="sm" fw={500} mt="xs">
                {diffText}
              </Text>
            )}
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}
