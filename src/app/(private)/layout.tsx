import ProtectedRoute from '../(auth)/_components/protectedRoute';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="specific-home-style">{children}</div>
    </ProtectedRoute>
  );
}
