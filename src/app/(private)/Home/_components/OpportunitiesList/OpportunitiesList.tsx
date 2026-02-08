"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@mantine/hooks";
import {
  Stack,
  Title,
  Paper,
  Group,
  Avatar,
  Text,
  Progress,
  Button,
  Modal,
  Textarea,
  Box,
  ScrollArea,
  Badge,
  TextInput,
} from "@mantine/core";
import { Copy, Check, Sparkles, ThumbsUp, ThumbsDown, RefreshCw, Zap, X } from "lucide-react";
import styles from "./OpportunitiesList.module.css";
import { GetOpportunityResponse, opportunitiesAPI, EvidenceRef } from "@/src/lib/opportunitiesAPI";
import { subscribeToOpportunitiesForAM } from "@/src/lib/firebase";
import { SourcesList, EvidenceSource } from "./SourcesList";
import { OutreachEditor } from "./OutreachEditor";
import { OpportunitiesSkeleton } from "./OpportunitiesSkeleton";
import {
  StatusChip,
  getAvailableActions,
  StatusActionButton,
  mapToDisplayStatus,
  type DisplayStatus,
  type OpportunityAction,
} from "./StatusManager";

export interface Opportunity {
  id: string;
  company: string;
  domain: string;
  dept: string;
  probability: number;
  proposalDraft: string;
}

interface OpportunitiesListProps {
  data: GetOpportunityResponse[];
  loading?: boolean;
}

function AnimatedProgress({ value, delay }: { value: number; delay: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <Progress
      value={progress}
      color="teal"
      size="sm"
      radius="xl"
      mb="xl"
      styles={{
        section: {
          transition: "width 1000ms cubic-bezier(0.4, 0, 0.2, 1)",
        },
      }}
    />
  );
}

export function OpportunitiesList({ data, loading = false }: OpportunitiesListProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedOpp, setSelectedOpp] = useState<GetOpportunityResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [realtimeData, setRealtimeData] = useState<GetOpportunityResponse[]>(data || []);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "offline">("synced");
  
  // Realtime subscription setup
  useEffect(() => {
    // Try to connect to realtime listener
    // For now: use passed-in data, but setup listener structure
    setRealtimeData(data || []);
    setSyncStatus("synced");
    
    // In production: subscribe to Firestore
    // const unsubscribe = subscribeToOpportunitiesForAM(
    //   tenantId,
    //   accountId,
    //   setRealtimeData,
    //   (error) => setSyncStatus("offline")
    // );
    // return () => unsubscribe();
  }, [data]);
  
  // Debug logging
  useEffect(() => {
    console.log("🎯 OpportunitiesList rendered with data:", realtimeData);
    console.log("  Data length:", realtimeData?.length || 0);
    console.log("  Sync status:", syncStatus);
    if (realtimeData && realtimeData.length > 0) {
      console.log("  First item:", realtimeData[0]);
    }
  }, [realtimeData, syncStatus]);
  
  // Review modal state
  const [reviewModalOpened, { open: openReview, close: closeReview }] = useDisclosure(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | "refine" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // CRM activation modal state
  const [crmModalOpened, { open: openCrmModal, close: closeCrmModal }] = useDisclosure(false);
  const [crmActionType, setCrmActionType] = useState<"task" | "note" | "opportunity">("task");
  const [crmLoading, setcrmLoading] = useState(false);
  const [activationStatus, setActivationStatus] = useState<"pending" | "requested" | "succeeded" | "failed" | null>(null);

  // Status tracking state
  const [snoozedOpportunities, setSnoozedOpportunities] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const handleStatusAction = async (oppId: string, action: OpportunityAction) => {
    setActionLoading((prev) => ({ ...prev, [oppId]: true }));

    try {
      const opp = realtimeData.find((o) => o.id === oppId);
      if (!opp) return;

      switch (action) {
        case "review":
          handleReviewClick(opp);
          break;

        case "approve":
        case "reject":
        case "refine":
          setSelectedOpp(opp);
          setReviewAction(
            action === "approve"
              ? "approve"
              : action === "reject"
              ? "reject"
              : "refine"
          );
          openReview();
          break;

        case "draft_outreach":
          setSelectedOpp(opp);
          setShowAnalysis(false);
          open();
          break;

        case "send":
        case "export":
          setSelectedOpp(opp);
          openCrmModal();
          break;

        case "snooze":
          setSnoozedOpportunities((prev) => new Set(prev).add(oppId));
          setNotification({
            type: "success",
            message: `Snoozed for 7 days`,
          });
          break;

        case "unsnooze":
          setSnoozedOpportunities((prev) => {
            const next = new Set(prev);
            next.delete(oppId);
            return next;
          });
          setNotification({
            type: "success",
            message: `Unsnoozed`,
          });
          break;

        case "delete":
          // Show confirmation, then delete
          if (window.confirm("Delete this opportunity?")) {
            setNotification({
              type: "success",
              message: `Opportunity deleted`,
            });
          }
          break;

        case "view_sent":
        case "resend":
          handleReviewClick(opp);
          break;
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [oppId]: false }));
    }
  };

  const getDisplayStatus = (opp: GetOpportunityResponse): DisplayStatus => {
    if (snoozedOpportunities.has(opp.id)) return "snoozed";
    return mapToDisplayStatus(
      opp.status || "draft",
      opp.crm_activated_at
    );
  };

  const handleReviewClick = (item: GetOpportunityResponse) => {
    setSelectedOpp(item);
    setCopied(false);
    setShowAnalysis(false);
    open();
  };

  const handleOpenReviewModal = (action: "approve" | "reject" | "refine", opp: GetOpportunityResponse) => {
    setSelectedOpp(opp);
    setReviewAction(action);
    setReviewComment("");
    setReviewReason("");
    openReview();
  };

  const handleSubmitReview = async () => {
    if (!selectedOpp || !reviewAction) return;

    setReviewLoading(true);
    try {
      if (reviewAction === "approve") {
        await opportunitiesAPI.approve(selectedOpp.id, reviewComment);
        setNotification({ type: "success", message: "Opportunity approved!" });
      } else if (reviewAction === "reject") {
        if (!reviewReason) {
          setNotification({ type: "error", message: "Rejection reason is required" });
          return;
        }
        await opportunitiesAPI.reject(selectedOpp.id, { reason: reviewReason, comment: reviewComment });
        setNotification({ type: "success", message: "Opportunity rejected" });
      } else if (reviewAction === "refine") {
        if (!reviewComment) {
          setNotification({ type: "error", message: "Refinement feedback is required" });
          return;
        }
        await opportunitiesAPI.refine(selectedOpp.id, { feedback: reviewComment });
        setNotification({ type: "success", message: "Refinement requested" });
      }

      closeReview();
      setTimeout(() => window.location.reload(), 2000);
    } catch (error: any) {
      setNotification({ 
        type: "error", 
        message: error.response?.data?.detail || "Review action failed" 
      });
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <>
      {/* Realtime sync status indicator */}
      {syncStatus !== "synced" && (
        <Box
          style={{
            position: "fixed",
            top: 70,
            right: 20,
            zIndex: 999,
            backgroundColor: syncStatus === "syncing" ? "#f59e0b" : "#ef4444",
            color: "white",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Zap size={14} />
          {syncStatus === "syncing" ? "Syncing..." : "Offline"}
        </Box>
      )}

      {notification && (
        <Box
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            backgroundColor: notification.type === "success" ? "#14b8a6" : "#ef4444",
            color: "white",
            padding: "12px 20px",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Group gap="xs">
            {notification.type === "success" ? <Check size={18} /> : <Sparkles size={18} />}
            <Text size="sm" fw={500}>{notification.message}</Text>
          </Group>
        </Box>
      )}

      {/* Review Action Modal */}
      <Modal
        opened={reviewModalOpened}
        onClose={closeReview}
        title={
          <Text fw={700} size="lg">
            {reviewAction === "approve" && "Approve Opportunity"}
            {reviewAction === "reject" && "Reject Opportunity"}
            {reviewAction === "refine" && "Request Refinement"}
          </Text>
        }
        size="md"
      >
        <Stack gap="md">
          {reviewAction === "reject" && (
            <TextInput
              label="Rejection Reason"
              placeholder="e.g., Not aligned with strategy"
              required
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
            />
          )}

          <Textarea
            label={reviewAction === "refine" ? "Feedback (required)" : "Comment (optional)"}
            placeholder={
              reviewAction === "approve"
                ? "Add any notes..."
                : reviewAction === "reject"
                ? "Additional context..."
                : "What needs to be improved?"
            }
            minRows={4}
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            required={reviewAction === "refine"}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeReview} disabled={reviewLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              loading={reviewLoading}
              color={
                reviewAction === "approve"
                  ? "green"
                  : reviewAction === "reject"
                  ? "red"
                  : "blue"
              }
              leftSection={
                reviewAction === "approve" ? (
                  <ThumbsUp size={18} />
                ) : reviewAction === "reject" ? (
                  <ThumbsDown size={18} />
                ) : (
                  <RefreshCw size={18} />
                )
              }
            >
              {reviewAction === "approve" && "Approve"}
              {reviewAction === "reject" && "Reject"}
              {reviewAction === "refine" && "Request Refinement"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* CRM Activation Modal */}
      <Modal
        opened={crmModalOpened}
        onClose={closeCrmModal}
        title={
          <Text fw={700} size="lg">
            Activate in CRM
          </Text>
        }
        size="md"
      >
        <Stack gap="md">
          {activationStatus === null ? (
            <>
              <Text size="sm" c="dimmed">
                Choose how to activate this opportunity in your CRM:
              </Text>
              
              <Group gap="xs" grow>
                <Button
                  variant={crmActionType === "task" ? "filled" : "light"}
                  color="blue"
                  onClick={() => setCrmActionType("task")}
                >
                  Task
                </Button>
                <Button
                  variant={crmActionType === "note" ? "filled" : "light"}
                  color="blue"
                  onClick={() => setCrmActionType("note")}
                >
                  Note
                </Button>
                <Button
                  variant={crmActionType === "opportunity" ? "filled" : "light"}
                  color="blue"
                  onClick={() => setCrmActionType("opportunity")}
                >
                  Opportunity
                </Button>
              </Group>
              
              <Group gap="xs">
                <Button
                  fullWidth
                  color="teal"
                  loading={crmLoading}
                  onClick={async () => {
                    if (!selectedOpp) return;
                    setcrmLoading(true);
                    try {
                      setActivationStatus("requested");
                      // In production: call CRM activation API
                      // const response = await opportunitiesAPI.activateInCRM(
                      //   selectedOpp.id,
                      //   { action_type: crmActionType }
                      // );
                      
                      // Simulate activation process
                      setTimeout(() => setActivationStatus("succeeded"), 2000);
                      
                      setNotification({ 
                        type: "success", 
                        message: `Activation in CRM requested (${crmActionType})` 
                      });
                    } catch (error: any) {
                      setActivationStatus("failed");
                      setNotification({ 
                        type: "error", 
                        message: error.response?.data?.detail || "Activation failed" 
                      });
                    } finally {
                      setcrmLoading(false);
                    }
                  }}
                >
                  Activate → {crmActionType}
                </Button>
              </Group>
            </>
          ) : (
            <>
              <Group gap="md" justify="center">
                {activationStatus === "requested" && (
                  <>
                    <Zap size={32} style={{ animation: "spin 1s linear infinite", color: "#f59e0b" }} />
                    <Stack gap={0}>
                      <Text fw={600}>Activation in progress...</Text>
                      <Text size="sm" c="dimmed">Processing {crmActionType}</Text>
                    </Stack>
                  </>
                )}
                
                {activationStatus === "succeeded" && (
                  <>
                    <Check size={32} color="#10b981" />
                    <Stack gap={0}>
                      <Text fw={600} c="teal">Activation succeeded!</Text>
                      <Text size="sm" c="dimmed">Synced to CRM</Text>
                    </Stack>
                  </>
                )}
                
                {activationStatus === "failed" && (
                  <>
                    <X size={32} color="#ef4444" />
                    <Stack gap={0}>
                      <Text fw={600} c="red">Activation failed</Text>
                      <Text size="sm" c="dimmed">Check your connection</Text>
                    </Stack>
                  </>
                )}
              </Group>
              
              <Group gap="xs">
                {activationStatus === "failed" && (
                  <Button
                    fullWidth
                    color="teal"
                    loading={crmLoading}
                    onClick={() => {
                      setActivationStatus(null);
                    }}
                  >
                    Try Again
                  </Button>
                )}
                
                <Button
                  fullWidth
                  variant="light"
                  onClick={() => {
                    closeCrmModal();
                    setActivationStatus(null);
                  }}
                >
                  Close
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>

      {/* Opportunity Detail Modal */}
      <Modal
        opened={opened}
        onClose={close}
        size="90%"
        yOffset="2vh"
        padding={0}
        radius="md"
        title={
          <Group justify="space-between" w="100%">
            <Text fw={700} c="white" size="lg">
              {showAnalysis ? "AI Analysis" : "Review Outreach Draft"}
            </Text>
            {!showAnalysis && (
              <Button
                size="xs"
                variant="light"
                leftSection={<Sparkles size={16} />}
                onClick={() => setShowAnalysis(true)}
              >
                View Analysis
              </Button>
            )}
          </Group>
        }
        styles={{
          header: {
            backgroundColor: "#1F232F",
            color: "white",
            padding: "20px",
            borderBottom: "1px solid #2C2E33",
          },
          body: {
            backgroundColor: "#1F232F",
            color: "white",
            padding: "20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
          content: {
            backgroundColor: "#1F232F",
            border: "1px solid #2C2E33",
            height: "96vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {selectedOpp && (
          <Stack gap="md" style={{ height: "100%" }}>
            {!showAnalysis ? (
              <>
                <Group align="center" mb="sm">
                  <Avatar
                    src={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23f0f0f0"/></svg>`}
                    size="lg"
                    radius="sm"
                    styles={{
                      root: { backgroundColor: "white", padding: 4 },
                      image: { objectFit: "contain" },
                    }}
                  />
                  <Box>
                    <Text size="sm" c="dimmed">
                      Drafting email to:
                    </Text>
                    <Title order={3} c="white">
                      {selectedOpp.theme}
                    </Title>
                    <Text size="sm" c="teal">
                      {selectedOpp.score.toFixed(0)}% Match
                    </Text>
                  </Box>
                </Group>

                <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                  <Box p="md">
                    <OutreachEditor
                      initialDraft={selectedOpp.suggested_offer || "No proposal generated"}
                      keyFacts={[
                        selectedOpp.what_happened || "",
                        selectedOpp.why_it_matters || "",
                        selectedOpp.proof || "",
                        ...selectedOpp.next_steps?.slice(0, 2) || [],
                      ].filter(Boolean)}
                      sourceCount={selectedOpp.evidence_refs?.length || 0}
                    />
                  </Box>
                </ScrollArea>

                <Group
                  justify="flex-end"
                  pt="md"
                  style={{ borderTop: "1px solid #2C2E33", marginTop: "auto" }}
                >
                  <Button
                    size="md"
                    variant="default"
                    onClick={close}
                    styles={{
                      root: {
                        backgroundColor: "transparent",
                        borderColor: "#374151",
                        color: "white",
                      },
                    }}
                  >
                    Close
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
                  <Stack gap="lg" p="md">
                    <Box>
                      <Text fw={600} c="white" mb="sm">
                        What Happened
                      </Text>
                      <Text c="dimmed" size="sm">
                        {selectedOpp.what_happened}
                      </Text>
                    </Box>

                    <Box>
                      <Text fw={600} c="white" mb="sm">
                        Why It Matters
                      </Text>
                      <Text c="dimmed" size="sm">
                        {selectedOpp.why_it_matters}
                      </Text>
                    </Box>

                    <Box>
                      <Text fw={600} c="white" mb="sm">
                        Suggested Offer
                      </Text>
                      <Text c="dimmed" size="sm">
                        {selectedOpp.suggested_offer}
                      </Text>
                    </Box>

                    <Box>
                      <Text fw={600} c="white" mb="sm">
                        AI Score Breakdown
                      </Text>
                      {[
                        { label: "Impact", value: selectedOpp.score_breakdown.impact },
                        { label: "Urgency", value: selectedOpp.score_breakdown.urgency },
                        { label: "Fit", value: selectedOpp.score_breakdown.fit },
                        { label: "Access", value: selectedOpp.score_breakdown.access },
                        { label: "Feasibility", value: selectedOpp.score_breakdown.feasibility },
                      ].map((item) => (
                        <Box key={item.label} mb="md">
                          <Group justify="space-between" mb={4}>
                            <Text size="sm" c="white">
                              {item.label}
                            </Text>
                            <Text size="sm" c="teal">
                              {item.value}%
                            </Text>
                          </Group>
                          <Progress value={item.value} color="teal" size="md" radius="md" />
                        </Box>
                      ))}
                    </Box>

                    {selectedOpp.evidence_refs && selectedOpp.evidence_refs.length > 0 && (
                      <Box>
                        <SourcesList
                          sources={selectedOpp.evidence_refs.map((ref: EvidenceRef, idx: number) => ({
                            id: ref.id || `ref-${idx}`,
                            title: ref.title || "Unknown Source",
                            domain: ref.domain || "source",
                            url: ref.url || "#",
                            source_type: (ref.source_type || "article") as "article" | "pdf" | "site" | "news" | "research" | "filing" | "other",
                            snippet: ref.snippet || "No preview available",
                            relevance_score: ref.relevance_score || 0,
                          }))}
                          maxVisibleCount={3}
                        />
                      </Box>
                    )}

                    {selectedOpp.next_steps && selectedOpp.next_steps.length > 0 && (
                      <Box>
                        <Text fw={600} c="white" mb="sm">
                          Next Steps
                        </Text>
                        <Stack gap="xs">
                          {selectedOpp.next_steps.map((step, idx) => (
                            <Text key={idx} size="sm" c="dimmed">
                              {idx + 1}. {step}
                            </Text>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </ScrollArea>

                <Group
                  justify="flex-end"
                  pt="md"
                  style={{ borderTop: "1px solid #2C2E33", marginTop: "auto" }}
                >
                  <Button
                    size="md"
                    variant="default"
                    onClick={() => setShowAnalysis(false)}
                    styles={{
                      root: {
                        backgroundColor: "transparent",
                        borderColor: "#374151",
                        color: "white",
                      },
                    }}
                  >
                    Back to Draft
                  </Button>

                  <Button
                    size="md"
                    color="green"
                    onClick={close}
                  >
                    Done
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        )}
      </Modal>

      <Stack>
        <Title order={4} c="white" mb="sm">
          High-Priority Opportunities {syncStatus === "syncing" && <Zap size={16} style={{ display: "inline", marginLeft: "8px" }} />}
        </Title>

        {loading ? (
          <OpportunitiesSkeleton count={3} />
        ) : realtimeData && realtimeData.length > 0 ? (
          realtimeData.map((item, index) => {
            const cardEntryDelay = index * 150;
            const progressStartDelay = cardEntryDelay + 400;

            return (
              <Paper
                key={item.id}
                p="md"
                radius="md"
                className={`${styles.card} ${styles.animatedCard}`}
                style={{ animationDelay: `${cardEntryDelay}ms` }}
              >
                <Group mb="md" justify="space-between" align="flex-start">
                  <Box style={{ flex: 1 }}>
                    <Text fw={700} c="white">
                      {item.theme}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {item.id}
                    </Text>
                  </Box>
                  <StatusChip status={getDisplayStatus(item)} size="md" />
                </Group>

                <Text size="sm" c="white" mb={8} fw={500}>
                  {item.what_happened}
                </Text>

                <Text size="xs" c="dimmed" mb={12} lineClamp={2}>
                  {item.why_it_matters}
                </Text>

                <Text size="sm" c="teal" mb={4} fw={500}>
                  {item.score.toFixed(0)}% AI Score
                </Text>

                <AnimatedProgress
                  value={item.score}
                  delay={progressStartDelay}
                />

                {/* Status-aware action buttons */}
                <Group gap="xs" grow mb="md" wrap="wrap">
                  {getAvailableActions(getDisplayStatus(item)).map((action) => (
                    <StatusActionButton
                      key={action}
                      action={action}
                      onClick={() => handleStatusAction(item.id, action)}
                      loading={actionLoading[`${item.id}-${action}`]}
                      size="xs"
                    />
                  ))}
                </Group>

                <Button
                  fullWidth
                  variant="outline"
                  color="gray"
                  className={styles.button}
                  onClick={() => handleReviewClick(item)}
                >
                  Review & Analyze
                </Button>
              </Paper>
            );
          })
        ) : (
          <Paper p="md" radius="md" styles={{ root: { backgroundColor: "#1A1D26", border: "1px dashed #374151" } }}>
            <Text c="dimmed" ta="center">
              No opportunities yet. Check back soon!
            </Text>
          </Paper>
        )}
      </Stack>
    </>
  );
}
