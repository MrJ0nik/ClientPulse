"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Title, UnstyledButton } from "@mantine/core";
import classes from "./header.module.css";

const getSnapshot = () => {
  if (typeof document === "undefined") return false;
  return document.cookie.includes("access_token");
};

const getServerSnapshot = () => false;

export default function Header() {
  const router = useRouter();
  const isLoggedIn = useSyncExternalStore(
    () => () => {},
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    const hasToken = document.cookie.includes("access_token");
    if (hasToken && window.location.pathname === "/") {
      router.push("/Home");
    }
  }, [router]);

  return (
    <header className={classes.header}>
      <Link href="/" style={{ textDecoration: "none" }}>
        <Title order={3} c="white" style={{ cursor: "pointer" }}>
          ClientPulse
        </Title>
      </Link>

      <div className={classes.buttonsContainer}>
        {isLoggedIn ? (
          <Button
            component={Link}
            href="/Home"
            variant="gradient"
            gradient={{ from: "teal", to: "blue", deg: 90 }}
          >
            Dashboard
          </Button>
        ) : (
          <>
            <UnstyledButton
              component={Link}
              href="/login"
              className={classes.Button}
              c="white"
            >
              Log in
            </UnstyledButton>

            <Button
              component={Link}
              href="/register"
              variant="filled"
              color="teal"
              radius="xl"
              style={{ background: "#40c281" }}
            >
              Sign up
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
