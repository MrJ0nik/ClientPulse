import { useState, useCallback } from 'react';

import { VALIDATION_MESSAGES } from '../constants/workspace.constants';
import type { ValidationErrors } from '../types/workspace.types';
import { isValidUrl } from '../utils/url.utils';

interface UseWorkspaceValidationReturn {
  errors: ValidationErrors;
  validateForm: (companyName: string, companyUrl: string) => boolean;
  clearError: (field: keyof ValidationErrors) => void;
  clearAllErrors: () => void;
  setGeneralError: (message: string) => void;
}

export const useWorkspaceValidation = (): UseWorkspaceValidationReturn => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = useCallback(
    (companyName: string, companyUrl: string): boolean => {
      const newErrors: ValidationErrors = {};
      let isValid = true;

      // Validate company name
      if (!companyName.trim()) {
        newErrors.name = VALIDATION_MESSAGES.COMPANY_NAME_REQUIRED;
        isValid = false;
      }

      // Validate URL
      if (!companyUrl.trim()) {
        newErrors.url = VALIDATION_MESSAGES.URL_REQUIRED;
        isValid = false;
      } else if (!isValidUrl(companyUrl)) {
        newErrors.url = VALIDATION_MESSAGES.URL_INVALID;
        isValid = false;
      }

      setErrors(newErrors);
      return isValid;
    },
    []
  );

  const clearError = useCallback((field: keyof ValidationErrors) => {
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setGeneralError = useCallback((message: string) => {
    setErrors((prev) => ({ ...prev, general: message }));
  }, []);

  return {
    errors,
    validateForm,
    clearError,
    clearAllErrors,
    setGeneralError,
  };
};
