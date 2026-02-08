import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { workspaceService } from '../services/workspace.service';

import {
  TIMING,
  AI_PROCESSING_STATUSES,
  SUCCESS_MESSAGE,
  INITIAL_STATUS,
  VALIDATION_MESSAGES,
} from '../constants/workspace.constants';
import type { WorkspaceData } from '../types/workspace.types';
import { normalizeUrl } from '../utils/url.utils';

interface UseWorkspaceCreationReturn {
  isProcessing: boolean;
  aiProgress: number;
  aiStatus: string;
  createWorkspace: (data: WorkspaceData) => Promise<void>;
}

export const useWorkspaceCreation = (
  onError: (message: string) => void
): UseWorkspaceCreationReturn => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiStatus, setAiStatus] = useState(INITIAL_STATUS);

  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, []);

  const startProgressAnimation = useCallback(() => {
    setAiProgress(0);

    progressInterval.current = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= TIMING.PROGRESS_THRESHOLD) return prev;

        // Calculate which status to show based on progress
        const statusIndex = Math.floor(
          (prev / TIMING.PROGRESS_THRESHOLD) * AI_PROCESSING_STATUSES.length
        );
        const newStatus =
          AI_PROCESSING_STATUSES[statusIndex] || 'Processing...';
        setAiStatus(newStatus);

        // Random increment for realistic feel
        return prev + Math.random() * TIMING.PROGRESS_INCREMENT_MAX;
      });
    }, TIMING.PROGRESS_INTERVAL);
  }, []);

  const stopProgressAnimation = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const createWorkspace = useCallback(
    async (data: WorkspaceData) => {
      setIsProcessing(true);
      startProgressAnimation();

      try {
        const normalizedData: WorkspaceData = {
          companyName: data.companyName.trim(),
          companyUrl: normalizeUrl(data.companyUrl.trim()),
        };

        const response = await workspaceService.create(normalizedData);

        stopProgressAnimation();

        if (response.success && response.workspaceId) {
          setAiProgress(100);
          setAiStatus(SUCCESS_MESSAGE);

          // Navigate after short delay
          redirectTimeout.current = setTimeout(() => {
            router.push(`/workspaces/${response.workspaceId}/dashboard`);
          }, TIMING.SUCCESS_REDIRECT_DELAY);
        } else {
          throw new Error(response.error || VALIDATION_MESSAGES.GENERAL_ERROR);
        }
      } catch (err: unknown) {
        console.error('Workspace creation failed:', err);
        stopProgressAnimation();
        setIsProcessing(false);
        const errorMessage =
          err instanceof Error
            ? err.message
            : VALIDATION_MESSAGES.GENERAL_ERROR;
        onError(errorMessage);
      }
    },
    [router, startProgressAnimation, stopProgressAnimation, onError]
  );

  return {
    isProcessing,
    aiProgress,
    aiStatus,
    createWorkspace,
  };
};
