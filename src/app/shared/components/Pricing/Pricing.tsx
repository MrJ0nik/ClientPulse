"use client";

import classes from "./Pricing.module.css";
import { Check } from "lucide-react";
import { useIntersection } from "@mantine/hooks";
import { useState, useEffect } from "react";

const plans = [
  {
    name: "Starter",
    price: "0",
    desc: "For individuals exploring market signals.",
    features: ["50 leads per month", "Basic buying triggers", "Email support"],
    button: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "49",
    desc: "For growth teams scaling their outreach.",
    features: [
      "Unlimited leads",
      "Advanced AI signals",
      "Priority support",
      "CRM Integrations",
    ],
    button: "Go Pro",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "Custom solutions for large organizations.",
    features: [
      "Dedicated manager",
      "Custom AI models",
      "SSO & Security",
      "API Access",
    ],
    button: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const { ref, entry } = useIntersection({
    threshold: 0.1, // Зменшили до 10%, щоб спрацьовувало легше
  });

  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    // Якщо елемент перетнув межу і ми ще не запускали анімацію
    if (entry?.isIntersecting && !animated) {
      const frame = requestAnimationFrame(() => {
        setAnimated(true);
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [entry?.isIntersecting, animated]);

  return (
    <section className={classes.section} ref={ref}>
      <div className={`${classes.heading} ${animated ? classes.visible : ""}`}>
        <h2 className={classes.title}>Ready to grow?</h2>
        <p className={classes.subtitle}>
          Choose the plan that fits your current stage.
        </p>
      </div>

      <div className={classes.grid}>
        {plans.map((plan, index) => {
          const delayClass =
            index === 0
              ? classes.delay1
              : index === 1
                ? classes.delay2
                : classes.delay3;

          return (
            <div
              key={index}
              className={`${classes.card} ${plan.popular ? classes.popular : ""} ${delayClass} ${animated ? classes.visible : ""}`}
            >
              {plan.popular && (
                <div className={classes.badge}>Most Popular</div>
              )}

              <div className={classes.header}>
                <h3 className={classes.name}>{plan.name}</h3>
                <div className={classes.priceContainer}>
                  {plan.price !== "Custom" && (
                    <span className={classes.currency}>$</span>
                  )}
                  <span className={classes.price}>{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className={classes.period}>/mo</span>
                  )}
                </div>
                <p className={classes.desc}>{plan.desc}</p>
              </div>

              <div className={classes.features}>
                {plan.features.map((feat, i) => (
                  <div key={i} className={classes.feature}>
                    <Check size={18} className={classes.check} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              <button
                className={`${classes.btn} ${plan.popular ? classes.btnGradient : ""}`}
              >
                {plan.button}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
