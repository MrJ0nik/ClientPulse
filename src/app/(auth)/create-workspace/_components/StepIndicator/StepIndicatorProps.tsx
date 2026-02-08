import React from 'react';
import { Box, Text } from '@mantine/core';
import { Check } from 'lucide-react';

import styles from './StepIndicator.module.css';
import { WorkspaceStep } from '@/src/types/workspace.types';
import { WORKSPACE_STEPS } from '@/src/constants/workspace.constants';

interface StepIndicatorProps {
  currentStep: WorkspaceStep;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
}) => {
  const getStepCircleClass = (itemStep: number): string => {
    if (currentStep === itemStep) return styles.stepCircleActive;
    if (currentStep > itemStep) return styles.stepCircleDone;
    return styles.stepCircleInactive;
  };

  return (
    <Box className={styles.stepperWrapper}>
      <Box className={styles.stepperLineBase} />
      <Box
        className={styles.stepperLineActive}
        style={
          {
            '--active-height': `${(currentStep - 1) * 100}%`,
          } as React.CSSProperties
        }
      />
      {WORKSPACE_STEPS.map((step) => (
        <div key={step.id} className={styles.stepItem}>
          <Box
            className={`${styles.stepCircle} ${getStepCircleClass(step.id)}`}
          >
            {currentStep > step.id ? (
              <Check size={18} strokeWidth={3} />
            ) : (
              step.id
            )}
          </Box>
          <Text
            size="lg"
            fw={500}
            className={
              currentStep === step.id
                ? styles.stepLabelActive
                : styles.stepLabelInactive
            }
          >
            {step.label}
          </Text>
        </div>
      ))}
    </Box>
  );
};
