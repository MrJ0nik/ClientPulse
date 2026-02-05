"use client";

import classes from "./BentoGrid.module.css";
import { useIntersection } from "@mantine/hooks";
import { useState, useEffect } from "react";

const ZapIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4ade80"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const TargetIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4ade80"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="2"></circle>
  </svg>
);

const GemIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4ade80"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12l4 6-10 13L2 9z"></path>
  </svg>
);

export default function BentoGrid() {
  const { ref, entry } = useIntersection({
    threshold: 0.2,
  });

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (entry?.isIntersecting && !animated) {
      // Використовуємо requestAnimationFrame, щоб уникнути синхронного каскадного рендеру
      const frame = requestAnimationFrame(() => {
        setAnimated(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [entry?.isIntersecting, animated]);

  return (
    <section className={classes.section} ref={ref}>
      <div
        className={`${classes.headingBlock} ${animated ? classes.visible : ""}`}
      >
        <h2 className={classes.title}>All the insights. One dashboard.</h2>
        <p className={classes.subtitle}>
          Stop switching between tabs. Get a unified view of your market
          signals, decision makers, and revenue opportunities.
        </p>
      </div>

      <div className={classes.grid}>
        <div
          className={`${classes.card} ${classes.largeItem} ${classes.gradient} ${classes.delay1} ${animated ? classes.visible : ""}`}
        >
          <div className={classes.cardContent}>
            <div className={classes.cardHeader}>
              <div className={classes.iconBox}>
                <ZapIcon />
              </div>
              <h3 className={classes.cardTitle}>Live Signal Feed</h3>
            </div>
            <p className={classes.cardDesc}>
              Our AI scans millions of data points to surface high-intent buying
              signals in real-time.
            </p>
          </div>
          <div className={classes.mockupContainer}>
            <div className={classes.mockupInner}></div>
          </div>
        </div>

        <div
          className={`${classes.card} ${classes.smallItem} ${classes.delay2} ${animated ? classes.visible : ""}`}
        >
          <div className={classes.cardHeader}>
            <div className={classes.iconBox}>
              <TargetIcon />
            </div>
            <h3 className={classes.gradientText}>Buying Triggers</h3>
          </div>
          <p className={classes.cardDesc}>
            Spot emerging leads and fresh market signals before your competitors
            do.
          </p>
        </div>

        <div
          className={`${classes.card} ${classes.smallItem} ${classes.delay3} ${animated ? classes.visible : ""}`}
        >
          <div className={classes.cardHeader}>
            <div className={classes.iconBox}>
              <GemIcon />
            </div>
            <h3 className={classes.gradientText}>Untapped Opportunities</h3>
          </div>
          <p className={classes.cardDesc}>
            Spot emerging leads and fresh market signals before your competitors
            do.
          </p>
        </div>
      </div>
    </section>
  );
}
