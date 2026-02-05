"use client";

import classes from "./Footer.module.css";
import { Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={classes.footer}>
      <div className={classes.container}>
        <div className={classes.main}>
          <div className={classes.brand}>
            <div className={classes.logo}>ClientPulse</div>
            <p className={classes.tagline}>
              Identifying market signals before they become mainstream.
            </p>
          </div>

          <div className={classes.links}>
            <div className={classes.column}>
              <h4>Product</h4>
              <a href="#">Triggers</a>
              <a href="#">Pricing</a>
              <a href="#">Changelog</a>
            </div>
            <div className={classes.column}>
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>

        <div className={classes.bottom}>
          <div className={classes.copyright}>
            <p>© {currentYear} ClientPulse. All rights reserved.</p>
            <span className={classes.location}>Lviv, Ukraine</span>
          </div>
          <div className={classes.socials}>
            <a href="#">
              <Twitter size={20} />
            </a>
            <a href="#">
              <Github size={20} />
            </a>
            <a href="#">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
