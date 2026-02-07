'use client';
import { AppShell, Container, Grid } from '@mantine/core';
import { StatsGrid } from './_components/StatsGrid/StatsGrid';
import { SignalFeed } from './_components/SignalFeed/SignalFeed';
import { OpportunitiesList } from './_components/OpportunitiesList/OpportunitiesList';
import mockData from './_mockData/signals.json';
import mockOpportunities from './_mockData/letters.json';

export default function Dashboard() {
  return (
    <AppShell
      padding="md"
      style={{ backgroundColor: '#0f111a', minHeight: '100vh' }}
    >
      <Container size="xl">
        <StatsGrid />
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 8 }}>
            <SignalFeed signals={mockData} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <OpportunitiesList data={mockOpportunities} />
          </Grid.Col>
        </Grid>
      </Container>
    </AppShell>
  );
}
