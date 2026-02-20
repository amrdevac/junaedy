import { Metadata } from "next";

import QuizHistoryPage from "@/components/quiz/QuizHistoryPage";

export const metadata: Metadata = {
  title: "Quiz History - Junaedy",
  description: "Lihat riwayat hasil kuis Mandarin kamu.",
};

export default function QuizHistoryRoute() {
  return <QuizHistoryPage />;
}
