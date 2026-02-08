// services/workspace.service.ts

import type {
  WorkspaceData,
  WorkspaceResponse,
} from '../types/workspace.types';
import { TIMING } from '../constants/workspace.constants';

/**
 * Mock implementation for development/testing
 */
class MockWorkspaceService {
  async create(data: WorkspaceData): Promise<WorkspaceResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.1; // 90% success rate for testing

        if (isSuccess) {
          resolve({
            success: true,
            workspaceId: this.generateWorkspaceId(data.companyName),
          });
        } else {
          resolve({
            success: false,
            error: 'This domain is already registered in our system.',
          });
        }
      }, TIMING.SIMULATION_DELAY);
    });
  }

  private generateWorkspaceId(companyName: string): string {
    const slug = companyName.toLowerCase().replace(/\s+/g, '-');
    const randomId = Math.random().toString(36).substring(2, 7);
    return `ws-${slug}-${randomId}`;
  }
}

/**
 * Real Firebase implementation
 * TODO: Implement when Firebase backend is ready
 */
class FirebaseWorkspaceService {
  async create(data: WorkspaceData): Promise<WorkspaceResponse> {
    try {
      // TODO: Replace with actual Firebase call
      // const response = await axios.post('/api/workspaces/create', data);
      // return {
      //   success: true,
      //   workspaceId: response.data.workspaceId,
      // };

      throw new Error('Firebase implementation not yet available');
    } catch (error) {
      const err = error as {
        message?: string;
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      return {
        success: false,
        error:
          err.response?.data?.message ||
          err.message ||
          'Failed to connect to server',
      };
    }
  }
}

// Factory function to get the appropriate service
const getWorkspaceService = () => {
  const useMock =
    process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' ||
    typeof process.env.NEXT_PUBLIC_USE_MOCK_API === 'undefined';

  return useMock ? new MockWorkspaceService() : new FirebaseWorkspaceService();
};

export const workspaceService = getWorkspaceService();
