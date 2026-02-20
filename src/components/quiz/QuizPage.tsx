"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw, Settings } from "lucide-react";

import { addQuizHistory, getAllHanziRecords } from "@/lib/indexeddb/hanziCollection";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { Switch } from "@/components/ui/switch";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";

type QuizQuestion = {
  id: string;
  prompt: string;
  answer: string;
  pinyin?: string;
  direction: "hanzi-to-meaning" | "meaning-to-hanzi";
};

type QuizRecord = {
  hanzi: string;
  meaning: string;
  pinyin?: string;
  createdAt: string;
};

const DEFAULT_QUIZ_LIMIT = 10;
const QUIZ_OPTIONS = [5, 10, 20];
const NEW_WORD_DAYS = 2;
const REPLAY_STORAGE_KEY = "quiz-replay-config";
const QUIZ_MODES = [
  { value: "random", label: "Random" },
  { value: "hanzi-to-meaning", label: "Hanzi → Indo" },
  { value: "meaning-to-hanzi", label: "Indo → Hanzi" },
] as const;

type QuizMode = (typeof QUIZ_MODES)[number]["value"];

function shuffleList<T>(items: T[]) {
  const list = items.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
  return list;
}

function buildQuestions(
  records: QuizRecord[],
  limit: number,
  mode: QuizMode,
  excludeKeys?: Set<string>
) {
  const now = Date.now();
  const expanded = records.flatMap(function (record, index) {
    const createdAt = new Date(record.createdAt).getTime();
    const isNew = createdAt
      ? now - createdAt <= NEW_WORD_DAYS * 24 * 60 * 60 * 1000
      : false;
    const weight = isNew ? 3 : 1;

    const base = [
      mode === "meaning-to-hanzi"
        ? null
        : {
            id: `hanzi-${index}`,
            prompt: record.hanzi,
            answer: record.meaning,
            pinyin: record.pinyin,
            direction: "hanzi-to-meaning" as const,
          },
      mode === "hanzi-to-meaning"
        ? null
        : {
            id: `meaning-${index}`,
            prompt: record.meaning,
            answer: record.hanzi,
            pinyin: record.pinyin,
            direction: "meaning-to-hanzi" as const,
          },
    ].filter(Boolean) as QuizQuestion[];

    return Array.from({ length: weight }, () => base).flat();
  });
  const unique: QuizQuestion[] = [];
  const usedKeys = new Set<string>();
  const shuffled = shuffleList(expanded);
  shuffled.forEach(function (item) {
    const key = `${item.direction}:${item.prompt}`;
    if (excludeKeys?.has(key)) return;
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    unique.push(item);
  });
  return unique.slice(0, limit);
}

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `quiz-asked-${year}-${month}-${day}`;
}

function getAskedKeysForToday(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(getTodayKey());
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((item) => typeof item === "string"));
  } catch {
    return new Set();
  }
}

function saveAskedKeysForToday(keys: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getTodayKey(), JSON.stringify(Array.from(keys)));
}

function QuizPage() {
  const questionsState = useState<QuizQuestion[]>([]);
  const questions = questionsState[0];
  const setQuestions = questionsState[1];
  const currentIndexState = useState(0);
  const currentIndex = currentIndexState[0];
  const setCurrentIndex = currentIndexState[1];
  const answerState = useState("");
  const answer = answerState[0];
  const setAnswer = answerState[1];
  const showPinyinState = useState(false);
  const showPinyin = showPinyinState[0];
  const setShowPinyin = showPinyinState[1];
  const pinyinShownMapState = useState<Set<string>>(new Set());
  const pinyinShownMap = pinyinShownMapState[0];
  const setPinyinShownMap = pinyinShownMapState[1];
  const pinyinShownTotalState = useState(0);
  const pinyinShownTotal = pinyinShownTotalState[0];
  const setPinyinShownTotal = pinyinShownTotalState[1];
  const finalScoreState = useState<number | null>(null);
  const finalScore = finalScoreState[0];
  const setFinalScore = finalScoreState[1];
  const scoreState = useState(0);
  const score = scoreState[0];
  const setScore = scoreState[1];
  const answersState = useState<
    {
      id: string;
      prompt: string;
      answer: string;
      userAnswer: string;
      isCorrect: boolean;
      pinyinShown?: boolean;
      direction: "hanzi-to-meaning" | "meaning-to-hanzi";
    }[]
  >([]);
  const answers = answersState[0];
  const setAnswers = answersState[1];
  const durationState = useState(0);
  const durationMs = durationState[0];
  const setDurationMs = durationState[1];
  const startedAtState = useState<number | null>(null);
  const startedAt = startedAtState[0];
  const setStartedAt = startedAtState[1];
  const resultState = useState<null | boolean>(null);
  const result = resultState[0];
  const setResult = resultState[1];
  const isFinishedState = useState(false);
  const isFinished = isFinishedState[0];
  const setIsFinished = isFinishedState[1];
  const isLoadingState = useState(true);
  const isLoading = isLoadingState[0];
  const setIsLoading = isLoadingState[1];
  const recordsState = useState<QuizRecord[]>([]);
  const records = recordsState[0];
  const setRecords = recordsState[1];
  const questionCountState = useState(DEFAULT_QUIZ_LIMIT);
  const questionCount = questionCountState[0];
  const setQuestionCount = questionCountState[1];
  const quizModeState = useState<QuizMode>("random");
  const quizMode = quizModeState[0];
  const setQuizMode = quizModeState[1];
  const avoidRepeatState = useState(true);
  const avoidRepeatToday = avoidRepeatState[0];
  const setAvoidRepeatToday = avoidRepeatState[1];
  const stepState = useState<"config" | "quiz">("config");
  const step = stepState[0];
  const setStep = stepState[1];
  const configMessageState = useState<string | null>(null);
  const configMessage = configMessageState[0];
  const setConfigMessage = configMessageState[1];
  const confirmResetState = useState(false);
  const isConfirmResetOpen = confirmResetState[0];
  const setIsConfirmResetOpen = confirmResetState[1];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const replayAppliedRef = useRef(false);

  const getNextQuestions = (items: QuizRecord[], limit: number, mode: QuizMode) => {
    const excludeKeys = avoidRepeatToday ? getAskedKeysForToday() : undefined;
    return buildQuestions(items, limit, mode, excludeKeys);
  };

  const initQuiz = (items: QuizRecord[], limit: number, mode: QuizMode) => {
    const nextQuestions = getNextQuestions(items, limit, mode);
    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setAnswer("");
    setScore(0);
    setAnswers([]);
    setResult(null);
    setIsFinished(false);
    setStartedAt(Date.now());
    setDurationMs(0);
    setShowPinyin(false);
    setPinyinShownMap(new Set());
    setPinyinShownTotal(0);
    setFinalScore(null);
  };

  useEffect(function () {
    const loadQuiz = async () => {
      setIsLoading(true);
      const data = await getAllHanziRecords();
      const usable = data
        .filter(function (record) {
          return record.hanzi && record.meaning;
        })
        .map(function (record) {
          return {
            hanzi: record.hanzi,
            meaning: record.meaning,
            pinyin: record.pinyin,
            createdAt: record.createdAt,
          };
        });
      setRecords(usable);
      setIsLoading(false);
    };

    loadQuiz();
  }, []);

  useEffect(() => {
    if (isLoading || records.length === 0) return;
    if (replayAppliedRef.current) return;
    replayAppliedRef.current = true;
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        mode?: QuizMode;
        questionCount?: number;
        avoidRepeatToday?: boolean;
      };
      const nextMode = parsed.mode ?? "random";
      const nextCount = parsed.questionCount ?? DEFAULT_QUIZ_LIMIT;
      const nextAvoid = parsed.avoidRepeatToday ?? false;

      setQuizMode(nextMode);
      setQuestionCount(nextCount);
      setAvoidRepeatToday(nextAvoid);
      setConfigMessage(null);
      initQuiz(records, nextCount, nextMode);
      setStep("quiz");
    } catch {
      // ignore
    } finally {
      localStorage.removeItem(REPLAY_STORAGE_KEY);
    }
  }, [isLoading, records]);

  useEffect(
    function () {
      if (isLoading || isFinished || questions.length === 0) return;
      if (result !== null) return;
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
    [currentIndex, isLoading, isFinished, questions.length, result]
  );

  const currentQuestion = questions[currentIndex];

  const handleSubmit = () => {
    if (!currentQuestion) return;
    const normalizedAnswer = answer.trim();
    if (!normalizedAnswer) return;

    let isCorrect = false;
    if (currentQuestion.direction === "hanzi-to-meaning") {
      isCorrect =
        normalizedAnswer.toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    } else {
      isCorrect = normalizedAnswer === currentQuestion.answer.trim();
    }
    setResult(isCorrect);
    if (isCorrect) {
      setScore(score + 1);
    }
    const didShowPinyin = pinyinShownMap.has(currentQuestion.id);
    const updatedAnswers = [
      ...answers,
      {
        id: currentQuestion.id,
        prompt: currentQuestion.prompt,
        answer: currentQuestion.answer,
        userAnswer: normalizedAnswer,
        isCorrect,
        pinyinShown: didShowPinyin,
        direction: currentQuestion.direction,
      },
    ];
    setAnswers(updatedAnswers);
    if (currentIndex + 1 >= questions.length) {
      handleFinishWithAnswers(updatedAnswers);
    }
  };

  const handleFinishWithAnswers = async (
    finalAnswers: {
      id: string;
      prompt: string;
      answer: string;
      userAnswer: string;
      isCorrect: boolean;
      pinyinShown?: boolean;
      direction: "hanzi-to-meaning" | "meaning-to-hanzi";
    }[]
  ) => {
    if (avoidRepeatToday && finalAnswers.length > 0) {
      const updated = getAskedKeysForToday();
      finalAnswers.forEach((item) => {
        if (!item.isCorrect) return;
        updated.add(`${item.direction}:${item.prompt}`);
      });
      saveAskedKeysForToday(updated);
    }
    const correctCount = finalAnswers.filter(function (item) {
      return item.isCorrect;
    }).length;
    const pinyinCount = finalAnswers.filter(function (item) {
      return Boolean(item.pinyinShown);
    }).length;
    const scoreAfterPenalty = Math.max(0, correctCount - pinyinCount * 0.5);
    const totalQuestions = questions.length;
    const scorePercent = totalQuestions > 0
      ? Math.max(0, Math.round((scoreAfterPenalty / totalQuestions) * 100))
      : 0;
    setPinyinShownTotal(pinyinCount);
    setFinalScore(scorePercent);

    if (startedAt) {
      const durationMs = Date.now() - startedAt;
      setDurationMs(durationMs);
      await addQuizHistory({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        durationMs,
        totalQuestions,
        correctCount,
        finalScore: scorePercent,
        answers: finalAnswers,
      });
    }
    setIsFinished(true);
  };

  const handleNext = () => {
    if (!currentQuestion) return;
    if (currentIndex + 1 >= questions.length) {
      handleFinishWithAnswers(answers);
      return;
    }
    setCurrentIndex(currentIndex + 1);
    setAnswer("");
    setResult(null);
    setShowPinyin(false);
  };

  const handleRestart = () => {
    initQuiz(records, questionCount, quizMode);
  };

  const handleQuestionCountChange = (value: number) => {
    setQuestionCount(value);
  };

  const handleModeChange = (value: QuizMode) => {
    setQuizMode(value);
  };

  const handleAvoidRepeatChange = (value: boolean) => {
    setAvoidRepeatToday(value);
    setConfigMessage(null);
  };

  const handleStartQuiz = () => {
    if (records.length === 0 || isLoading) return;
    const nextQuestions = getNextQuestions(records, questionCount, quizMode);
    if (avoidRepeatToday && nextQuestions.length === 0) {
      setConfigMessage(
        "Soal untuk hari ini sudah habis. Reset batasan harian jika ingin mengulang."
      );
      return;
    }
    initQuiz(records, questionCount, quizMode);
    setStep("quiz");
  };

  const handleBackToConfig = () => {
    setStep("config");
    setResult(null);
    setIsFinished(false);
  };

  const handleRequestBackToConfig = () => {
    if (step === "quiz" && !isFinished) {
      setIsConfirmResetOpen(true);
      return;
    }
    handleBackToConfig();
  };

  const handleConfirmReset = () => {
    setIsConfirmResetOpen(false);
    handleBackToConfig();
  };

  const handleResetToday = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(getTodayKey());
    setConfigMessage("Riwayat soal hari ini sudah direset.");
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <DashboardTopNav />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-base-content">
            Take a Quiz
          </h1>
          <p className="text-sm text-base-content/60">
            Pilih mode kuis sesuai kebutuhan latihan.
          </p>
        </div>

        {step === "config" ? (
          <Card className="rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <CardContent className="flex flex-col gap-6 px-6 py-6 text-sm text-base-content/60">
              <div className="flex items-start gap-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                    Pilih Mode
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {QUIZ_MODES.map(function (option) {
                      const isActive = quizMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleModeChange(option.value)}
                          className={
                            "flex flex-col items-center gap-2 rounded-xl border px-4 py-4 text-center transition-all " +
                            (isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-base-200 bg-base-100 hover:border-primary/40")
                          }
                        >
                          <span
                            className={
                              "flex size-8 items-center justify-center rounded-lg text-primary " +
                              (isActive ? "bg-primary/10" : "bg-base-200")
                            }
                          >
                            {option.value === "random"
                              ? "✕"
                              : option.value === "hanzi-to-meaning"
                                ? "汉"
                                : "文"}
                          </span>
                          <span className="text-xs font-semibold text-base-content">
                            {option.label}
                          </span>
                          {isActive ? (
                            <span className="text-[10px] text-primary">Aktif</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                    Pilih Jumlah Soal
                  </p>
                  <div className="mt-3 inline-flex flex-wrap gap-2 rounded-full bg-base-200 p-1">
                    {QUIZ_OPTIONS.map(function (option) {
                      const isActive = option === questionCount;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleQuestionCountChange(option)}
                          className={
                            "rounded-full px-4 py-2 text-xs font-semibold transition-colors " +
                            (isActive
                              ? "bg-primary text-primary-content shadow-sm"
                              : "text-base-content/70 hover:bg-base-100")
                          }
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                    Atur Pengulangan
                  </p>
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-base-200 bg-base-100 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-base-content">
                        Batasi Pengulangan Harian
                      </p>
                      <p className="text-xs text-base-content/50">
                        Jangan ulangi soal yang sudah muncul hari ini.
                      </p>
                    </div>
                  <Switch
                    checked={avoidRepeatToday}
                    onCheckedChange={handleAvoidRepeatChange}
                  />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-base-content/50">
                <span>Kata baru 2 hari terakhir diprioritaskan.</span>
                <div className="flex flex-wrap items-center gap-2">
                  {avoidRepeatToday ? (
                    <Button
                      variant="outline"
                      className="border-base-300 text-base-content/70 hover:bg-base-200"
                      onClick={handleResetToday}
                      type="button"
                    >
                      Reset Soal Hari Ini
                    </Button>
                  ) : null}
                  <Button
                    className="bg-primary text-primary-content hover:bg-primary/90"
                    onClick={handleStartQuiz}
                    disabled={records.length === 0 || isLoading}
                  >
                    Mulai Kuis
                  </Button>
                </div>
              </div>
              {configMessage ? (
                <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
                  {configMessage}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border border-base-200 bg-base-100 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-base-content/60">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-base-content">Pengaturan Kuis</span>
                <span className="rounded-full bg-base-200 px-3 py-1">
                  {QUIZ_MODES.find((item) => item.value === quizMode)?.label ?? "Random"}
                </span>
                <span className="rounded-full bg-base-200 px-3 py-1">
                  {questionCount} Soal
                </span>
                <span className="rounded-full bg-base-200 px-3 py-1">
                  {avoidRepeatToday ? "Tanpa Pengulangan" : "Boleh Pengulangan"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-base-300 text-base-content/70 hover:bg-base-200"
                onClick={handleRequestBackToConfig}
                aria-label="Ubah pengaturan"
              >
                <Settings className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "config" ? null : isLoading ? (
          <Card className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
            <CardContent className="p-6 text-sm text-base-content/60">
              Menyiapkan kuis...
            </CardContent>
          </Card>
        ) : questions.length === 0 ? (
          <Card className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-6 text-sm text-base-content/60">
              Belum ada data kosakata untuk kuis. Tambahkan Hanzi dulu ya.
              <Button className="w-fit bg-primary text-primary-content hover:bg-primary/90" asChild>
                <Link href="/">Kembali ke Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b border-base-200 px-6 py-4">
              <CardTitle className="text-base font-semibold text-base-content">
                Soal {currentIndex + 1} / {questions.length}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/50">
                  Skor: {score}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 p-6">
              {isFinished ? (
                <div className="flex flex-col gap-4">
                  <div className="text-lg font-semibold text-base-content">
                    Selesai! Skor kamu {score} dari {questions.length}.
                  </div>
                  <div className="grid gap-3 rounded-xl border border-base-200 bg-base-200/60 p-4 text-sm text-base-content/70 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-base-content/40">
                        Tanggal
                      </p>
                      <p className="mt-1 text-sm font-semibold text-base-content">
                        {new Date().toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-base-content/40">
                        Durasi
                      </p>
                      <p className="mt-1 text-sm font-semibold text-base-content">
                        {Math.round(durationMs / 1000)} detik
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-base-content/40">
                        Persentase
                      </p>
                      <p className="mt-1 text-sm font-semibold text-base-content">
                        {questions.length === 0
                          ? 0
                          : Math.round((score / questions.length) * 100)}
                        %
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-xl border border-base-200 bg-base-100 p-4 text-sm text-base-content/70 sm:grid-cols-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-base-content/40">
                        Total Hasil Ujian
                      </p>
                      <p className="mt-1 text-sm font-semibold text-base-content">
                        {score} benar
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-base-content/40">
                        Total Pinyin Ditampilkan
                      </p>
                      <p className="mt-1 text-sm font-semibold text-base-content">
                        {pinyinShownTotal}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-base-content/40">
                        Nilai Akumulatif
                      </p>
                      <p className="mt-1 text-sm font-semibold text-base-content">
                        {finalScore !== null ? `${finalScore}%` : `${Math.round((score / Math.max(1, questions.length)) * 100)}%`}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-base-200 bg-base-100">
                    <div className="border-b border-base-200 px-4 py-3 text-sm font-semibold text-base-content">
                      Riwayat Jawaban
                    </div>
                    <div className="max-h-64 divide-y divide-base-200 overflow-y-auto">
                      {answers.map(function (item) {
                        return (
                          <div key={item.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                                {item.direction === "hanzi-to-meaning"
                                  ? "Hanzi → Arti"
                                  : "Arti → Hanzi"}
                              </span>
                              <span
                                className={
                                  item.isCorrect
                                    ? "rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success"
                                    : "rounded-full bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error"
                                }
                              >
                                {item.isCorrect ? "Benar" : "Salah"}
                              </span>
                            </div>
                            <div className="text-base font-semibold text-base-content">
                              {item.prompt}
                            </div>
                            <div className="text-xs text-base-content/60">
                              Jawaban kamu:{" "}
                              <span className="font-semibold text-base-content">
                                {item.userAnswer}
                              </span>
                            </div>
                            {!item.isCorrect ? (
                              <div className="text-xs text-base-content/60">
                                Jawaban benar:{" "}
                                <span className="font-semibold text-base-content">
                                  {item.answer}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      className="bg-primary text-primary-content hover:bg-primary/90"
                      onClick={handleRestart}
                    >
                      <RotateCcw className="size-4" />
                      Ulangi Kuis
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/">Kembali</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-base-200 bg-base-200/60 px-6 py-5 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-base-content/40">
                      {currentQuestion.direction === "hanzi-to-meaning"
                        ? "Hanzi → Arti"
                        : "Arti → Hanzi"}
                    </p>
                    <p className="mt-3 text-4xl font-semibold text-base-content">
                      {currentQuestion.prompt}
                    </p>
                    {currentQuestion.direction === "hanzi-to-meaning" &&
                    currentQuestion.pinyin &&
                    (showPinyin || result !== null) ? (
                      <p className="mt-2 text-sm font-semibold text-primary/80">
                        {currentQuestion.pinyin}
                      </p>
                    ) : null}
                  </div>
                  {currentQuestion.direction === "hanzi-to-meaning" ? (
                    <div className="flex items-center justify-end gap-2 text-xs text-base-content/60">
                      <span>Tampilkan Pinyin</span>
                      <Switch
                        checked={showPinyin}
                        onCheckedChange={(checked) => {
                          setShowPinyin(checked);
                          if (checked && currentQuestion) {
                            setPinyinShownMap(function (prev) {
                              const next = new Set(prev);
                              next.add(currentQuestion.id);
                              return next;
                            });
                          }
                        }}
                        size="sm"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-3">
                    <Input
                      className="h-11 rounded-lg border-base-200 bg-base-100 text-base"
                      placeholder={
                        currentQuestion.direction === "hanzi-to-meaning"
                          ? "Ketik arti dalam Bahasa Indonesia"
                          : "Ketik Hanzi"
                      }
                      value={answer}
                      onChange={(event) => setAnswer(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        if (result === null) {
                          handleSubmit();
                          return;
                        }
                        handleNext();
                      }}
                      readOnly={result !== null}
                      ref={inputRef}
                    />
                    {result !== null ? (
                      <div
                        className={
                          result
                            ? "rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success"
                            : "rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error"
                        }
                      >
                        {result
                          ? "Jawaban kamu benar."
                          : `Jawaban salah. Jawaban benar: ${currentQuestion.answer}`}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-base-content/40">
                      Tekan Enter untuk cek atau lanjut.
                    </div>
                    {result === null ? (
                      <Button
                        className="bg-primary text-primary-content hover:bg-primary/90"
                        onClick={handleSubmit}
                      >
                        Cek Jawaban
                      </Button>
                    ) : (
                      <Button
                        className="bg-primary text-primary-content hover:bg-primary/90"
                        onClick={handleNext}
                      >
                        Lanjut
                        <ArrowRight className="size-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <DashboardFooter />
      <ConfirmModal
        isOpen={isConfirmResetOpen}
        onCancel={() => setIsConfirmResetOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Kuis?"
        message="Jika Anda mengubah pengaturan, kuis yang sedang dikerjakan akan direset dan dimulai dari awal."
        cancelText="Batal"
        confirmText="Ya, Reset"
        variant="overlay"
        confirmButtonClassName="bg-error text-white hover:bg-error/90"
        cancelButtonClassName="border-base-300 text-base-content/70 hover:bg-base-200"
      />
    </div>
  );
}

export default QuizPage;
