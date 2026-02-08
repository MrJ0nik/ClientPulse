import React from 'react';
import { Stack, Box, Title, Text, TextInput, Alert } from '@mantine/core';
import { Building, Globe, AlertCircle } from 'lucide-react';

import styles from './CompanyInfoStep.module.css';
import { ValidationErrors } from '@/src/types/workspace.types';

interface CompanyInfoStepProps {
  companyName: string;
  companyUrl: string;
  errors: ValidationErrors;
  isProcessing: boolean;
  onCompanyNameChange: (value: string) => void;
  onCompanyUrlChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
  companyName,
  companyUrl,
  errors,
  isProcessing,
  onCompanyNameChange,
  onCompanyUrlChange,
  onKeyDown,
}) => {
  return (
    <Stack gap="xl" className={styles.fadeIn}>
      <Box>
        <Title order={2} className={styles.contentTitle}>
          Tell us about your company
        </Title>
        <Text className={styles.contentDescription}>
          We&apos;ll use AI to automatically configure your workspace.
        </Text>
      </Box>

      {errors.general && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Error"
          color="red"
          variant="light"
        >
          {errors.general}
        </Alert>
      )}

      <Stack gap="lg">
        <TextInput
          label="Company Name"
          placeholder="e.g. Acme Corp"
          value={companyName}
          onChange={(e) => onCompanyNameChange(e.target.value)}
          onKeyDown={onKeyDown}
          error={errors.name}
          disabled={isProcessing}
          leftSection={<Building size={20} />}
          classNames={{
            input: styles.inputField,
            label: styles.inputLabel,
            section: styles.inputIconSection,
          }}
          aria-label="Company name"
          autoComplete="organization"
        />
        <TextInput
          label="Website URL"
          placeholder="acme.com"
          value={companyUrl}
          onChange={(e) => onCompanyUrlChange(e.target.value)}
          onKeyDown={onKeyDown}
          error={errors.url}
          disabled={isProcessing}
          leftSection={<Globe size={20} />}
          classNames={{
            input: styles.inputField,
            label: styles.inputLabel,
            section: styles.inputIconSection,
          }}
          aria-label="Website URL"
          autoComplete="url"
        />
      </Stack>
    </Stack>
  );
};
