"use client";

import { Stack, Box, Group, Skeleton, Paper } from "@mantine/core";

export interface SignalFeedSkeletonProps {
  count?: number;
}

export function SignalFeedSkeleton({ count = 5 }: SignalFeedSkeletonProps) {
  return (
    <Stack gap="md">
      {Array.from({ length: count }).map((_, index) => (
        <Paper
          key={`signal-skeleton-${index}`}
          p="md"
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
              <Skeleton height={20} width="75%" radius="md" />
              <Skeleton height={14} width="50%" radius="md" />
            </Stack>
            <Skeleton height={24} width={60} radius="md" />
          </Group>

          {/* Type and metadata skeleton */}
          <Group gap="xs" mb="md">
            <Skeleton height={16} width={80} radius="md" />
            <Skeleton height={16} width={70} radius="md" />
          </Group>

          {/* Description skeleton */}
          <Box mb="md">
            <Skeleton height={12} width="100%" mb={6} radius="md" />
            <Skeleton height={12} width="95%" mb={6} radius="md" />
            <Skeleton height={12} width="80%" radius="md" />
          </Box>

          {/* Footer buttons skeleton */}
          <Group gap="xs">
            <Skeleton height={28} width={70} radius="md" />
            <Skeleton height={28} width={70} radius="md" />
          </Group>
        </Paper>
      ))}
    </Stack>
  );
}
