import { create } from "zustand";
import {
  Award,
  BookOpen,
  LineChart,
  NotebookPen,
  Sparkles,
  Trophy,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type DashboardNavItem = {
  id: string;
  label: string;
  href: string;
  isActive: boolean;
};

type DashboardUser = {
  name: string;
  level: string;
  initials: string;
  avatarUrl?: string;
};

type DashboardStat = {
  id: string;
  title: string;
  value: string;
  caption: string;
  meta: string;
  tone: "primary" | "success" | "warning" | "info";
  icon: LucideIcon;
};

export type DashboardCharacter = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  proficiencyLabel: string;
  proficiencyPercent: number;
  proficiencyTone: "success" | "warning" | "info";
  lastReviewed: string;
  type?: "character" | "sentence";
};

type DashboardProgress = {
  id: string;
  label: string;
  value: string;
};

type DashboardQuiz = {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  icon: LucideIcon;
};

type DashboardState = {
  appName: string;
  navItems: DashboardNavItem[];
  user: DashboardUser;
  heroTitle: string;
  heroSubtitle: string;
  stats: DashboardStat[];
  characters: DashboardCharacter[];
  progressLabel: string;
  progressPercent: number;
  progressGoal: string;
  progressStats: DashboardProgress[];
  recommendedQuizzes: DashboardQuiz[];
  setCharacters: (items: DashboardCharacter[]) => void;
  setStatValue: (id: string, value: string) => void;
  setStatCaption: (id: string, caption: string) => void;
};

const useDashboardStore = create<DashboardState>(function (set) {
  return {
    appName: "Junaedy",
    navItems: [
      { id: "home", label: "Home", href: "/", isActive: true },
      { id: "quiz", label: "Take a Quiz", href: "/quiz", isActive: false },
      { id: "quiz_history", label: "Quiz History ", href: "/quiz/history", isActive: false },
      { id: "typing", label: "Typing Test", href: "#", isActive: false },
    ],
    user: {
      name: "Junaedy",
      level: "HSK 4 Learner",
      initials: "J",
      avatarUrl:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuD31ISyOnJxYSLztSsyTwgSeB-_R4zp-sF1mjRxt89IEQpCWtkGFSroV9y__--Mr1BA7AstjS749Lb_jyX0QkTnpOTvbzLoo0CCmyObQndC5EMSJ8nUX6GU3-uAkV_VTyLlhiWYYZAHYhCaCp5V_846F9s8IuvQ8rjlrDViPaswbFVnZBTuV0L6EMBSsRH4EcvNn5ZKtsMiK0uE57nqmcNCoFwJ_DywymLjcRYpqEZ8Gc2p4P3-Kl-avyagWonmfI3-e1ICsGjcZI3t",
    },
    heroTitle: "Welcome back, Junaedy!",
    heroSubtitle: "You've mastered 12 new characters this week. Keep it up!",
    stats: [
      {
        id: "total-vocab",
        title: "Total Vocab",
        value: "0",
        caption: "",
        meta: "Total vocabulary stored",
        tone: "info",
        icon: BookOpen,
      },
      {
        id: "new-learned",
        title: "New Learned",
        value: "24",
        caption: "TODAY",
        meta: "New words captured today",
        tone: "primary",
        icon: Sparkles,
      },
      {
        id: "quiz-score",
        title: "Quiz Score",
        value: "92/100",
        caption: "OCT 24",
        meta: "Latest quiz performance",
        tone: "warning",
        icon: Trophy,
      },
      {
        id: "accuracy",
        title: "Accuracy",
        value: "87.5%",
        caption: "3%",
        meta: "7-day accuracy average",
        tone: "success",
        icon: LineChart,
      },
    ],
    characters: [],
    progressLabel: "Overall Mastery",
    progressPercent: 72,
    progressGoal: "HSK 4 Goal",
    progressStats: [
      { id: "characters", label: "Characters Added", value: "12" },
      { id: "flashcards", label: "Flashcards Reviewed", value: "45" },
      { id: "study-time", label: "Total Study Time", value: "2.5h" },
    ],
    recommendedQuizzes: [
      {
        id: "daily-review",
        title: "Daily Review",
        subtitle: "15 Questions",
        duration: "5 mins",
        icon: NotebookPen,
      },
      {
        id: "speed-recall",
        title: "Speed Recall",
        subtitle: "30 Questions",
        duration: "3 mins",
        icon: Award,
      },
    ],
    setCharacters: function (items: DashboardCharacter[]) {
      set({ characters: items });
    },
    setStatValue: function (id: string, value: string) {
      set(function (state) {
        return {
          stats: state.stats.map(function (stat) {
            if (stat.id === id) {
              return { ...stat, value };
            }
            return stat;
          }),
        };
      });
    },
    setStatCaption: function (id: string, caption: string) {
      set(function (state) {
        return {
          stats: state.stats.map(function (stat) {
            if (stat.id === id) {
              return { ...stat, caption };
            }
            return stat;
          }),
        };
      });
    },
  };
});

export default useDashboardStore;
