"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Filter, Recycle, Repeat, ReplyAll, Rotate3D, Search, Trophy, X } from "lucide-react";

import { clearQuizHistory, getAllQuizHistory, type QuizHistoryEntry } from "@/lib/indexeddb/hanziCollection";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/ui/dialog";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import DashboardTopNav from "@/components/dashboard/DashboardTopNav";

function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function QuizHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<QuizHistoryEntry | null>(null);
  const [detailFilter, setDetailFilter] = useState<"all" | "correct" | "wrong">("all");
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      const data = await getAllQuizHistory();
      const sorted = data.slice().sort(function (a, b) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setHistory(sorted);
      setIsLoading(false);
    };

    loadHistory();
  }, []);

  const handleClearHistory = async () => {
    if (isClearing) return;
    setIsClearing(true);
    await clearQuizHistory();
    setHistory([]);
    setSelectedEntry(null);
    setDetailFilter("all");
    setIsClearing(false);
  };

  const inferMode = (entry: QuizHistoryEntry) => {
    const directions = new Set(entry.answers.map((answer) => answer.direction));
    if (directions.size === 1) {
      return directions.has("hanzi-to-meaning") ? "hanzi-to-meaning" : "meaning-to-hanzi";
    }
    return "random";
  };

  const handleReplayQuiz = (entry: QuizHistoryEntry) => {
    if (typeof window === "undefined") return;
    const payload = {
      mode: inferMode(entry),
      questionCount: entry.totalQuestions,
      avoidRepeatToday: false,
    };
    localStorage.setItem("quiz-replay-config", JSON.stringify(payload));
    router.push("/quiz");
  };

  const totalAttempts = history.length;
  const summary = useMemo(() => {
    if (history.length === 0) {
      return { accuracy: 0, bestScore: 0, totalQuestions: 0, highestPercent: 0 };
    }
    const totalCorrect = history.reduce((sum, item) => sum + item.correctCount, 0);
    const totalQuestions = history.reduce((sum, item) => sum + item.totalQuestions, 0);
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const bestScore = history.reduce((max, item) => {
      return Math.max(max, item.correctCount);
    }, 0);
    const highestPercent = history.reduce((max, item) => {
      const percent = item.totalQuestions > 0 ? Math.round((item.correctCount / item.totalQuestions) * 100) : 0;
      return Math.max(max, percent);
    }, 0);
    return { accuracy, bestScore, totalQuestions, highestPercent };
  }, [history]);

  const topStats = useMemo(() => {
    const map = new Map<
      string,
      {
        prompt: string;
        correct: number;
        total: number;
      }
    >();

    history.forEach((entry) => {
      entry.answers.forEach((answer) => {
        const key = `${answer.direction}:${answer.prompt}`;
        const existing = map.get(key) ?? { prompt: answer.prompt, correct: 0, total: 0 };
        existing.total += 1;
        if (answer.isCorrect) existing.correct += 1;
        map.set(key, existing);
      });
    });

    const rows = Array.from(map.values()).map((item) => {
      const accuracy = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0;
      return { ...item, accuracy };
    });

    const mostWrong = rows
      .filter((item) => item.total > 0)
      .sort((a, b) => {
        if (a.accuracy === b.accuracy) {
          return b.total - a.total;
        }
        return a.accuracy - b.accuracy;
      })
      .slice(0, 5);

    const mostCorrect = rows
      .filter((item) => item.total > 0)
      .sort((a, b) => {
        if (a.accuracy === b.accuracy) {
          return b.total - a.total;
        }
        return b.accuracy - a.accuracy;
      })
      .slice(0, 5);

    return { mostWrong, mostCorrect };
  }, [history]);

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <DashboardTopNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-16 pt-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold text-base-content">
              Quiz History Dashboard
            </h1>
            <p className="text-sm text-base-content/60">
              Review performa kuis dan pantau progres Mandarin secara detail.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="border-base-300 text-base-content/70 hover:bg-base-200"
              disabled={isClearing || history.length === 0}
              onClick={handleClearHistory}
            >
              {isClearing ? "Menghapus..." : "Hapus Riwayat"}
            </Button>
            <Button
              variant="outline"
              className="border-base-300 text-base-content/70 hover:bg-base-200"
            >
              <Filter className="size-4" />
              Filter History
            </Button>
            <Button className="bg-primary text-primary-content hover:bg-primary/90" asChild>
              <Link href="/quiz">
                Start New Quiz
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl border border-base-200 bg-base-100 shadow-sm">
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                  Total Quizzes
                </p>
                <p className="mt-2 text-2xl font-semibold text-base-content">
                  {totalAttempts}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <BarChart3 className="size-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-base-200 bg-base-100 shadow-sm">
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                  Avg Accuracy
                </p>
                <p className="mt-2 text-2xl font-semibold text-base-content">
                  {summary.accuracy}%
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
                <Trophy className="size-5" />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-base-200 bg-base-100 shadow-sm">
            <CardContent className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
                  Highest Score
                </p>
                <p className="mt-2 text-2xl font-semibold text-base-content">
                  {summary.highestPercent}/100
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-full bg-warning/10 text-warning">
                <Trophy className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-xl border border-base-200 bg-base-100 shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg font-semibold text-base-content">
                Recent Activity
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-base-content/40" />
                <Input
                  className="w-56 rounded-lg border-base-200 bg-base-200 pl-9 text-sm"
                  placeholder="Search sessions..."
                />
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              {isLoading ? (
                <div className="rounded-xl border border-base-200 bg-base-100 px-6 py-8 text-center text-sm text-base-content/60">
                  Memuat riwayat kuis...
                </div>
              ) : history.length === 0 ? (
                <div className="rounded-xl border border-base-200 bg-base-100 px-6 py-8 text-center text-sm text-base-content/60">
                  Belum ada hasil kuis. Mulai kuis pertama Anda.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {history.map((item, index) => {
                    const accuracy =
                      item.totalQuestions > 0
                        ? Math.round((item.correctCount / item.totalQuestions) * 100)
                        : 0;
                    return (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedEntry(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedEntry(item);
                          }
                        }}
                        className="flex w-full cursor-pointer flex-col gap-3 rounded-xl border border-base-200 bg-base-100 px-5 py-4 text-left shadow-sm transition-transform hover:scale-[1.01] md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-base-content">
                            Sesi #{history.length - index}
                          </p>
                          <p className="mt-1 text-xs text-base-content/50">
                            {formatDate(item.createdAt)} • {formatDuration(item.durationMs)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-base-content/60">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-base-content/40">
                              Score
                            </span>
                            <span className="text-sm font-semibold text-base-content">
                              {item.correctCount}/{item.totalQuestions}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-base-content/40">
                              Accuracy
                            </span>
                            <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                              {accuracy}%
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-base-content/40">
                              Nilai Akumulatif
                            </span>
                            <span className="text-sm font-semibold text-base-content">
                              {typeof item.finalScore === "number"
                                ? `${item.finalScore}%`
                                : `${Math.round((item.correctCount / Math.max(1, item.totalQuestions)) * 100)}%`}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="bg-white border-none text-base-content/70 hover:bg-base-200"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleReplayQuiz(item);
                            }}
                          >
                            <Repeat/>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="rounded-xl border border-base-200 bg-base-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-base-content">
                  Top 5 Kata
                </CardTitle>
                <p className="text-xs text-base-content/50">
                  Needs focus & mastered
                </p>
              </CardHeader>
              <CardContent className="space-y-4 pb-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                    Needs Focus
                  </p>
                  {topStats.mostWrong.length === 0 ? (
                    <p className="mt-2 text-sm text-base-content/50">
                      Belum ada data.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {topStats.mostWrong.map((item, idx) => (
                        <div
                          key={`wrong-${item.prompt}`}
                          className="flex items-center justify-between rounded-xl border border-base-200 bg-base-100 px-3 py-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-full bg-error/10 text-xs font-semibold text-error">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-base-content">
                                {item.prompt}
                              </p>
                              <p className="text-xs text-base-content/50">
                                {item.total} attempts
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-error">
                            {item.accuracy}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-base-content/40">
                    Mastered
                  </p>
                  {topStats.mostCorrect.length === 0 ? (
                    <p className="mt-2 text-sm text-base-content/50">
                      Belum ada data.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {topStats.mostCorrect.map((item, idx) => (
                        <div
                          key={`correct-${item.prompt}`}
                          className="flex items-center justify-between rounded-xl border border-base-200 bg-base-100 px-3 py-3 text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex size-7 items-center justify-center rounded-full bg-success/10 text-xs font-semibold text-success">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-base-content">
                                {item.prompt}
                              </p>
                              <p className="text-xs text-base-content/50">
                                {item.total} attempts
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-success">
                            {item.accuracy}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Dialog
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedEntry(null);
            setDetailFilter("all");
          }
        }}
      >
        <DialogContent
          overlayClassName="bg-slate-900/60 backdrop-blur-sm"
          showCloseButton={false}
          className="w-full overflow-hidden rounded-2xl border border-base-300 bg-base-100 p-0 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-base-200 px-6 py-4">
            <div>
              <DialogTitle className="text-base font-semibold text-base-content">
                Detail Quiz
              </DialogTitle>
              <p className="text-xs text-base-content/50">
                {selectedEntry ? formatDate(selectedEntry.createdAt) : "-"}
              </p>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-base-content/50 hover:bg-base-200 hover:text-base-content"
              >
                <X className="size-4" />
              </Button>
            </DialogClose>
          </div>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            {selectedEntry ? (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-base-200 bg-base-100 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-base-content/40">
                      Total Benar
                    </p>
                    <p className="mt-1 text-sm font-semibold text-base-content">
                      {selectedEntry.correctCount}/{selectedEntry.totalQuestions}
                    </p>
                  </div>
                  <div className="rounded-xl border border-base-200 bg-base-100 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-base-content/40">
                      Pinyin Ditampilkan
                    </p>
                    <p className="mt-1 text-sm font-semibold text-base-content">
                      {selectedEntry.answers.filter((item) => item.pinyinShown).length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-base-200 bg-base-100 px-4 py-3">
                    <p className="text-[10px] uppercase tracking-widest text-base-content/40">
                      Nilai Akumulatif
                    </p>
                    <p className="mt-1 text-sm font-semibold text-base-content">
                      {typeof selectedEntry.finalScore === "number"
                        ? `${selectedEntry.finalScore}%`
                        : `${Math.round((selectedEntry.correctCount / Math.max(1, selectedEntry.totalQuestions)) * 100)}%`}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={
                      detailFilter === "all"
                        ? "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                        : "border-base-300 text-base-content/70 hover:bg-base-200"
                    }
                    onClick={() => setDetailFilter("all")}
                  >
                    Semua
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={
                      detailFilter === "correct"
                        ? "border-success/40 bg-success/5 text-success hover:bg-success/10"
                        : "border-base-300 text-base-content/70 hover:bg-base-200"
                    }
                    onClick={() => setDetailFilter("correct")}
                  >
                    Benar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={
                      detailFilter === "wrong"
                        ? "border-error/40 bg-error/5 text-error hover:bg-error/10"
                        : "border-base-300 text-base-content/70 hover:bg-base-200"
                    }
                    onClick={() => setDetailFilter("wrong")}
                  >
                    Salah
                  </Button>
                </div>
                {selectedEntry.answers
                  .filter((answer) => {
                    if (detailFilter === "correct") return answer.isCorrect;
                    if (detailFilter === "wrong") return !answer.isCorrect;
                    return true;
                  })
                  .map((answer, idx) => (
                    <div
                      key={`${answer.id}-${idx}`}
                      className={
                        "rounded-xl border bg-base-100 px-4 py-3 " +
                        (answer.isCorrect
                          ? "border-success/30"
                          : "border-error/30")
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/60">
                        <span className="text-[10px] uppercase tracking-widest text-base-content/40">
                          {answer.direction === "hanzi-to-meaning" ? "Hanzi → Arti" : "Arti → Hanzi"}
                        </span>
                        <span
                          className={
                            answer.isCorrect
                              ? "rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success"
                              : "rounded-full bg-error/10 px-2 py-0.5 text-[10px] font-semibold text-error"
                          }
                        >
                          {answer.isCorrect ? "Benar" : "Salah"}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-base-content/40">
                            Pertanyaan
                          </p>
                          <p className="mt-1 text-sm font-semibold text-base-content">
                            {answer.prompt}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-base-content/40">
                            Jawaban Benar
                          </p>
                          <p className="mt-1 text-sm font-semibold text-base-content">
                            {answer.answer}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-base-content/40">
                            Jawaban Kamu
                          </p>
                          <p className="mt-1 text-sm font-semibold text-base-content">
                            {answer.userAnswer}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <DashboardFooter />
    </div>
  );
}

export default QuizHistoryPage;
