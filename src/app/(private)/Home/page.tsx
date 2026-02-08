"use client";
import styles from "./page.module.css";
import { useMemo, useState, useEffect } from "react";

import { AppShell, Container, Grid, Loader, Center, Stack, Button, Group } from "@mantine/core";
import { Plus, Sparkles } from "lucide-react";
import { StatsGrid } from "./_components/StatsGrid/StatsGrid";
import { SignalFeed } from "./_components/SignalFeed/SignalFeed";
import { OpportunitiesList } from "./_components/OpportunitiesList/OpportunitiesList";
import { CreateSignalModal } from "./_components/CreateSignalModal/CreateSignalModal";
import { opportunitiesAPI } from "@/src/lib/opportunitiesAPI";
import { signalsAPI } from "@/src/lib/signalsAPI";
import mockData from "./_mockData/signals.json";

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createSignalOpened, setCreateSignalOpened] = useState(false);
  const [creatingSignal, setCreatingSignal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch opportunities
        console.log("📊 Fetching opportunities...");
        const oppResponse = await opportunitiesAPI.list(10, 0);
        console.log("✓ Opportunities loaded:", oppResponse);
        console.log("  Total:", oppResponse.total);
        console.log("  Count:", oppResponse.opportunities?.length || 0);
        setOpportunities(oppResponse.opportunities || []);
        
        // Fetch signals
        console.log("📡 Fetching signals...");
        const sigResponse = await signalsAPI.list(50, 0);
        console.log("✓ Signals loaded:", sigResponse);
        console.log("  Total:", sigResponse.total);
        console.log("  Count:", sigResponse.signals?.length || 0);
        setSignals(sigResponse.signals || []);
      } catch (err) {
        console.error("❌ Failed to fetch data:", err);
        setError("Failed to load data");
        setOpportunities([]);
        setSignals(mockData);  // Fallback to mock signals
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateSignal = async (formData: any) => {
    setCreatingSignal(true);
    try {
      // Call API to create signal
      const response = await signalsAPI.create({
        account_id: "acc-techcorp", // TODO: get from context
        title: formData.title,
        source_url: formData.sourceUrl,
        source_type: formData.sourceType,
        description: formData.context,
      });
      
      console.log("✓ Signal created:", response);
      
      // Refresh signals list
      const sigResponse = await signalsAPI.list(50, 0);
      setSignals(sigResponse.signals || []);
    } finally {
      setCreatingSignal(false);
    }
  };

  return (
    <AppShell
      padding="md"
      style={{ backgroundColor: "#0f111a", minHeight: "100vh", color: "white" }}
    >
      <CreateSignalModal
        opened={createSignalOpened}
        onClose={() => setCreateSignalOpened(false)}
        onSubmit={handleCreateSignal}
      />

      <Container size="xl">
        <Group justify="space-between" align="center" mb="xl">
          <div>
            {/* Title area - can add app title here if needed */}
          </div>
          <Button
            color="teal"
            leftSection={<Plus size={18} />}
            onClick={() => setCreateSignalOpened(true)}
          >
            Create Signal
          </Button>
        </Group>

        <StatsGrid />

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <SignalFeed signals={signals} loading={loading} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <OpportunitiesList data={opportunities} loading={loading} />
          </Grid.Col>
        </Grid>
      </Container>
    </AppShell>
  );
}
