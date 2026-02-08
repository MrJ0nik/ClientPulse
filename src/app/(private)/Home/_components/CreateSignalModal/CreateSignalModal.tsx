"use client";

import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Box,
  Text,
  Badge,
  Alert,
  Loader,
  Grid,
  Paper,
} from "@mantine/core";
import {
  AlertCircle,
  CheckCircle,
  Link as LinkIcon,
  Lightbulb,
  Zap,
} from "lucide-react";
import { useState } from "react";
import styles from "./CreateSignalModal.module.css";

export interface CreateSignalModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit?: (signal: CreateSignalFormData) => Promise<void>;
}

export interface CreateSignalFormData {
  title: string;
  sourceUrl: string;
  sourceType: string;
  context?: string;
}

interface FormErrors {
  title?: string;
  sourceUrl?: string;
  sourceType?: string;
}

interface PreviewData {
  title: string;
  domain: string;
  favicon: string;
}

const SIGNAL_TYPES = [
  { value: "news", label: "📰 News Article" },
  { value: "sec_filing", label: "📋 SEC Filing" },
  { value: "press_release", label: "📢 Press Release" },
  { value: "job_posting", label: "💼 Job Posting" },
  { value: "earnings_call", label: "📊 Earnings Call Transcript" },
  { value: "social_media", label: "📱 Social Media" },
  { value: "patent", label: "🔬 Patent Filing" },
  { value: "industry_report", label: "📈 Industry Report" },
  { value: "other", label: "📎 Other" },
];

export function CreateSignalModal({
  opened,
  onClose,
  onSubmit,
}: CreateSignalModalProps) {
  const [formData, setFormData] = useState<CreateSignalFormData>({
    title: "",
    sourceUrl: "",
    sourceType: "news",
    context: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validate form fields
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.sourceUrl.trim()) {
      newErrors.sourceUrl = "Source URL is required";
    } else if (!isValidUrl(formData.sourceUrl)) {
      newErrors.sourceUrl = "Please enter a valid URL (e.g., https://example.com)";
    }

    if (!formData.sourceType) {
      newErrors.sourceType = "Please select a signal type";
    }

    return newErrors;
  };

  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Fetch preview from URL
  const handleFetchPreview = async () => {
    setPreviewError(null);
    setPreview(null);

    if (!formData.sourceUrl.trim()) {
      setPreviewError("Please enter a URL first");
      return;
    }

    if (!isValidUrl(formData.sourceUrl)) {
      setPreviewError("Invalid URL format");
      return;
    }

    setPreviewLoading(true);

    try {
      // Simulate fetching preview data
      // In production: call actual API to fetch meta tags
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const urlObj = new URL(formData.sourceUrl);
      const domain = urlObj.hostname.replace("www.", "");

      // Mock preview data
      const mockPreview: PreviewData = {
        title:
          formData.title ||
          `Article from ${domain}`.substring(0, 100),
        domain,
        favicon: `https://cdn.brandfetch.io/${domain}?w=64&h=64`,
      };

      setPreview(mockPreview);

      // Auto-fill title if empty
      if (!formData.title) {
        setFormData((prev) => ({
          ...prev,
          title: mockPreview.title,
        }));
      }
    } catch (error) {
      setPreviewError("Failed to fetch preview. Please try again.");
      console.error("Preview fetch error:", error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async () => {
    const formErrors = validateForm();

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }

      // Reset form on success
      setFormData({
        title: "",
        sourceUrl: "",
        sourceType: "news",
        context: "",
      });
      setPreview(null);
      
      // Show success message
      setSubmitError(null);
      console.log("✓ Signal created:", formData.title);
      
      onClose();
    } catch (error: any) {
      setSubmitError(
        error.message || "Failed to create signal. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      sourceUrl: "",
      sourceType: "news",
      context: "",
    });
    setErrors({});
    setPreview(null);
    setPreviewError(null);
    setSubmitError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <Zap size={20} color="#14b8a6" />
          <Text fw={700} c="white" size="lg">
            Create New Signal
          </Text>
        </Group>
      }
      size="lg"
      radius="md"
      styles={{
        header: {
          backgroundColor: "#1F232F",
          color: "white",
          borderBottom: "1px solid #2C2E33",
          padding: "20px",
        },
        body: {
          backgroundColor: "#1F232F",
          color: "white",
          padding: "20px",
        },
        content: {
          backgroundColor: "#1F232F",
          border: "1px solid #2C2E33",
        },
      }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="lg" style={{ maxWidth: "100%" }}>
        {/* General error alert */}
        {submitError && (
          <Alert
            icon={<AlertCircle size={16} />}
            color="red"
            title="Error"
            styles={{
              root: { 
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                lineHeight: 1.6,
              },
              title: { color: "#ef4444" },
              message: { color: "#fca5a5", lineHeight: 1.6 },
            }}
          >
            {submitError}
          </Alert>
        )}

        {/* Title field */}
        <Box>
          <TextInput
            label="Signal Title"
            placeholder="e.g., TechCorp announces Series C funding"
            value={formData.title}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
            }}
            error={errors.title}
            required
            aria-label="Signal title"
            aria-required="true"
            leftSection={<Lightbulb size={16} />}
            styles={{
              input: {
                backgroundColor: "#1A1D26",
                borderColor: errors.title ? "#ef4444" : "#374151",
                color: "white",
                lineHeight: 1.5,
              },
              label: { color: "#e5e7eb", fontWeight: 600, marginBottom: 8 },
              description: { color: "#9ca3af", lineHeight: 1.6 },
            }}
            description={
              !errors.title && (
                <div style={{ maxWidth: "70ch" }}>
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, fontWeight: 500, marginTop: 6 }}>
                    ✓ Good signal titles include:
                  </Text>
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, marginTop: 4 }}>
                    • Company names &amp; specific actions<br />
                    • Relevant dates or amounts<br />
                    • Keep it concise (5–200 characters)
                  </Text>
                </div>
              )
            }
          />
          {formData.title && (
            <Group gap={4} mt={4}>
              <Text size="xs" c="dimmed">
                {formData.title.length}/200
              </Text>
              {formData.title.length >= 5 && (
                <CheckCircle size={14} color="#14b8a6" />
              )}
            </Group>
          )}
        </Box>

        {/* Source URL field with preview */}
        <Box>
          <Group mb="sm" justify="space-between" align="flex-end">
            <div style={{ flex: 1 }}>
              <TextInput
                label="Source URL"
                placeholder="https://example.com/article"
                value={formData.sourceUrl}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }));
                  if (errors.sourceUrl)
                    setErrors((prev) => ({ ...prev, sourceUrl: "" }));
                  setPreview(null);
                  setPreviewError(null);
                }}
                error={errors.sourceUrl}
                required
                aria-label="Source URL"
                aria-required="true"
                leftSection={<LinkIcon size={16} />}
                styles={{
                  input: {
                    backgroundColor: "#1A1D26",
                    borderColor: errors.sourceUrl ? "#ef4444" : "#374151",
                    color: "white",
                    lineHeight: 1.5,
                  },
                  label: { color: "#e5e7eb", fontWeight: 600, marginBottom: 8 },
                  description: { color: "#9ca3af", lineHeight: 1.6 },
                }}
                description={
                  !errors.sourceUrl && (
                    <div style={{ maxWidth: "70ch"}}>\n                      <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, fontWeight: 500, marginTop: 6 }}>
                        ✓ Supported sources:
                      </Text>
                      <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, marginTop: 4 }}>
                        • News articles &amp; press releases<br />
                        • SEC filings &amp; corporate documents<br />
                        • LinkedIn profiles &amp; posts<br />
                        • Job listings &amp; patent filings
                      </Text>
                    </div>
                  )
                }
              />
            </div>

            <Button
              variant="light"
              color="cyan"
              onClick={handleFetchPreview}
              loading={previewLoading}
              disabled={!formData.sourceUrl.trim()}
              size="sm"
              aria-label="Fetch preview from URL"
            >
              {previewLoading ? "Fetching..." : "Fetch preview"}
            </Button>
          </Group>

          {/* Preview display */}
          {preview && (
            <Paper
              p="sm"
              radius="md"
              style={{
                backgroundColor: "rgba(20, 184, 166, 0.08)",
                border: "1px solid rgba(20, 184, 166, 0.2)",
              }}
            >
              <Group gap="sm" align="center">
                <img
                  src={preview.favicon}
                  alt={preview.domain}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <Box style={{ flex: 1 }}>
                  <Text size="sm" fw={500} c="white">
                    {preview.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {preview.domain}
                  </Text>
                </Box>
                <CheckCircle size={18} color="#14b8a6" />
              </Group>
            </Paper>
          )}

          {previewError && (
            <Text size="xs" c="red" mt={4}>
              ⚠️ {previewError}
            </Text>
          )}
        </Box>

        {/* Signal Type dropdown */}
        <Select
          label="Signal Type"
          placeholder="Select type"
          value={formData.sourceType}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, sourceType: value || "news" }));
            if (errors.sourceType)
              setErrors((prev) => ({ ...prev, sourceType: "" }));
          }}
          data={SIGNAL_TYPES}
          required
          aria-label="Signal type"
          aria-required="true"
          searchable
          clearable={false}
          styles={{
            input: {
              backgroundColor: "#1A1D26",
              borderColor: errors.sourceType ? "#ef4444" : "#374151",
              color: "white",
              lineHeight: 1.5,
            },
            label: { color: "#e5e7eb", fontWeight: 600, marginBottom: 8 },
            description: { color: "#9ca3af", lineHeight: 1.6 },
            option: {
              backgroundColor: "#1A1D26",
              color: "white",
              "&:hover": { backgroundColor: "#2C2E33" },
            },
          }}
          description={
            <div style={{ maxWidth: "70ch" }}>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, fontWeight: 500, marginTop: 6 }}>
                ✓ Help categorize signals:
              </Text>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, marginTop: 4 }}>
                Choose the type that best matches<br />
                your source. Used for filtering &amp; alerts.
              </Text>
            </div>
          }
        />

        {/* Context/Notes textarea */}
        <Textarea
          label="Additional Context (optional)"
          placeholder="Add any notes, why this signal matters, or which accounts it's relevant for..."
          value={formData.context || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, context: e.target.value }))
          }
          minRows={3}
          maxRows={8}
          aria-label="Additional context"
          styles={{
            input: {
              backgroundColor: "#1A1D26",
              borderColor: "#374151",
              color: "white",
              lineHeight: 1.6,
            },
            label: { color: "#e5e7eb", fontWeight: 600, marginBottom: 8 },
            description: { color: "#9ca3af", lineHeight: 1.6 },
          }}
          description={
            <div style={{ maxWidth: "70ch" }}>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, fontWeight: 500, marginTop: 6 }}>
                ✓ Help the team understand context:
              </Text>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.6, marginTop: 4 }}>
                • Why does this matter?<br />
                • Which accounts should care?<br />
                • What's the business impact?
              </Text>
            </div>
          }
        />

        {/* Form stats */}
        <Box
          p="sm"
          style={{
            backgroundColor: "rgba(20, 184, 166, 0.05)",
            borderRadius: "8px",
            border: "1px solid rgba(20, 184, 166, 0.1)",
          }}
        >
          <Group justify="space-between" gap="md">
            <Box>
              <Text size="xs" c="dimmed">
                Signal Type
              </Text>
              <Badge size="sm" variant="light" color="cyan">
                {SIGNAL_TYPES.find((t) => t.value === formData.sourceType)
                  ?.label || "Select..."}
              </Badge>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                URL Status
              </Text>
              <Badge
                size="sm"
                variant="light"
                color={
                  formData.sourceUrl && isValidUrl(formData.sourceUrl)
                    ? "green"
                    : "gray"
                }
              >
                {formData.sourceUrl && isValidUrl(formData.sourceUrl)
                  ? "Valid URL"
                  : "Waiting..."}
              </Badge>
            </Box>

            <Box>
              <Text size="xs" c="dimmed">
                Validation Status
              </Text>
              <Badge
                size="sm"
                variant="light"
                color={Object.keys(errors).length === 0 ? "green" : "red"}
              >
                {Object.keys(errors).length === 0
                  ? "Ready"
                  : `${Object.keys(errors).length} error(s)`}
              </Badge>
            </Box>
          </Group>
        </Box>

        {/* Action buttons */}
        <Group justify="flex-end" gap="sm" pt="md">
          <Button
            variant="default"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cancel and close dialog"
            styles={{
              root: {
                backgroundColor: "transparent",
                borderColor: "#374151",
                color: "white",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            color="teal"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={Object.keys(errors).length > 0 && formData.title !== ""}
            leftSection={<Zap size={16} />}
            aria-label="Create signal and submit form"
          >
            Create Signal
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
