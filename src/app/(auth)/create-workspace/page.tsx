'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paper, Title, Button, Box, Group } from '@mantine/core';
import { ArrowRight } from 'lucide-react';

import styles from './page.module.css';
import {
  CreateWorkspaceModalProps,
  WorkspaceStep,
} from '@/src/types/workspace.types';
import { useWorkspaceValidation } from '@/src/hooks/useWorkspaceValidation';
import { useWorkspaceCreation } from '@/src/hooks/useWorkspaceCreation';
import { StepIndicator } from './_components/StepIndicator/StepIndicatorProps';
import { CompanyInfoStep } from './_components/CompanyInfoStep/CompanyInfoStep';
import { AIProcessingStep } from './_components/AIProcessingStep/AIProcessingStep';

export default function CreateWorkspaceModal({
  onClose,
}: CreateWorkspaceModalProps) {
  const router = useRouter();

  const [step, setStep] = useState<WorkspaceStep>(1);
  const [companyName, setCompanyName] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');

  const { errors, validateForm, clearError, clearAllErrors, setGeneralError } =
    useWorkspaceValidation();

  const { isProcessing, aiProgress, aiStatus, createWorkspace } =
    useWorkspaceCreation((errorMessage) => {
      setStep(1);
      setGeneralError(errorMessage);
    });

  const handleNext = async () => {
    if (step === 1) {
      if (!validateForm(companyName, companyUrl)) return;

      clearAllErrors();
      setStep(2);

      await createWorkspace({
        companyName,
        companyUrl,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing && step === 1) {
      handleNext();
    }
  };

  const handleBack = () => {
    if (step > 1 && !isProcessing) {
      setStep(1);
      clearAllErrors();
    }
  };

  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (errors.name) clearError('name');
  };

  const handleCompanyUrlChange = (value: string) => {
    setCompanyUrl(value);
    if (errors.url) clearError('url');
  };

  return (
    <Box className={styles.container}>
      <Box className={styles.backgroundEffects}>
        <Box className={styles.blobBlue} />
        <Box className={styles.blobGreen} />
      </Box>

      <Paper className={styles.modal} shadow="xl" radius="lg" p={0}>
        <Box className={styles.sidebar}>
          <Title order={1} className={styles.title}>
            Setup your
            <br />
            Workspace
          </Title>
          <StepIndicator currentStep={step} />
        </Box>

        <Box className={styles.contentWrapper}>
          {step === 1 && (
            <CompanyInfoStep
              companyName={companyName}
              companyUrl={companyUrl}
              errors={errors}
              isProcessing={isProcessing}
              onCompanyNameChange={handleCompanyNameChange}
              onCompanyUrlChange={handleCompanyUrlChange}
              onKeyDown={handleKeyDown}
            />
          )}

          {step === 2 && (
            <AIProcessingStep
              progress={aiProgress}
              status={aiStatus}
              companyUrl={companyUrl}
            />
          )}

          <Group justify="space-between" mt={50}>
            <Button
              variant="subtle"
              color="gray"
              className={`${styles.backBtn} ${
                step === 1 || isProcessing ? styles.hidden : ''
              }`}
              onClick={handleBack}
              disabled={isProcessing}
              aria-label="Go back to previous step"
            >
              Back
            </Button>

            {!isProcessing && step === 1 && (
              <Button
                onClick={handleNext}
                rightSection={<ArrowRight size={18} />}
                className={styles.glowButton}
                loading={isProcessing}
                aria-label="Analyze website and create workspace"
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
