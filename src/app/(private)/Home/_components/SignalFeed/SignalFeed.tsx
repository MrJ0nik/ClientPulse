"use client";

import { useMemo, useState } from "react";
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
  Notification,
  SegmentedControl,
  Select,
} from "@mantine/core";
import {
  Link as LinkIcon,
  ChevronDown,
  Check,
  X,
  Bookmark,
  Clock,
  Archive,
  Eye,
} from "lucide-react";
import styles from "./SignalFeed.module.css";
import { signalsAPI } from "@/src/lib/signalsAPI";
import { SignalFeedSkeleton } from "./SignalFeedSkeleton";

export interface Signal {
  id: string;
  account_id: string;
  title: string;
  source_url: string;
  source_type: string;
  description: string;
  created_at: string;
  status?: string;
  workflow_status?: string;
  score?: number;
}

interface SignalFeedProps {
  signals: Signal[];
  loading?: boolean;
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

export function SignalFeed({ signals, loading: loadingProp = false }: SignalFeedProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "new" | "matched" | "needs_review" | "archived"
  >("all");
  const [sortBy, setSortBy] = useState<"recency" | "ai_score" | "company">("recency");
  const [signalActions, setSignalActions] = useState<
    Record<string, "archived" | "snoozed" | "saved" | "reviewed">
  >({});

  // Log signals for debugging
  console.log("📡 SignalFeed received signals:", signals);
  console.log("   Count:", signals.length);

  const getEffectiveStatus = (signal: Signal) => {
    const action = signalActions[signal.id];
    if (action === "archived") return "archived";
    if (action === "snoozed") return "snoozed";
    if (action === "saved") return "saved";
    if (action === "reviewed") return "reviewed";

    return (signal.status || signal.workflow_status || "processing").toLowerCase();
  };

  const filteredSignals = useMemo(() => {
    return signals.filter((signal) => {
      const effectiveStatus = getEffectiveStatus(signal);

      if (effectiveStatus === "archived" && filterStatus !== "archived") {
        return false;
      }

      if (filterStatus === "all") return effectiveStatus !== "archived";
      if (filterStatus === "archived") return effectiveStatus === "archived";
      if (filterStatus === "new") {
        return ["processing", "ingested", "new"].includes(effectiveStatus);
      }
      if (filterStatus === "matched") {
        return ["processed", "matched"].includes(effectiveStatus);
      }
      if (filterStatus === "needs_review") {
        return ["needs_review", "pending_review", "needs_more_evidence"].includes(effectiveStatus);
      }

      return true;
    });
  }, [signals, filterStatus, signalActions]);

  const sortedSignals = useMemo(() => {
    const sorted = [...filteredSignals].sort((a, b) => {
      if (sortBy === "ai_score") {
        return (b.score || 0) - (a.score || 0);
      }

      if (sortBy === "company") {
        const domainA = getDomainFromUrl(a.source_url) || a.title || "";
        const domainB = getDomainFromUrl(b.source_url) || b.title || "";
        return domainA.localeCompare(domainB);
      }

      if (a.created_at && b.created_at) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return 0;
    });

    return sorted;
  }, [filteredSignals, sortBy]);

  const displayedSignals = sortedSignals.slice(0, visibleCount);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleQuickAction = (
    signal: Signal,
    action: "reviewed" | "saved" | "archived" | "snoozed"
  ) => {
    setSignalActions((prev) => ({
      ...prev,
      [signal.id]: action,
    }));

    const actionLabel =
      action === "reviewed"
        ? "Marked for review"
        : action === "saved"
        ? "Saved to opportunities queue"
        : action === "snoozed"
        ? "Snoozed for later"
        : "Archived";

    setNotification({
      type: "success",
      message: `${actionLabel}: ${signal.title}`,
    });
  };

  return (
    <>
      {notification && (
        <Notification
          icon={notification.type === "success" ? <Check size={18} /> : <X size={18} />}
          color={notification.type === "success" ? "teal" : "red"}
          title={notification.type === "success" ? "Success" : "Error"}
          onClose={() => setNotification(null)}
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
          }}
        >
          {notification.message}
        </Notification>
      )}

      <Paper p="xl" radius="md" className={styles.card}>
        <Box className={styles.header}>
          <Title order={3} c="white" fw={600}>
            Live Signal Feed & Matches
          </Title>
          <Text size="sm" c="dimmed">
            Dashboard overview with signal routing and quick triage.
          </Text>
        </Box>

        <Group align="center" justify="space-between" className={styles.filterBar}>
          <SegmentedControl
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as typeof filterStatus)}
            data={[
              { label: "All", value: "all" },
              { label: "New", value: "new" },
              { label: "Matched", value: "matched" },
              { label: "Needs review", value: "needs_review" },
              { label: "Archived", value: "archived" },
            ]}
            className={styles.segmented}
          />

          <Group gap="sm" align="center">
            <Text size="xs" c="dimmed" className={styles.sortLabel}>
              Sort by
            </Text>
            <Select
              value={sortBy}
              onChange={(value) => setSortBy((value as typeof sortBy) || "recency")}
              data={[
                { value: "recency", label: "Recency" },
                { value: "ai_score", label: "AI Score" },
                { value: "company", label: "Company" },
              ]}
              classNames={{ input: styles.sortSelect }}
            />
          </Group>
        </Group>

        <Text size="sm" c="dimmed" mb="xl" ta="center">
          Latest Activity ({displayedSignals.length} / {sortedSignals.length})
        </Text>

        {loadingProp ? (
          <SignalFeedSkeleton count={5} />
        ) : (
        <Box className={styles.timelineContainer}>
          <div className={styles.centerLine} />

          {displayedSignals.map((signal, index) => {
            const isRight = index % 2 === 0;
            const isLeft = !isRight;

            const domain = getDomainFromUrl(signal.source_url) || "signal";
            const generatedGradient = getGradientByString(domain);
            const companyLogoUrl = `https://cdn.brandfetch.io/${domain}?w=128&h=128`;

            const timeString = signal.created_at
              ? new Date(signal.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            const effectiveStatus = getEffectiveStatus(signal);
            const statusColor =
              effectiveStatus === "archived"
                ? "gray"
                : effectiveStatus === "processed" || effectiveStatus === "matched"
                ? "teal"
                : effectiveStatus === "needs_review" || effectiveStatus === "pending_review"
                ? "orange"
                : "blue";

            const CardContent = (
              <Paper
                component="a"
                href={signal.source_url}
                target="_blank"
                rel="noopener noreferrer"
                p="lg"
                radius="md"
                className={`${styles.eventCard} ${styles.eventLink}`}
              >
                <Group justify="space-between" mb={8}>
                  <Group gap="xs">
                    <Badge size="xs" variant="light" color={statusColor}>
                      {effectiveStatus.replace("_", " ")}
                    </Badge>
                    {signal.score !== undefined && (
                      <Badge size="xs" variant="dot" color="teal">
                        {Math.round(signal.score)} AI
                      </Badge>
                    )}
                  </Group>
                  {timeString && (
                    <Text size="xs" c="dimmed">
                      {timeString}
                    </Text>
                  )}
                </Group>

                <Text c="white" size="sm" fw={500} mb={8} lh={1.4}>
                  {signal.title}
                </Text>

                <Text size="xs" c="dimmed" mb={10}>
                  {signal.description || "No description provided."}
                </Text>

                <Group gap={6} align="center" mb={12}>
                  {getSourceBadge(signal.source_url)}
                </Group>

                <Group gap="xs" className={styles.quickActions}>
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<Eye size={14} />}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleQuickAction(signal, "reviewed");
                    }}
                  >
                    Review
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<Bookmark size={14} />}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleQuickAction(signal, "saved");
                    }}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="yellow"
                    leftSection={<Clock size={14} />}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleQuickAction(signal, "snoozed");
                    }}
                  >
                    Snooze
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    leftSection={<Archive size={14} />}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      handleQuickAction(signal, "archived");
                    }}
                  >
                    Dismiss
                  </Button>
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
                      label={getSourceBadge(signal.source_url)}
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
                      alt={domain}
                      size={38}
                      radius="xl"
                      classNames={{
                        root: styles.transparentAvatar,
                        image: styles.avatarImage,
                      }}
                    >
                      {domain.charAt(0).toUpperCase()}
                    </Avatar>
                  </div>
                </div>

                <div className={styles.contentRight}>
                  {isRight && (
                    <Tooltip
                      label={getSourceBadge(signal.source_url)}
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
        )}

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
    </>
  );
}
