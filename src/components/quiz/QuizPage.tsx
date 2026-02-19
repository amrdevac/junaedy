"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

import { addQuizHistory, getAllHanziRecords } from "@/lib/indexeddb/hanziCollection";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";

type QuizQuestion = {
  id: string;
  prompt: string;
  answer: string;
  direction: "hanzi-to-meaning" | "meaning-to-hanzi";
};

type QuizRecord = {
  hanzi: string;
  meaning: string;
  createdAt: string;
};

const DEFAULT_QUIZ_LIMIT = 10;
const QUIZ_OPTIONS = [5, 10, 20];
const NEW_WORD_DAYS = 2;

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

function buildQuestions(records: QuizRecord[], limit: number) {
  const now = Date.now();
  const expanded = records.flatMap(function (record, index) {
    const createdAt = new Date(record.createdAt).getTime();
    const isNew = createdAt
      ? now - createdAt <= NEW_WORD_DAYS * 24 * 60 * 60 * 1000
      : false;
    const weight = isNew ? 3 : 1;

    const base = [
      {
        id: `hanzi-${index}`,
        prompt: record.hanzi,
        answer: record.meaning,
        direction: "hanzi-to-meaning" as const,
      },
      {
        id: `meaning-${index}`,
        prompt: record.meaning,
        answer: record.hanzi,
        direction: "meaning-to-hanzi" as const,
      },
    ];

    return Array.from({ length: weight }, () => base).flat();
  });
  const unique: QuizQuestion[] = [];
  const usedKeys = new Set<string>();
  const shuffled = shuffleList(expanded);
  shuffled.forEach(function (item) {
    const key = `${item.direction}:${item.prompt}`;
    if (usedKeys.has(key)) return;
    usedKeys.add(key);
    unique.push(item);
  });
  return unique.slice(0, limit);
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  const initQuiz = (items: QuizRecord[], limit: number) => {
    const nextQuestions = buildQuestions(items, limit);
    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setAnswer("");
    setScore(0);
    setAnswers([]);
    setResult(null);
    setIsFinished(false);
    setStartedAt(Date.now());
    setDurationMs(0);
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
            createdAt: record.createdAt,
          };
        });
      setRecords(usable);
      initQuiz(usable, questionCount);
      setIsLoading(false);
    };

    loadQuiz();
  }, []);

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
    const updatedAnswers = [
      ...answers,
      {
        id: currentQuestion.id,
        prompt: currentQuestion.prompt,
        answer: currentQuestion.answer,
        userAnswer: normalizedAnswer,
        isCorrect,
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
      direction: "hanzi-to-meaning" | "meaning-to-hanzi";
    }[]
  ) => {
    if (startedAt) {
      const durationMs = Date.now() - startedAt;
      setDurationMs(durationMs);
      const totalQuestions = questions.length;
      const correctCount = finalAnswers.filter(function (item) {
        return item.isCorrect;
      }).length;
      await addQuizHistory({
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        durationMs,
        totalQuestions,
        correctCount,
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
  };

  const handleRestart = () => {
    initQuiz(records, questionCount);
  };

  const handleQuestionCountChange = (value: number) => {
    setQuestionCount(value);
    if (records.length > 0) {
      initQuiz(records, value);
    }
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
            Latih kosakata Anda dengan kuis acak dari koleksi pribadi.
          </p>
        </div>

        <Card className="rounded-xl border border-base-300 bg-base-100 shadow-sm">
          <CardContent className="flex flex-wrap items-center gap-4 px-6 py-4 text-sm text-base-content/60">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                Jumlah Soal
              </span>
              <div className="flex items-center gap-2">
                {QUIZ_OPTIONS.map(function (option) {
                  const isActive = option === questionCount;
                  return (
                    <Button
                      key={option}
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className={
                        isActive
                          ? "bg-primary text-primary-content hover:bg-primary/90"
                          : "border-base-300 text-base-content/70 hover:bg-base-200"
                      }
                      onClick={() => handleQuestionCountChange(option)}
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-base-content/50">
              Kata baru 2 hari terakhir diprioritaskan.
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
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
              <span className="text-xs text-base-content/50">
                Skor: {score}
              </span>
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
                  </div>
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
    </div>
  );
}

export default QuizPage;
