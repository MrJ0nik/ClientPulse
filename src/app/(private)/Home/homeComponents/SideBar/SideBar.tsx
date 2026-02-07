'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './SideBar.module.css';
import { Stack, NavLink } from '@mantine/core';

import { signOut } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';

import DashboardIcon from '@/src/app/shared/components/icons/DashboardIcon';
import AccountsIcon from '@/src/app/shared/components/icons/AccountsIcon';
import SettingsIcon from '@/src/app/shared/components/icons/SettingsIcon';

import { UserMenu } from '../UserMenu/UserMenu';

export interface NavIconProps {
  isActive?: boolean;
  className?: string;
}

type TabName = 'Dashboard' | 'Accounts' | 'Settings';

interface SideBarItem {
  label: TabName;
  icon: React.ComponentType<NavIconProps>;
  href: string;
}

const mainNavItems: SideBarItem[] = [
  { label: 'Dashboard', icon: DashboardIcon, href: '/home' },
  { label: 'Accounts', icon: AccountsIcon, href: '/accounts' },
];

export default function SideBar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';

      //eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`LogOut Error: ${error.message}`);
    }
  };

  function renderLink(
    label: TabName,
    IconComponent: React.ComponentType<NavIconProps>,
    href: string
  ) {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <NavLink
        key={label}
        label={label}
        component={Link}
        href={href}
        leftSection={<IconComponent isActive={isActive} />}
        active={isActive}
        variant="filled"
        classNames={{ root: styles.navLink, label: styles.navLabel }}
      />
    );
  }

  return (
    <nav className={styles.sidebar}>
      <Stack className={styles.sidebarMain} justify="space-between">
        <Stack gap={4}>
          {mainNavItems.map((item) =>
            renderLink(item.label, item.icon, item.href)
          )}
        </Stack>

        {renderLink('Settings', SettingsIcon, '/settings')}
      </Stack>

      <div className={styles.footer}>
        <UserMenu onLogout={handleLogout} />
      </div>
    </nav>
  );
}
