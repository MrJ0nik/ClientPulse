import React from 'react';
import { Stack, Box, Text, Progress } from '@mantine/core';
import { Sparkles } from 'lucide-react';
import styles from './AIProcessingStep.module.css';

interface AIProcessingStepProps {
  progress: number;
  status: string;
  companyUrl: string;
}

export const AIProcessingStep: React.FC<AIProcessingStepProps> = ({
  progress,
  status,
  companyUrl,
}) => {
  return (
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
        <Text
          size="xl"
          fw={700}
          c="white"
          mb="xs"
          role="status"
          aria-live="polite"
        >
          {status}
        </Text>
        <Text className={styles.contentDescription}>
          ClientPulse AI is analyzing {companyUrl}
        </Text>
      </Box>

      <Box className={styles.progressContainer}>
        <Progress
          value={progress}
          size="sm"
          radius="xs"
          color="#10b981"
          classNames={{
            root: styles.progressRoot,
            section: styles.progressSection,
          }}
          animated={progress < 100}
          aria-label="Workspace creation progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </Box>
    </Stack>
  );
};
