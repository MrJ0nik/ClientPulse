"use client";

import { Stack, Box, Group, Skeleton, Paper } from "@mantine/core";
import styles from "./OpportunitiesList.module.css";

export interface OpportunitiesSkeletonProps {
  count?: number;
}

export function OpportunitiesSkeleton({ count = 3 }: OpportunitiesSkeletonProps) {
  return (
    <Stack gap="md">
      {Array.from({ length: count }).map((_, index) => (
        <Paper
          key={`skeleton-${index}`}
          p="lg"
          radius="md"
          style={{
            backgroundColor: "#1A1D26",
            border: "1px solid #2C2E33",
            opacity: 1 - index * 0.08, // Slight fade for depth
          }}
        >
          {/* Header skeleton */}
          <Group justify="space-between" align="flex-start" mb="md">
            <Stack gap="sm" style={{ flex: 1 }}>
              <Skeleton height={24} width="60%" radius="md" />
              <Skeleton height={16} width="80%" radius="md" />
            </Stack>
            <Skeleton height={32} width={80} radius="md" />
          </Group>

          {/* Stats grid skeleton */}
          <Group justify="space-between" mb="md" gap="sm">
            {[1, 2, 3].map((stat) => (
              <Box key={stat} style={{ flex: 1 }}>
                <Skeleton height={12} width="70%" mb="xs" radius="md" />
                <Skeleton height={20} width="50%" radius="md" />
              </Box>
            ))}
          </Group>

          {/* Evidence sources skeleton */}
          <Box mb="md">
            <Skeleton height={14} width="40%" mb="sm" radius="md" />
            {[1, 2].map((source) => (
              <Box key={source} p="xs" my="xs">
                <Skeleton height={14} width="85%" mb="xs" radius="md" />
                <Skeleton height={12} width="60%" radius="md" />
              </Box>
            ))}
          </Box>

          {/* Action buttons skeleton */}
          <Group gap="sm">
            <Skeleton height={32} width={80} radius="md" />
            <Skeleton height={32} width={100} radius="md" />
            <Skeleton height={32} width={90} radius="md" />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
