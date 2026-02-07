'use client';
import { useState } from 'react';
import SideBar from './homeComponents/SideBar/SideBar';
import { TabName } from '@/src/app/shared/constants/types';

export default function HomeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabName>('Accounts');

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-midnight)',
      }}
    >
      <SideBar active={activeTab} setActive={setActiveTab} />

      <main
        style={{
          flex: 1,
          height: '100%',
          overflowY: 'auto',
          minWidth: 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
