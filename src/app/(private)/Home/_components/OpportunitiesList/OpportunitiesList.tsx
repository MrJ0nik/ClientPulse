"use client";

import { useState, useEffect, useRef } from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  Stack,
  Title,
  Paper,
  Group,
  Avatar,
  Text,
  Progress,
  Button,
  Modal,
  Textarea,
  Box,
  ScrollArea,
} from "@mantine/core";
import { Copy, Check } from "lucide-react";
import styles from "./OpportunitiesList.module.css";

export interface Opportunity {
  id: string;
  company: string;
  domain: string;
  dept: string;
  probability: number;
  proposalDraft: string;
}

interface OpportunitiesListProps {
  data: Opportunity[];
}

function AnimatedProgress({ value, delay }: { value: number; delay: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <Progress
      value={progress}
      color="teal"
      size="sm"
      radius="xl"
      mb="xl"
      styles={{
        section: {
          transition: "width 1000ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      }}
    />
  );
}

export function OpportunitiesList({ data }: OpportunitiesListProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [copied, setCopied] = useState(false);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  const handleReviewClick = (item: Opportunity) => {
    setSelectedOpp(item);
    setCopied(false);
    open();
  };

  const handleCopy = () => {
    if (draftRef.current) {
      navigator.clipboard.writeText(draftRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size="90%"
        yOffset="2vh"
        padding={0}
        radius="md"
        title={
          <Text fw={700} c="white" size="lg">
            Review Outreach Draft
          </Text>
        }
        styles={{
          header: {
            backgroundColor: "#1F232F",
            color: "white",
            padding: "20px",
            borderBottom: "1px solid #2C2E33",
          },
          body: {
            backgroundColor: "#1F232F",
            color: "white",
            padding: "20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
          content: {
            backgroundColor: "#1F232F",
            border: "1px solid #2C2E33",
            height: "96vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {selectedOpp && (
          <Stack gap="md" style={{ height: "100%" }}>
            <Group align="center" mb="sm">
              <Avatar
                src={`https://cdn.brandfetch.io/${selectedOpp.domain}?w=64&h=64`}
                size="lg"
                radius="sm"
                styles={{
                  root: { backgroundColor: "white", padding: 4 },
                  image: { objectFit: "contain" },
                }}
              />
              <Box>
                <Text size="sm" c="dimmed">
                  Drafting email to:
                </Text>
                <Title order={3} c="white">
                  {selectedOpp.company}
                </Title>
                <Text size="sm" c="teal">
                  {selectedOpp.dept} • {selectedOpp.probability}% Match
                </Text>
              </Box>
            </Group>

            <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
              <Textarea
                ref={draftRef}
                label="AI Generated Proposal"
                minRows={25}
                autosize
                defaultValue={selectedOpp.proposalDraft}
                key={selectedOpp.id}
                styles={{
                  input: {
                    backgroundColor: "#1A1D26",
                    color: "white",
                    borderColor: "#374151",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    padding: "20px",
                  },
                  label: {
                    color: "#9CA3AF",
                    marginBottom: 10,
                    fontWeight: 600,
                  },
                }}
              />
            </ScrollArea>

            <Group
              justify="flex-end"
              pt="md"
              style={{ borderTop: "1px solid #2C2E33", marginTop: "auto" }}
            >
              <Button
                size="md"
                variant="default"
                onClick={close}
                styles={{
                  root: {
                    backgroundColor: "transparent",
                    borderColor: "#374151",
                    color: "white",
                  },
                }}
              >
                Close
              </Button>

              <Button
                size="md"
                color={copied ? "teal" : "blue"}
                onClick={handleCopy}
                leftSection={copied ? <Check size={18} /> : <Copy size={18} />}
              >
                {copied ? "Copied!" : "Copy Text"}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Stack>
        <Title order={4} c="white" mb="sm">
          High-Priority Opportunities
        </Title>

        {data.map((item, index) => {
          const cardEntryDelay = index * 150;
          const progressStartDelay = cardEntryDelay + 400;

          return (
            <Paper
              key={item.id}
              p="md"
              radius="md"
              className={`${styles.card} ${styles.animatedCard}`}
              style={{ animationDelay: `${cardEntryDelay}ms` }}
            >
              <Group mb="md">
                <Avatar
                  src={`https://cdn.brandfetch.io/${item.domain}?w=64&h=64`}
                  radius="sm"
                  className={styles.avatar}
                  styles={{ image: { objectFit: "contain" } }}
                />
                <div>
                  <Text fw={700} c="white">
                    {item.company}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {item.dept}
                  </Text>
                </div>
              </Group>

              <Text size="sm" c="teal" mb={4} fw={500}>
                {item.probability}% Win Probability
              </Text>

              <AnimatedProgress
                value={item.probability}
                delay={progressStartDelay}
              />

              <Button
                fullWidth
                variant="outline"
                color="gray"
                className={styles.button}
                onClick={() => handleReviewClick(item)}
              >
                Review Draft
              </Button>
            </Paper>
          );
        })}
      </Stack>
    </>
  );
}
