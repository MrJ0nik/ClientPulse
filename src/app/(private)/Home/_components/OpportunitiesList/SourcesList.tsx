"use client";

import {
  Box,
  Stack,
  Group,
  Text,
  Button,
  Avatar,
  Badge,
  Collapse,
  Tooltip,
  CopyButton,
  ActionIcon,
  Kbd,
} from "@mantine/core";
import { ExternalLink, Copy, Check, Quote } from "lucide-react";
import { useState } from "react";
import styles from "./SourcesList.module.css";

export interface EvidenceSource {
  id: string;
  title: string;
  domain: string;
  url: string;
  source_type: "article" | "pdf" | "site" | "news" | "research" | "filing" | "other";
  snippet: string;
  relevance_score: number;
}

interface SourcesListProps {
  sources: EvidenceSource[];
  maxVisibleCount?: number;
}

const getSourceIcon = (source_type: string): React.ReactNode => {
  const iconMap: Record<string, string> = {
    article: "📰",
    pdf: "📄",
    site: "🌐",
    news: "📰",
    research: "📊",
    filing: "📋",
    other: "📎",
  };
  return iconMap[source_type] || "📎";
};

const getSourceBadgeColor = (source_type: string): string => {
  const colorMap: Record<string, string> = {
    article: "blue",
    pdf: "red",
    site: "cyan",
    news: "orange",
    research: "violet",
    filing: "indigo",
    other: "gray",
  };
  return colorMap[source_type] || "gray";
};

const getSourceLabel = (source_type: string): string => {
  const labelMap: Record<string, string> = {
    article: "Article",
    pdf: "PDF",
    site: "Website",
    news: "News",
    research: "Research",
    filing: "SEC Filing",
    other: "Source",
  };
  return labelMap[source_type] || "Source";
};

export function SourcesList({ sources, maxVisibleCount = 3 }: SourcesListProps) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = sources.length > maxVisibleCount;
  const visibleSources = expanded ? sources : sources.slice(0, maxVisibleCount);

  const handleOpenSource = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    console.log("✓ Copied link:", url);
  };

  const handleQuoteSnippet = (snippet: string, title: string) => {
    const quotedText = `"${snippet}"\n— ${title}`;
    navigator.clipboard.writeText(quotedText);
    console.log("✓ Copied quote");
  };

  return (
    <Box>
      <Group justify="space-between" mb={sources.length > 0 ? "md" : 0}>
        <Text fw={600} c="white" size="sm">
          Sources ({sources.length})
        </Text>
        {hasMore && (
          <Badge size="sm" variant="light" color="gray">
            {expanded ? "Hide extras" : `+${sources.length - maxVisibleCount} more`}
          </Badge>
        )}
      </Group>

      {sources.length === 0 ? (
        <Text size="xs" c="dimmed" ta="center" py="md">
          No sources available
        </Text>
      ) : (
        <Stack gap="sm">
          {visibleSources.map((source) => (
            <Box
              key={source.id}
              className={styles.sourceCard}
              component="div"
              role="article"
              aria-label={`Source: ${source.title}`}
            >
              {/* Header: Type badge + Title + Match % */}
              <Group justify="space-between" mb={8}>
                <Group gap="xs" style={{ flex: 1 }}>
                  <Text 
                    size="sm" 
                    c="gray.4"
                    aria-label={`Source type: ${getSourceLabel(source.source_type)}`}
                  >
                    {getSourceIcon(source.source_type)}
                  </Text>
                  <Badge
                    size="xs"
                    variant="light"
                    color={getSourceBadgeColor(source.source_type)}
                  >
                    {getSourceLabel(source.source_type)}
                  </Badge>
                  <Tooltip 
                    label={source.title} 
                    multiline 
                    w={300}
                  >
                    <Text
                      size="sm"
                      fw={500}
                      c="white"
                      truncate
                      style={{ flex: 1 }}
                    >
                      {source.title}
                    </Text>
                  </Tooltip>
                </Group>
                <Badge
                  size="sm"
                  variant="gradient"
                  gradient={{ from: "teal", to: "blue", deg: 45 }}
                >
                  {(source.relevance_score * 100).toFixed(0)}%
                </Badge>
              </Group>

              {/* Domain */}
              <Text size="xs" c="dimmed" mb={8}>
                {source.domain}
              </Text>

              {/* Snippet Preview (1-2 lines) */}
              <Text
                size="xs"
                c="gray.3"
                mb={10}
                className={styles.snippet}
                lineClamp={2}
              >
                {source.snippet}
              </Text>

              {/* Action Buttons */}
              <Group gap={6}>
                <Tooltip label="Open source in new tab (opens in new window)">
                  <Button
                    size="xs"
                    variant="light"
                    color="teal"
                    leftSection={<ExternalLink size={14} aria-hidden="true" />}
                    onClick={() => handleOpenSource(source.url)}
                    aria-label={`Open source: ${source.title}`}
                  >
                    Open
                  </Button>
                </Tooltip>

                <CopyButton value={source.url} timeout={2000}>
                  {({ copied }) => (
                    <Tooltip label={copied ? "Copied to clipboard!" : "Copy link to clipboard"}>
                      <Button
                        size="xs"
                        variant="light"
                        color={copied ? "green" : "gray"}
                        leftSection={copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                        onClick={() => handleCopyLink(source.url)}
                        aria-label={copied ? "Link copied" : "Copy source link"}
                      >
                        Copy link
                      </Button>
                    </Tooltip>
                  )}
                </CopyButton>

                <Tooltip label="Copy snippet with attribution as quote">
                  <Button
                    size="xs"
                    variant="light"
                    color="blue"
                    leftSection={<Quote size={14} aria-hidden="true" />}
                    onClick={() => handleQuoteSnippet(source.snippet, source.title)}
                    aria-label={`Copy quote from: ${source.title}`}
                  >
                    Quote
                  </Button>
                </Tooltip>
              </Group>
            </Box>
          ))}

          {/* Expand/Collapse Button */}
          {hasMore && (
            <Button
              size="xs"
              variant="subtle"
              color="gray"
              onClick={() => setExpanded(!expanded)}
              fullWidth
              mt={4}
              aria-label={expanded ? "Show fewer sources" : `Show ${sources.length - maxVisibleCount} more sources`}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : `Show ${sources.length - maxVisibleCount} more sources...`}
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}
