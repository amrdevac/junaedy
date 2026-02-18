import { Metadata } from "next";
import DashboardPage from "@/components/dashboard/DashboardPage";

export const metadata: Metadata = {
  title: "Junaedy Dashboard",
  description: "Mandarin study dashboard for the Junaedy app.",
};

export default function Home() {
  return <DashboardPage />;
}
