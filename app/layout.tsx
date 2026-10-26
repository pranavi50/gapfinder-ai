import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "GapFinder AI — Find your learning gaps",
  description: "Source-grounded diagnostics and adaptive revision planning."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}