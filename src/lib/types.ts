export type GoalType = "days" | "pages";
export type MemberRole = "owner" | "member";
export type BookStatus = "reading" | "finished";
export type AvatarTone = "violet" | "lightBlue" | "green" | "amber" | "slate";
export type ToastTone = "primary" | "positive" | "cautionary" | "negative";

export interface SourceUser {
  id: string;
  email: string;
  nickname: string;
  avatarColor: AvatarTone;
  createdAt: string;
}

export interface SourceGroup {
  id: string;
  name: string;
  description: string;
  weeklyGoalType: GoalType;
  weeklyGoalValue: number;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}

export interface SourceGroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface SourceBook {
  id: string;
  groupId: string;
  title: string;
  author: string;
  totalPages: number;
  status: BookStatus;
  createdBy: string;
  createdAt: string;
}

export interface SourceReadingLog {
  id: string;
  groupId: string;
  userId: string;
  bookId: string | null;
  date: string;
  dayOfWeek: number;
  didRead: boolean;
  pagesRead: number;
  memo: string;
  readingTime: number | null;
  startPage: number | null;
  endPage: number | null;
  moodTag: string | null;
  createdAt: string;
}

export interface SourceDataset {
  currentUserId: string;
  group: SourceGroup;
  users: SourceUser[];
  members: SourceGroupMember[];
  books: SourceBook[];
  logs: SourceReadingLog[];
}

export interface UserSummary {
  id: string;
  email: string;
  nickname: string;
  avatarColor: AvatarTone;
}

export interface GroupSummary {
  id: string;
  name: string;
  description: string;
  weeklyGoalType: GoalType;
  weeklyGoalValue: number;
  inviteCode: string;
  ownerId: string;
  memberCount: number;
  createdAt: string;
}

export interface GroupDirectoryItem {
  group: GroupSummary;
  role: MemberRole;
  joinedAt: string;
}

export interface GroupDirectory {
  user: UserSummary | null;
  groups: GroupDirectoryItem[];
  demoGroup: GroupSummary | null;
  isDemoMode: boolean;
}

export interface EnrichedReadingLog {
  id: string;
  groupId: string;
  date: string;
  weekdayLabel: string;
  pagesRead: number;
  memo: string;
  readingTime: number | null;
  startPage: number | null;
  endPage: number | null;
  moodTag: string | null;
  member: UserSummary;
  book: {
    id: string;
    title: string;
    author: string;
  } | null;
}

export interface WeeklyReadDay {
  date: string;
  label: string;
  read: boolean;
  isToday: boolean;
}

export interface MemberSummary {
  id: string;
  userId: string;
  nickname: string;
  email: string;
  avatarColor: AvatarTone;
  role: MemberRole;
  joinedAt: string;
  daysReadThisWeek: number;
  totalPagesThisWeek: number;
  weeklyReadDays: WeeklyReadDay[];
  recentLogs: EnrichedReadingLog[];
  activeBooks: {
    id: string;
    title: string;
    author: string;
    status: BookStatus;
  }[];
}

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  status: BookStatus;
  totalLoggedPages: number;
  myLoggedPages: number;
  createdBy: string;
}

export interface PersonalSummary {
  daysReadThisWeek: number;
  weeklyGoalProgress: number;
  weeklyGoalLabel: string;
  pagesThisWeek: number;
}

export interface WeeklyOverview {
  totalLogs: number;
  totalPages: number;
  ranking: {
    member: UserSummary;
    pages: number;
    days: number;
  }[];
  mostReadBook: BookSummary | null;
}

export interface GroupWorkspace {
  group: GroupSummary;
  me: UserSummary;
  members: MemberSummary[];
  books: BookSummary[];
  recentLogs: EnrichedReadingLog[];
  personalSummary: PersonalSummary;
  weeklyOverview: WeeklyOverview;
  todayPrompt: string;
  hasLoggedToday: boolean;
}

export type FieldErrors = Record<string, string[] | undefined>;

export interface FormState {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: FieldErrors;
}
