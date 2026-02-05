"use client";

import { Button, UnstyledButton } from "@mantine/core";
import classes from "./header.module.css";

export default function Header() {
  return (
    <div className={classes.header}>
      <h1>ClientPulse</h1>
      <div className={classes.buttonsContainer}>
        <UnstyledButton className={classes.Button}>Sign In</UnstyledButton>
        <UnstyledButton className={classes.Button}>Log In</UnstyledButton>
      </div>
    </div>
  );
}
