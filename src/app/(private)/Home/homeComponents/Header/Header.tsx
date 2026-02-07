import RadarIcon from "@/src/app/shared/components/icons/RadarIcon/RadarIcon";
import styles from "./Header.module.css";
import { TextInput, ActionIcon, Avatar, Group, Indicator } from "@mantine/core";

import { Search, Bell, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <Group justify="space-between" className={styles.headerBox}>
      <div className={styles.radarBox}>
        <RadarIcon />
        <div className={styles.titles}>
          <h1 className={styles.title}>ClientPulse</h1>
          <p className={styles.subtitle}>The Strategic Growth Engine</p>
        </div>
      </div>

      <Group gap="lg" w="40%" justify="flex-end">
        <TextInput
          placeholder="Search"
          w="50%"
          radius="md"
          leftSection={
            <Search size={16} strokeWidth={1.5} className={styles.searchIcon} />
          }
          classNames={{
            input: styles.searchInput,
          }}
        />

        <Indicator color="red" size={8} offset={5} disabled={false}>
          <ActionIcon
            variant="transparent"
            size="lg"
            className={styles.actionBtn}
            aria-label="Notifications"
          >
            <Bell size={22} strokeWidth={1.5} />
          </ActionIcon>
        </Indicator>

        <Group gap={8} className={styles.userProfile}>
          <Avatar
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSyQyg9dnGWgOFS4xSvauR8Jbcn1ySCwYo0DQ&s"
            radius="xl"
            size="md"
            alt="User Name"
          />
          <ChevronDown size={16} className={styles.chevronIcon} />
        </Group>
      </Group>
    </Group>
  );
}
