// import "@/src/app/globals.css";

// export default function HomeLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <div className="specific-home-style">{children}</div>;
// }

// src/app/(private)/Home/layout.tsx

import Header from "./Home/homeComponents/Header/Header";
import HomeWrapper from "./Home/HomeWrapper";
import styles from "./layout.module.css";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <Header />
      <HomeWrapper>{children}</HomeWrapper>
    </div>
  );
}
