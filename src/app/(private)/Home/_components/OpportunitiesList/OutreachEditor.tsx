"use client";

import {
  Box,
  Stack,
  Group,
  Text,
  Button,
  Select,
  Tabs,
  Textarea,
  Badge,
  ScrollArea,
  Divider,
  Tooltip,
  CopyButton,
  SimpleGrid,
} from "@mantine/core";
import {
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  Zap,
  BookOpen,
  Target,
} from "lucide-react";
import { useState, useMemo } from "react";
import styles from "./OutreachEditor.module.css";

export interface OutreachEditorProps {
  initialDraft: string;
  keyFacts: string[];
  sourceCount: number;
  onCopyText?: (text: string) => void;
  isLoading?: boolean;
}

type Mode = "outline" | "draft" | "final";
type Tone = "formal" | "neutral" | "friendly";
type Length = "short" | "medium" | "long";
type Personalization = "low" | "medium" | "high";

interface EditorState {
  outline: string;
  draft: string;
  final: string;
}

const modeLabels: Record<Mode, string> = {
  outline: "Outline",
  draft: "Draft",
  final: "Final",
};

const toneEmoji: Record<Tone, string> = {
  formal: "📋",
  neutral: "📝",
  friendly: "😊",
};

const personalizationLevel: Record<Personalization, string> = {
  low: "Generic",
  medium: "Personalized",
  high: "Highly Personalized",
};

export function OutreachEditor({
  initialDraft,
  keyFacts,
  sourceCount,
  onCopyText,
  isLoading = false,
}: OutreachEditorProps) {
  const [mode, setMode] = useState<Mode>("draft");
  const [tone, setTone] = useState<Tone>("neutral");
  const [length, setLength] = useState<Length>("medium");
  const [personalization, setPersonalization] = useState<Personalization>("medium");

  // Editor states for each mode
  const [editorStates, setEditorStates] = useState<EditorState>({
    outline: generateOutline(initialDraft),
    draft: initialDraft,
    final: initialDraft,
  });

  const [lastAction, setLastAction] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentText = editorStates[mode];

  // Get preview text without markdown or special chars
  const cleanText = useMemo(() => {
    return currentText
      .replace(/\*\*/g, "") // Remove bold markers
      .replace(/\*/g, "") // Remove italic markers
      .replace(/#{1,6} /g, "") // Remove headers
      .replace(/\n\n+/g, "\n") // Normalize line breaks
      .trim();
  }, [currentText]);

  // Quick action handlers
  const handleQuickAction = async (action: string) => {
    setActionLoading(true);
    setLastAction(action);

    try {
      // Simulate AI processing
      await new Promise((resolve) => setTimeout(resolve, 1200));

      let updated = currentText;

      switch (action) {
        case "shorten":
          // Simulate shortening by removing long phrases
          updated = currentText
            .split("\n")
            .filter((line) => line.length < 100 || line.length === 0)
            .join("\n")
            .substring(0, Math.floor(currentText.length * 0.7));
          break;

        case "specific":
          // Add specificity markers
          updated = currentText
            .replace(/in order to/g, "to")
            .replace(/might help/g, "helps")
            .replace(/could potentially/g, "will")
            .replace(/seems like/g, "is");
          break;

        case "credibility":
          // Add credibility markers
          updated = `**Backed by evidence:** Based on recent developments, ${currentText.toLowerCase()}`;
          break;

        case "cta":
          // Add call-to-action
          if (!currentText.includes("Let's")) {
            updated = `${currentText}\n\n**Let's talk.** I'd love to discuss how we can help. Are you available next week?`;
          }
          break;

        case "clarity":
          // Improve clarity
          updated = currentText
            .replace(/a number of/g, "several")
            .replace(/in terms of/g, "for")
            .replace(/with regard to/g, "about");
          break;

        case "regenerate":
          // Full regeneration
          updated = generateOutline(initialDraft);
          break;
      }

      setEditorStates((prev) => ({
        ...prev,
        [mode]: updated,
      }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleTextChange = (value: string) => {
    setEditorStates((prev) => ({
      ...prev,
      [mode]: value,
    }));
  };

  return (
    <Box className={styles.editorContainer}>
      {/* Control Bar - Top Section */}
      <Box className={styles.controlBar}>
        <Group justify="space-between" wrap="wrap" gap="md">
          {/* Mode Tabs */}
          <Tabs
            value={mode}
            onChange={(val) => setMode((val as Mode) || "draft")}
            variant="pills"
          >
            <Tabs.List>
              {(["outline", "draft", "final"] as const).map((m) => (
                <Tabs.Tab
                  key={m}
                  value={m}
                  fw={500}
                  leftSection={
                    m === "outline" ? (
                      <BookOpen size={14} />
                    ) : m === "draft" ? (
                      <Sparkles size={14} />
                    ) : (
                      <Check size={14} />
                    )
                  }
                >
                  {modeLabels[m]}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>

          {/* Settings Controls */}
          <Group gap="xs">
            <Select
              label="Tone"
              placeholder="Select tone"
              value={tone}
              onChange={(val) => setTone((val as Tone) || "neutral")}
              data={[
                { value: "formal", label: "📋 Formal" },
                { value: "neutral", label: "📝 Neutral" },
                { value: "friendly", label: "😊 Friendly" },
              ]}
              size="xs"
              w={130}
              styles={{ input: { fontSize: "12px" } }}
            />

            <Select
              label="Length"
              placeholder="Select length"
              value={length}
              onChange={(val) => setLength((val as Length) || "medium")}
              data={[
                { value: "short", label: "Short" },
                { value: "medium", label: "Medium" },
                { value: "long", label: "Long" },
              ]}
              size="xs"
              w={110}
              styles={{ input: { fontSize: "12px" } }}
            />

            <Select
              label="Personalization"
              placeholder="Select level"
              value={personalization}
              onChange={(val) => setPersonalization((val as Personalization) || "medium")}
              data={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
              ]}
              size="xs"
              w={120}
              styles={{ input: { fontSize: "12px" } }}
            />
          </Group>
        </Group>

        {/* Primary Action Buttons */}
        <Group gap={6} mt="sm" wrap="wrap">
          <Tooltip label="Generate new outline from scratch">
            <Button
              size="xs"
              variant="light"
              color="violet"
              leftSection={<RefreshCw size={14} />}
              onClick={() => handleQuickAction("regenerate")}
              loading={actionLoading && lastAction === "regenerate"}
            >
              Regenerate
            </Button>
          </Tooltip>

          <Tooltip label="Enhance clarity and remove filler words">
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<Sparkles size={14} />}
              onClick={() => handleQuickAction("clarity")}
              loading={actionLoading && lastAction === "clarity"}
            >
              Improve clarity
            </Button>
          </Tooltip>

          <Tooltip label="Add call-to-action if missing">
            <Button
              size="xs"
              variant="light"
              color="cyan"
              leftSection={<Target size={14} />}
              onClick={() => handleQuickAction("cta")}
              loading={actionLoading && lastAction === "cta"}
            >
              Add CTA
            </Button>
          </Tooltip>

          <Tooltip label="Make content shorter">
            <Button
              size="xs"
              variant="light"
              color="gray"
              onClick={() => handleQuickAction("shorten")}
              loading={actionLoading && lastAction === "shorten"}
            >
              Shorten
            </Button>
          </Tooltip>
        </Group>

        {/* Secondary Quick Actions */}
        <Group gap={6} mt="sm" wrap="wrap">
          <Tooltip label="Make claims more specific and measurable">
            <Button
              size="xs"
              variant="subtle"
              color="blue"
              onClick={() => handleQuickAction("specific")}
              loading={actionLoading && lastAction === "specific"}
            >
              Make more specific
            </Button>
          </Tooltip>

          <Tooltip label="Add evidence and backing statements">
            <Button
              size="xs"
              variant="subtle"
              color="teal"
              onClick={() => handleQuickAction("credibility")}
              loading={actionLoading && lastAction === "credibility"}
            >
              Add credibility
            </Button>
          </Tooltip>
        </Group>
      </Box>

      <Divider my="md" />

      {/* Main Content Area */}
      <SimpleGrid cols={{ base: 1, lg: 3 }} spacing="md" style={{ minHeight: "500px" }}>
        {/* Editor - Left/Full Width */}
        <Box style={{ gridColumn: "1 / -1", lgGridColumn: "1 / 3" }}>
          <Stack gap="sm" h="100%">
            <Group justify="space-between" align="center">
              <Text fw={600} c="white" size="sm">
                {modeLabels[mode]} Editor
              </Text>
              <Group gap={4}>
                <Badge size="sm" variant="light" color="gray">
                  {currentText.split(" ").length} words
                </Badge>
                <Badge size="sm" variant="light" color="gray">
                  {currentText.split("\n").length} lines
                </Badge>
              </Group>
            </Group>

            <Textarea
              value={currentText}
              onChange={(e) => handleTextChange(e.currentTarget.value)}
              placeholder="Your outreach message will appear here..."
              minRows={16}
              autosize
              className={styles.editor}
              styles={{
                input: {
                  backgroundColor: "#1A1D26",
                  color: "white",
                  borderColor: "#374151",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  padding: "16px",
                  fontFamily: "Monaco, Courier New, monospace",
                },
              }}
            />

            {/* Copy Action */}
            <Group justify="flex-end" gap="xs">
              <CopyButton value={cleanText} timeout={2000}>
                {({ copied }) => (
                  <Tooltip label={copied ? "Copied clean text!" : "Copy clean text (no formatting)"}>
                    <Button
                      size="sm"
                      variant={copied ? "filled" : "light"}
                      color={copied ? "teal" : "blue"}
                      leftSection={copied ? <Check size={16} /> : <Copy size={16} />}
                    >
                      {copied ? "Copied!" : "Copy Text"}
                    </Button>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Stack>
        </Box>

        {/* Right Sidebar - Key Facts & Sources */}
        <Box className={styles.sidebar}>
          <Stack gap="md" h="100%">
            {/* Key Facts */}
            <Box>
              <Text fw={600} c="white" mb="sm" size="sm">
                📌 Key Facts Used
              </Text>
              <Stack gap={8}>
                {keyFacts.length > 0 ? (
                  keyFacts.slice(0, 5).map((fact, idx) => (
                    <Box
                      key={idx}
                      p="xs"
                      className={styles.factBullet}
                    >
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        • {fact}
                      </Text>
                    </Box>
                  ))
                ) : (
                  <Text size="xs" c="dimmed" ta="center" py="md">
                    No facts available
                  </Text>
                )}
              </Stack>

              {keyFacts.length > 5 && (
                <Text size="xs" c="gray.5" mt="xs" ta="center">
                  +{keyFacts.length - 5} more
                </Text>
              )}
            </Box>

            <Divider />

            {/* Sources Reference */}
            <Box>
              <Text fw={600} c="white" mb="sm" size="sm">
                🔗 Sources
              </Text>
              <Badge
                size="lg"
                variant="gradient"
                gradient={{ from: "teal", to: "blue", deg: 45 }}
                fullWidth
              >
                {sourceCount} source{sourceCount !== 1 ? "s" : ""} referenced
              </Badge>
              <Text size="xs" c="dimmed" mt="sm" ta="center">
                View sources in the analysis panel
              </Text>
            </Box>

            {/* Mode Info */}
            <Box style={{ marginTop: "auto" }}>
              <Stack gap="xs">
                <Badge size="sm" variant="light" color="gray" fullWidth>
                  {mode === "outline" && "Structure your message"}
                  {mode === "draft" && "Build your draft"}
                  {mode === "final" && "Finalize and polish"}
                </Badge>
                <Text size="xs" c="dimmed" ta="center">
                  {tone === "formal" && "Professional tone"}
                  {tone === "neutral" && "Balanced approach"}
                  {tone === "friendly" && "Conversational style"}
                </Text>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

// Utility function to generate outline from draft
function generateOutline(draft: string): string {
  const lines = draft.split("\n").filter((l) => l.trim());
  const outline = lines
    .slice(0, Math.ceil(lines.length / 3))
    .map((line) => `• ${line.substring(0, 60)}...`)
    .join("\n");

  return outline || "1. Opening statement\n2. Key value proposition\n3. Social proof\n4. Call to action";
}
