"use client";
import { useState } from "react";
import styles from "./NavBar.module.css";
import {
  Stack,
  NavLink,
  Group,
  Avatar,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { NavItem, TabName } from "@/src/app/shared/constants/types";

const navItems: NavItem[] = [
  { label: "Dashboard", icon: DashboardIcon },
  { label: "Accounts", icon: CompanyIcon },
  { label: "Timeline", icon: TimelineIcon },
  { label: "Decision Makers", icon: DecisionMakersIcon },
  { label: "Marketplace", icon: MarketPlaceIcon },
  { label: "Team", icon: TeamIcon },
  { label: "Market", icon: MarketIcon },
];

import DashboardIcon from "@/src/app/shared/components/icons/DashboardIcon";
import CompanyIcon from "@/src/app/shared/components/icons/CompanyIcon";
import TimelineIcon from "@/src/app/shared/components/icons/TimelineIcon";
import DecisionMakersIcon from "@/src/app/shared/components/icons/DecisionMakersIcon";
import MarketPlaceIcon from "@/src/app/shared/components/icons/MarketPlaceIcon";
import TeamIcon from "@/src/app/shared/components/icons/TeamIcon";
import MarketIcon from "@/src/app/shared/components/icons/MarketIcon";
import SettingsIcon from "@/src/app/shared/components/icons/SettingsIcon";

interface IconProps {
  isActive?: boolean;
}

interface NavBarProps {
  active: TabName;
  setActive: (val: TabName) => void;
}

export default function NavBar({ active, setActive }: NavBarProps) {
  function renderLink(
    label: TabName,
    IconComponent: React.ComponentType<IconProps>,
  ) {
    return (
      <NavLink
        key={label}
        label={label}
        leftSection={<IconComponent isActive={active === label} />}
        active={active === label}
        onClick={() => setActive(label)}
        variant="filled"
        classNames={{ root: styles.navLink, label: styles.navLabel }}
      />
    );
  }

  return (
    <nav className={styles.navbar}>
      <div>
        <Stack className={styles.navbarMain} justify="space-between">
          <Stack gap={4} h="100%">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                label={item.label}
                leftSection={<item.icon isActive={active === item.label} />}
                active={active === item.label}
                onClick={() => setActive(item.label)}
                variant="filled"
                classNames={{ root: styles.navLink, label: styles.navLabel }}
              />
            ))}
          </Stack>
          {renderLink("Settings", SettingsIcon)}
        </Stack>
      </div>

      <div className={styles.footer}>
        <UnstyledButton className={styles.userButton}>
          <Group>
            <Avatar
              src="https://krots.top/uploads/posts/2023-04/1681235133_krot-info-p-svit-foksi-instagram-2.jpg"
              radius="xl"
            />
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={500} c="white">
                ClientPulse
              </Text>
            </div>

            <ChevronRight
              size={25}
              strokeWidth={1.5}
              color="var(--text-secondary)"
            />
            <ChevronLeft
              size={25}
              strokeWidth={1.5}
              color="var(--text-secondary)"
            />
          </Group>
        </UnstyledButton>
      </div>
    </nav>
  );
}
