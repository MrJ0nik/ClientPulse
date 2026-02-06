import "@/src/app/globals.css";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="specific-home-style">{children}</div>;
}
