import ProtectedRoute from '../(auth)/_components/protectedRoute';
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
import "@/src/app/globals.css";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
        <div className={styles.layout}>
      <Header />
      <HomeWrapper>{children}</HomeWrapper>
    </div>
    </ProtectedRoute>
  );
}
