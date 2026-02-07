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

import HomeWrapper from './home/HomeWrapper';
import styles from './layout.module.css';
import '@/src/app/globals.css';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className={styles.layout}>
        <HomeWrapper>{children}</HomeWrapper>
      </div>
    </ProtectedRoute>
  );
}
