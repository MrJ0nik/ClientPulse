"use client";
import Header from "../shared/components/header/Header";
import classes from "./page.module.css";

import { Button, UnstyledButton } from "@mantine/core";
import FeaturesGrid from "../shared/components/FeaturesGrid/FeaturesGrid";
import BentoGrid from "../shared/components/BentoGrid/BentoGrid";
import Pricing from "../shared/components/Pricing/Pricing";
import Footer from "../shared/components/Footer/Footer";

export default function HomePage() {
  return (
    <div className={classes.container}>
      <div className={classes.backgroundGlow} />
      <Header />
      <div className={classes.mainBlock}>
        <h1 className={classes.slogan}>
          Supercharge Your B2B Growth with AI-Powered Signals
        </h1>
        <p className={classes.secondaryText}>
          Uncover hidden oportunities, rack key decision-makers, and close deals
          faster.
        </p>
        <UnstyledButton className={classes.Button}>
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
