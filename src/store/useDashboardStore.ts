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

type DashboardCharacter = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  proficiencyLabel: string;
  proficiencyPercent: number;
  proficiencyTone: "success" | "warning" | "info";
  lastReviewed: string;
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
};

const useDashboardStore = create<DashboardState>(function () {
  return {
    appName: "Junaedy",
    navItems: [
      { id: "home", label: "Home", href: "#", isActive: false },
      { id: "hanzi", label: "My Hanzi", href: "#", isActive: true },
      { id: "quiz", label: "Take a Quiz", href: "#", isActive: false },
      { id: "leaderboard", label: "Leaderboard", href: "#", isActive: false },
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
        value: "1,284",
        caption: "+12 WEEK",
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
    characters: [
      {
        id: "ni-hao",
        hanzi: "你好",
        pinyin: "Nǐhǎo",
        meaning: "Hello",
        proficiencyLabel: "Mastered",
        proficiencyPercent: 88,
        proficiencyTone: "success",
        lastReviewed: "Oct 24, 2023",
      },
      {
        id: "xue-xi",
        hanzi: "学习",
        pinyin: "Xuéxí",
        meaning: "To study / Learn",
        proficiencyLabel: "Learning",
        proficiencyPercent: 52,
        proficiencyTone: "info",
        lastReviewed: "Oct 25, 2023",
      },
      {
        id: "han-zi",
        hanzi: "汉字",
        pinyin: "Hànzì",
        meaning: "Chinese Characters",
        proficiencyLabel: "Needs Review",
        proficiencyPercent: 32,
        proficiencyTone: "warning",
        lastReviewed: "Oct 22, 2023",
      },
      {
        id: "peng-you",
        hanzi: "朋友",
        pinyin: "Péngyǒu",
        meaning: "Friend",
        proficiencyLabel: "Mastered",
        proficiencyPercent: 90,
        proficiencyTone: "success",
        lastReviewed: "Oct 26, 2023",
      },
    ],
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
  };
});

export default useDashboardStore;
