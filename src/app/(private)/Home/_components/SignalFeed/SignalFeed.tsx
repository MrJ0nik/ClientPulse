"use client";

import { useState } from "react";
import {
  Paper,
  Group,
  Title,
  Badge,
  Text,
  Box,
  Avatar,
  Tooltip,
  Button,
  Center,
} from "@mantine/core";
import { Link as LinkIcon, ChevronDown } from "lucide-react";
import styles from "./SignalFeed.module.css";

export interface Signal {
  id: string;
  domain: string;
  title: string;
  source: string;
  painPoint: string;
  date?: string;
}

interface SignalFeedProps {
  signals: Signal[];
}

const GRADIENTS = [
  "linear-gradient(135deg, #FF6B6B 0%, #EE5253 100%)",
  "linear-gradient(135deg, #4834d4 0%, #686de0 100%)",
  "linear-gradient(135deg, #6ab04c 0%, #badc58 100%)",
  "linear-gradient(135deg, #f0932b 0%, #ffbe76 100%)",
  "linear-gradient(135deg, #be2edd 0%, #e056fd 100%)",
  "linear-gradient(135deg, #22a6b3 0%, #7ed6df 100%)",
  "linear-gradient(135deg, #eb4d4b 0%, #ff7979 100%)",
  "linear-gradient(135deg, #30336b 0%, #130f40 100%)",
];

function getGradientByString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getDomainFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const getSourceBadge = (sourceUrl: string) => {
  const domain = getDomainFromUrl(sourceUrl);

  if (!domain) {
    return (
      <Group gap={8}>
        <LinkIcon size={16} className={styles.sourceIcon} />
        <Text size="xs" fw={500}>
          Web Source
        </Text>
      </Group>
    );
  }

  return (
    <Group gap={8}>
      <Avatar
        src={`https://cdn.brandfetch.io/${domain}`}
        size={16}
        radius="sm"
        classNames={{
          root: styles.transparentAvatar,
          image: styles.avatarImage,
        }}
      >
        {domain.charAt(0).toUpperCase()}
      </Avatar>

      <Text size="xs" fw={500} tt="lowercase">
        {domain}
      </Text>
    </Group>
  );
};

export function SignalFeed({ signals }: SignalFeedProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  const sortedSignals = [...signals].sort((a, b) => {
    if (a.date && b.date) {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    return 0;
  });

  const displayedSignals = sortedSignals.slice(0, visibleCount);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  return (
    <Paper p="xl" radius="md" className={styles.card}>
      <Group justify="space-between" className={styles.header}>
        <Title order={3} c="white" fw={600}>
          Live Signal Feed & Matches
        </Title>

        <Badge
          variant="outline"
          color="gray"
          size="lg"
          radius="md"
          classNames={{ root: styles.badge }}
        >
          ALL MATCHES ▼
        </Badge>
      </Group>

      <Text size="sm" c="dimmed" mb="xl" ta="center">
        Latest Activity ({displayedSignals.length} / {sortedSignals.length})
      </Text>

      <Box className={styles.timelineContainer}>
        <div className={styles.centerLine} />

        {displayedSignals.map((signal, index) => {
          const isRight = index % 2 === 0;
          const isLeft = !isRight;

          const generatedGradient = getGradientByString(signal.domain);
          const companyLogoUrl = `https://cdn.brandfetch.io/${signal.domain}?w=128&h=128`;

          const timeString = signal.date
            ? new Date(signal.date).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          const CardContent = (
            <Paper
              component="a"
              href={signal.source}
              target="_blank"
              rel="noopener noreferrer"
              p="lg"
              radius="md"
              className={`${styles.eventCard} ${styles.eventLink}`}
            >
              {timeString && (
                <Group justify="space-between" mb={8}>
                  <Text size="xs" c="dimmed">
                    {timeString}
                  </Text>
                </Group>
              )}

              <Text c="white" size="sm" fw={400} mb={12} lh={1.4}>
                {signal.title}
              </Text>

              <Group gap={6} align="center">
                <Text size="xs" c="dimmed" fw={500}>
                  Pain Point:{" "}
                  <span className={styles.painPointValue}>
                    {signal.painPoint}
                  </span>
                </Text>
              </Group>
            </Paper>
          );

          return (
            <div
              key={signal.id}
              className={`${styles.timelineRow} ${styles.animatedItem}`}
              ref={(el) => {
                if (el) {
                  el.style.animationDelay = `${(index % 10) * 0.1}s`;
                }
              }}
            >
              <div className={styles.contentLeft}>
                {isLeft && (
                  <Tooltip
                    label={getSourceBadge(signal.source)}
                    color="#1F232F"
                    position="top"
                    withArrow
                    transitionProps={{ transition: "pop", duration: 200 }}
                  >
                    <Box>{CardContent}</Box>
                  </Tooltip>
                )}
              </div>

              <div className={styles.bulletContainer}>
                <div
                  className={styles.bullet}
                  ref={(el) => {
                    if (el) {
                      el.style.background = generatedGradient;
                    }
                  }}
                >
                  <Avatar
                    src={companyLogoUrl}
                    alt={signal.domain}
                    size={38}
                    radius="xl"
                    classNames={{
                      root: styles.transparentAvatar,
                      image: styles.avatarImage,
                    }}
                  >
                    {signal.domain.charAt(0).toUpperCase()}
                  </Avatar>
                </div>
              </div>

              <div className={styles.contentRight}>
                {isRight && (
                  <Tooltip
                    label={getSourceBadge(signal.source)}
                    color="#1F232F"
                    position="top"
                    withArrow
                    transitionProps={{ transition: "pop", duration: 200 }}
                  >
                    <Box>{CardContent}</Box>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
      </Box>

      {visibleCount < sortedSignals.length && (
        <Center mt="xl" pb="md">
          <Button
            variant="outline"
            color="gray"
            size="md"
            radius="md"
            onClick={handleShowMore}
            rightSection={<ChevronDown size={16} />}
            classNames={{
              root: styles.loadMoreButton,
            }}
          >
            Show More Matches
          </Button>
        </Center>
      )}
    </Paper>
  );
}
