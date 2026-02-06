"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Box,
  Stack,
  ActionIcon,
  Progress,
  Group,
} from "@mantine/core";
import { X, Check, ArrowRight, Globe, Sparkles, Building } from "lucide-react";
import styles from "./page.module.css";

export default function CreateWorkspaceModal() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState("Connecting to site...");

  const steps = [
    { id: 1, label: "Company Info" },
    { id: 2, label: "AI Analysis" },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!companyName || !companyUrl) return;
      startAiProcess();
    }
  };

  const handleBack = () => {
    if (step > 1 && !isAiAnalyzing) setStep(step - 1);
  };

  const startAiProcess = () => {
    setStep(2);
    setIsAiAnalyzing(true);
    setAiProgress(0);

    const statuses = [
      { p: 10, text: "Resolving DNS..." },
      { p: 30, text: "Scraping metadata..." },
      { p: 50, text: "Analyzing brand colors..." },
      { p: 70, text: "Identifying key services..." },
      { p: 90, text: "Configuring workspace..." },
      { p: 100, text: "Done! Redirecting..." },
    ];

    let currentStatusIndex = 0;
    const interval = setInterval(() => {
      if (currentStatusIndex >= statuses.length) {
        clearInterval(interval);
        setTimeout(() => {
          const fakeId = `${companyName.toLowerCase().replace(/\s+/g, "-")}-${Math.random().toString(36).substr(2, 5)}`;
          router.push(`/workspaces/${fakeId}/dashboard`);
        }, 800);
        return;
      }
      const status = statuses[currentStatusIndex];
      setAiStatus(status.text);
      setAiProgress(status.p);
      currentStatusIndex++;
    }, 600);
  };

  const getStepCircleClass = (itemStep: number) => {
    if (step === itemStep) return styles.stepCircleActive;
    if (step > itemStep) return styles.stepCircleDone;
    return styles.stepCircleInactive;
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.backgroundEffects}>
        <Box className={styles.blobBlue} />
        <Box className={styles.blobGreen} />
      </Box>

      <Paper className={styles.modal} shadow="xl" radius="lg" p={0}>
        <ActionIcon variant="transparent" className={styles.closeBtn} size="lg">
          <X size={24} />
        </ActionIcon>

        <Box className={styles.sidebar}>
          <Title order={1} className={styles.title}>
            Setup your
            <br />
            Workspace
          </Title>
          <Box className={styles.stepperWrapper}>
            <Box className={styles.stepperLineBase} />
            <Box
              className={styles.stepperLineActive}
              style={
                {
                  "--active-height": `${(step - 1) * 100}%`,
                } as React.CSSProperties
              }
            />
            {steps.map((s) => (
              <div key={s.id} className={styles.stepItem}>
                <Box
                  className={`${styles.stepCircle} ${getStepCircleClass(s.id)}`}
                >
                  {step > s.id ? <Check size={18} strokeWidth={3} /> : s.id}
                </Box>
                <Text
                  size="lg"
                  fw={500}
                  className={
                    step === s.id
                      ? styles.stepLabelActive
                      : styles.stepLabelInactive
                  }
                >
                  {s.label}
                </Text>
              </div>
            ))}
          </Box>
        </Box>

        <Box className={styles.contentWrapper}>
          {step === 1 && (
            <Stack gap="xl" className={styles.fadeIn}>
              <Box>
                <Title order={2} className={styles.contentTitle}>
                  Tell us about your company
                </Title>
                <Text className={styles.contentDescription}>
                  We&apos;ll use AI to automatically configure your workspace.
                </Text>
              </Box>
              <Stack gap="lg">
                <TextInput
                  label="Company Name"
                  placeholder="e.g. Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  leftSection={<Building size={20} />}
                  classNames={{
                    input: styles.inputField,
                    label: styles.inputLabel,
                    section: styles.inputIconSection,
                  }}
                />
                <TextInput
                  label="Website URL"
                  placeholder="https://acme.com"
                  value={companyUrl}
                  onChange={(e) => setCompanyUrl(e.target.value)}
                  leftSection={<Globe size={20} />}
                  classNames={{
                    input: styles.inputField,
                    label: styles.inputLabel,
                    section: styles.inputIconSection,
                  }}
                />
              </Stack>
            </Stack>
          )}

          {step === 2 && (
            <Stack
              align="center"
              justify="center"
              gap="lg"
              className={`${styles.fadeIn} ${styles.aiProcessWrapper}`}
            >
              <Box className={styles.pulseWrapper}>
                <Box className={styles.pulseRing} />
                <Box className={styles.pulseRing} />
                <Sparkles size={48} className={styles.aiSparkleIcon} />
              </Box>
              <Box className={styles.aiStatusTextCenter}>
                <Text size="xl" fw={700} c="white" mb="xs">
                  {aiStatus}
                </Text>
                <Text className={styles.contentDescription}>
                  ClientPulse AI is analyzing {companyUrl}
                </Text>
              </Box>
              <Box className={styles.progressContainer}>
                <Progress
                  value={aiProgress}
                  size="sm"
                  radius="xs"
                  color="#10b981"
                  classNames={{
                    root: styles.progressRoot,
                    section: styles.progressSection,
                  }}
                />
              </Box>
            </Stack>
          )}

          <Group justify="space-between" mt={50}>
            <Button
              variant="subtle"
              className={`${styles.backBtn} ${step === 1 || isAiAnalyzing ? styles.hidden : ""}`}
              onClick={handleBack}
            >
              Back
            </Button>
            {!isAiAnalyzing && (
              <Button
                onClick={handleNext}
                disabled={step === 1 && (!companyName || !companyUrl)}
                rightSection={<ArrowRight size={18} />}
                className={styles.glowButton}
              >
                Analyze Site
              </Button>
            )}
          </Group>
        </Box>
      </Paper>
    </Box>
  );
}
