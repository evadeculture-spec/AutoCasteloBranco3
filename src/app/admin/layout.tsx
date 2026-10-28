import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Backoffice", template: "%s · Backoffice AutoCasteloBranco" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-bg">{children}</div>;
}
