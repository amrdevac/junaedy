import { Metadata } from "next";

import QuizPage from "@/components/quiz/QuizPage";

export const metadata: Metadata = {
  title: "Take a Quiz - Junaedy",
  description: "Latih kosakata Mandarin kamu dengan kuis dari koleksi pribadi.",
};

export default function QuizRoute() {
  return <QuizPage />;
}
