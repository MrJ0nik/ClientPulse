"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../shared/components/header/Header";
import classes from "./page.module.css";
import { UnstyledButton } from "@mantine/core";
import FeaturesGrid from "../shared/components/FeaturesGrid/FeaturesGrid";
import BentoGrid from "../shared/components/BentoGrid/BentoGrid";
import Pricing from "../shared/components/Pricing/Pricing";
import Footer from "../shared/components/Footer/Footer";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (
      typeof document !== "undefined" &&
      document.cookie.includes("access_token")
    ) {
      router.push("/Home");
    }
  }, [router]);

  return (
    <div className={classes.container}>
      <div className={classes.backgroundGlow} />

      <Header />

      <div className={classes.mainBlock}>
        <h1 className={classes.slogan}>
          Supercharge Your B2B Growth with AI-Powered Signals
        </h1>

        <p className={classes.secondaryText}>
          Uncover hidden <strong>opportunities</strong>, <strong>track</strong>{" "}
          key decision-makers, and close deals faster.
        </p>

        <UnstyledButton
          className={classes.Button}
          component={Link}
          href="/register"
        >
          Sign Up for Free
        </UnstyledButton>

        <FeaturesGrid />
        <BentoGrid />
        <Pricing />
      </div>

      <Footer />
    </div>
  );
}
