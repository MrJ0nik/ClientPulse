"use client";
import { useState } from "react";
import { Group } from "@mantine/core";
import NavBar from "./homeComponents/NavBar/NavBar";
import { TabName } from "@/src/app/shared/constants/types";

export default function HomeWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<TabName>("Accounts");

  return (
    <Group align="flex-start" gap={0} wrap="nowrap" style={{ width: "100%" }}>
      <NavBar active={activeTab} setActive={setActiveTab} />
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </Group>
  );
}
