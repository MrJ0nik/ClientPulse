"use client";

import { SimpleGrid } from "@mantine/core";
import { useIntersection } from "@mantine/hooks";
import { Activity, Users, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import classes from "./FeaturesGrid.module.css";

const features = [
  {
    icon: Activity,
    title: "Real-time Signal Feed",
    description:
      "Streamlined chains of real-time feed and consistent real-time signal feed status monitoring.",
  },
  {
    icon: Users,
    title: "Decision Maker Intel",
    description:
      "Cold profits signaling analysis, their activity and actionable Decision Maker Intel.",
  },
  {
    icon: Share2,
    title: "Seamless Integrations",
    description:
      "Enhance your technical integrations to operations with seamless API connections.",
  },
];

export default function FeaturesGrid() {
  const { ref, entry } = useIntersection({
    threshold: 0.2,
  });

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (entry?.isIntersecting && !animated) {
      const timer = setTimeout(() => {
        setAnimated(true);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [entry?.isIntersecting, animated]);

  return (
    <div className={classes.gridContainer} ref={ref}>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`${classes.card} ${animated ? classes.visible : ""}`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <div className={classes.iconBox}>
              <feature.icon
                className={classes.icon}
                size={28}
                strokeWidth={1.5}
              />
            </div>
            <h3 className={classes.title}>{feature.title}</h3>
            <p className={classes.description}>{feature.description}</p>
          </div>
        ))}
      </SimpleGrid>
    </div>
  );
}
