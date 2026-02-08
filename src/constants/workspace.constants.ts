export const WORKSPACE_STEPS = [
  { id: 1, label: 'Company Info' },
  { id: 2, label: 'AI Analysis' },
] as const;

export const TIMING = {
  SIMULATION_DELAY: 3500,
  PROGRESS_INTERVAL: 200,
  SUCCESS_REDIRECT_DELAY: 1000,
  PROGRESS_THRESHOLD: 90,
  PROGRESS_INCREMENT_MAX: 2.5,
} as const;

export const AI_PROCESSING_STATUSES = [
  'Resolving DNS...',
  'Connecting to secure server...',
  'Scraping public metadata...',
  'Analyzing brand identity...',
  'Generating workspace config...',
] as const;

export const VALIDATION_MESSAGES = {
  COMPANY_NAME_REQUIRED: 'Company name is required',
  URL_REQUIRED: 'Website URL is required',
  URL_INVALID: 'Please enter a valid URL (e.g., acme.com)',
  GENERAL_ERROR: 'Something went wrong. Please try again.',
} as const;

export const SUCCESS_MESSAGE = 'Workspace created successfully!';
export const INITIAL_STATUS = 'Initiating...';
