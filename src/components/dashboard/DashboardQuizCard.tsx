"use client";

import { ChevronRight } from "lucide-react";

import useDashboardStore from "@/store/useDashboardStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";

function DashboardQuizCard() {
  const recommendedQuizzes = useDashboardStore((state) => state.recommendedQuizzes);

  return (
    <Card className="rounded-xl border border-slate-200 bg-base-100 shadow-md">
      <CardHeader className="px-6 pb-2 pt-6">
        <CardTitle className="text-lg font-bold text-base-content">
          Recommended Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-6 pb-6">
        <div className="flex flex-col gap-3">
          {recommendedQuizzes.map(function (quiz) {
            const Icon = quiz.icon;
            return (
              <div
                key={quiz.id}
                className="group flex items-center gap-4 rounded-lg border border-slate-100 px-4 py-3 transition-colors hover:border-primary"
              >
                <div className="flex size-10 items-center justify-center rounded bg-blue-50 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-bold text-base-content transition-colors group-hover:text-primary">
                    {quiz.title}
                  </span>
                  <span className="text-xs text-base-content/50">
                    {quiz.subtitle} • {quiz.duration}
                  </span>
                </div>
                <ChevronRight className="size-5 text-base-content/30" />
              </div>
            );
          })}
        </div>
        <Button
          variant="link"
          className="h-auto w-full justify-center p-0 text-sm font-bold text-primary"
        >
          View all available quizzes
        </Button>
      </CardContent>
    </Card>
  );
}

export default DashboardQuizCard;
