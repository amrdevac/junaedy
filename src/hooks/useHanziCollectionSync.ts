"use client";

import { useCallback, useEffect } from "react";

import useDashboardStore from "@/store/useDashboardStore";
import { getAllHanziRecords, getAllQuizHistory } from "@/lib/indexeddb/hanziCollection";

type ProficiencyMeta = {
  label: string;
  percent: number;
  tone: "success" | "warning" | "info";
};

const PROFICIENCY_META: Record<string, ProficiencyMeta> = {
  baru: { label: "Baru", percent: 25, tone: "info" },
  belajar: { label: "Belajar", percent: 55, tone: "warning" },
  mahir: { label: "Mahir", percent: 90, tone: "success" },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function useHanziCollectionSync() {
  const setCharacters = useDashboardStore((state) => state.setCharacters);
  const setStatValue = useDashboardStore((state) => state.setStatValue);
  const setStatCaption = useDashboardStore((state) => state.setStatCaption);

  const refresh = useCallback(
    async function () {
      const records = await getAllHanziRecords();
      const quizHistory = await getAllQuizHistory();
      const sorted = records.slice().sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      const mapped = sorted.map(function (record) {
        const meta = PROFICIENCY_META[record.proficiency] || PROFICIENCY_META.baru;

        return {
          id: record.id,
          hanzi: record.hanzi,
          pinyin: record.pinyin || "-",
          meaning: record.meaning || "-",
          proficiencyLabel: meta.label,
          proficiencyPercent: meta.percent,
          proficiencyTone: meta.tone,
          lastReviewed: formatDate(record.createdAt),
          type: record.type,
        };
      });

      setCharacters(mapped);
      setStatValue("total-vocab", records.length.toString());
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      const mondayOffset = (startOfWeek.getDay() + 6) % 7;
      startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);
      const weeklyCount = records.filter(function (record) {
        const createdAt = new Date(record.createdAt);
        return createdAt >= startOfWeek;
      }).length;
      const cappedWeekly = Math.min(weeklyCount, 99);
      setStatCaption("total-vocab", `+${cappedWeekly} WEEK`);

      if (quizHistory.length > 0) {
        const totalCorrect = quizHistory.reduce(function (sum, item) {
          return sum + item.correctCount;
        }, 0);
        const totalQuestions = quizHistory.reduce(function (sum, item) {
          return sum + item.totalQuestions;
        }, 0);
        const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        const scoreOutOf100 = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        setStatValue("accuracy", `${overallAccuracy}%`);
        setStatCaption("accuracy", `${quizHistory.length} QUIZZES`);
        setStatValue("quiz-score", `${scoreOutOf100}/100`);
        setStatCaption("quiz-score", "AVG SCORE");
      } else {
        setStatValue("accuracy", "0%");
        setStatCaption("accuracy", "NO QUIZ");
        setStatValue("quiz-score", "0/100");
        setStatCaption("quiz-score", "AVG SCORE");
      }
    },
    [setCharacters, setStatValue, setStatCaption]
  );

  useEffect(
    function () {
      refresh();
    },
    [refresh]
  );

  return { refresh };
}

export default useHanziCollectionSync;
