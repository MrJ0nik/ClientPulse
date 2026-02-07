import { Menu, UnstyledButton, Group, Avatar, Text } from '@mantine/core';
import { ChevronDown, LogOut, LayoutGrid, FileCheck, User } from 'lucide-react';
import { useState } from 'react';
import styles from './UserMenu.module.css';

interface UserMenuProps {
  onLogout: () => void;
}

export function UserMenu({ onLogout }: UserMenuProps) {
  const [opened, setOpened] = useState(false);

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="right-start"
      offset={15}
      width={220}
      withArrow
      transitionProps={{ transition: 'pop', duration: 200 }}
      styles={{
        arrow: {
          backgroundColor: 'var(--bg-midnight)',
          borderColor: 'var(--border-color)',
        },
      }}
    >
      <Menu.Target>
        <UnstyledButton className={styles.userButton} data-expanded={opened}>
          <Group gap="sm" wrap="nowrap">
            <Avatar
              src="https://t3.ftcdn.net/jpg/02/43/12/34/360_F_243123463_zTooub557xEWABDLk0jJklDyLSGl2jrr.jpg"
              radius="xl"
              size="md"
            />

            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} c="white" truncate>
                ClientPulse
              </Text>
            </div>

            <div className={styles.iconContainer}>
              <ChevronDown
                size={18}
                className={`${styles.chevron} ${opened ? styles.rotate : ''}`}
              />
            </div>
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown className={styles.menuDropdown}>
        <Menu.Item
          color="var(--text-secondary)"
          leftSection={<LayoutGrid size={16} />}
          onClick={onLogout}
        >
          Workspaces
        </Menu.Item>
        <Menu.Item
          color="var(--text-secondary)"
          leftSection={<FileCheck size={16} />}
          onClick={onLogout}
        >
          Tasks
        </Menu.Item>
        <Menu.Item
          color="var(--text-secondary)"
          leftSection={<User size={16} />}
          onClick={onLogout}
        >
          Account
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<LogOut size={16} />}
          onClick={onLogout}
        >
          Logout
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
