import { cache } from "react";
import { unstable_noStore as noStore } from "next/cache";
import {
  formatWeekdayShort,
  getTodayKey,
  getWeekDates,
  parseDateKey,
  toDateKey,
} from "@/lib/date";
import { DEMO_GROUP_ID, DEMO_INVITE_CODE } from "@/lib/constants";
import { createMockDataset } from "@/lib/data/mock";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  BookSummary,
  GroupDirectory,
  GroupDirectoryItem,
  EnrichedReadingLog,
  GroupWorkspace,
  SourceBook,
  SourceDataset,
  SourceGroupMember,
  SourceReadingLog,
  SourceUser,
  UserSummary,
} from "@/lib/types";
import { clampPercent, formatGoal } from "@/lib/utils";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
type GroupMemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type BookRow = Database["public"]["Tables"]["books"]["Row"];
type ReadingLogRow = Database["public"]["Tables"]["reading_logs"]["Row"];

type WeeklyDateMeta = {
  date: string;
  label: string;
};

type WeeklyRange = {
  id: string;
  startDate: string;
  endDate: string;
  isCurrentWeek: boolean;
};

function getWeekStartDate(referenceDate: Date) {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekKey(dateKey: string) {
  return toDateKey(getWeekStartDate(parseDateKey(dateKey)));
}

function buildRecentWeekRanges(referenceDate = new Date(), count = 6): WeeklyRange[] {
  const currentWeekStart = getWeekStartDate(referenceDate);

  return Array.from({ length: count }, (_, index) => {
    const start = new Date(currentWeekStart);
    start.setDate(currentWeekStart.getDate() - index * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      id: toDateKey(start),
      startDate: toDateKey(start),
      endDate: toDateKey(end),
      isCurrentWeek: index === 0,
    };
  });
}

function toUserSummary(user: SourceUser): UserSummary {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl,
  };
}

function buildUserSummaryFromAuth(
  user: {
    id: string;
    email?: string | null;
    user_metadata: Record<string, unknown>;
  },
  profile?: UserRow | null,
): UserSummary {
  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    nickname:
      profile?.nickname ??
      (typeof user.user_metadata.nickname === "string"
        ? user.user_metadata.nickname
        : undefined) ??
      (typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : undefined) ??
      user.email?.split("@")[0] ??
      "독자",
    avatarColor: profile?.avatar_color ?? "slate",
    avatarUrl: profile?.avatar_url ?? null,
  };
}

function buildFallbackUserRow(
  user: {
    id: string;
    email?: string | null;
    user_metadata: Record<string, unknown>;
  },
): UserRow {
  const loginId =
    typeof user.user_metadata.loginId === "string"
      ? user.user_metadata.loginId
      : user.email?.split("@")[0] ?? "reader";
  const nickname =
    typeof user.user_metadata.nickname === "string"
      ? user.user_metadata.nickname
      : typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "독자";
  const avatarColor =
    typeof user.user_metadata.avatarColor === "string"
      ? user.user_metadata.avatarColor
      : "slate";

  return {
    id: user.id,
    email: user.email ?? "",
    login_id: loginId,
    nickname,
    avatar_url: null,
    avatar_color: avatarColor as UserRow["avatar_color"],
    created_at: new Date().toISOString(),
  };
}

function pushMapValue<T>(map: Map<string, T[]>, key: string, value: T) {
  const current = map.get(key);

  if (current) {
    current.push(value);
    return;
  }

  map.set(key, [value]);
}

function buildEnrichedLogs(dataset: SourceDataset) {
  const userMap = new Map(dataset.users.map((user) => [user.id, user]));
  const bookMap = new Map(dataset.books.map((book) => [book.id, book]));

  return [...dataset.logs]
    .filter((log) => log.didRead && Boolean(log.bookId))
    .sort((a, b) => {
      const byDate = b.date.localeCompare(a.date);
      return byDate || b.createdAt.localeCompare(a.createdAt);
    })
    .map<EnrichedReadingLog>((log) => {
      const user = userMap.get(log.userId);
      const book = log.bookId ? bookMap.get(log.bookId) : null;

      if (!user) {
        throw new Error(`Missing user for log ${log.id}`);
      }

      return {
        id: log.id,
        groupId: log.groupId,
        date: log.date,
        weekdayLabel: formatWeekdayShort(log.date),
        pagesRead: log.pagesRead,
        memo: log.memo,
        readingTime: log.readingTime,
        startPage: log.startPage,
        endPage: log.endPage,
        moodTag: log.moodTag,
        member: toUserSummary(user),
        book: book
          ? { id: book.id, title: book.title, author: book.author }
          : null,
      };
    });
}

function buildWorkspace(dataset: SourceDataset): GroupWorkspace {
  const enrichedLogs = buildEnrichedLogs(dataset);
  const todayKey = getTodayKey();
  const weekKeys = getWeekDates().map(toDateKey);
  const weekKeySet = new Set(weekKeys);
  const weeklyRanges = buildRecentWeekRanges();
  const weeklyDateMeta: WeeklyDateMeta[] = weekKeys.map((dateKey) => ({
    date: dateKey,
    label: formatWeekdayShort(dateKey),
  }));
  const userMap = new Map(dataset.users.map((user) => [user.id, user]));
  const logsByUser = new Map<string, EnrichedReadingLog[]>();
  const weeklyLogsByUser = new Map<string, EnrichedReadingLog[]>();
  const weeklyReadDatesByUser = new Map<string, Set<string>>();
  const weeklyStatsByWeekAndUser = new Map<
    string,
    Map<string, { totalLogs: number; totalPages: number; readDates: Set<string> }>
  >();
  const readingBooksByUser = new Map<
    string,
    Array<{ id: string; title: string; author: string; status: SourceBook["status"] }>
  >();
  const bookStatsById = new Map<
    string,
    { totalLoggedPages: number; myLoggedPages: number }
  >();
  const weeklyLogs: EnrichedReadingLog[] = [];
  const me = userMap.get(dataset.currentUserId);

  if (!me) {
    throw new Error("Current user missing from dataset.");
  }

  for (const book of dataset.books) {
    if (book.status !== "reading") {
      continue;
    }

    pushMapValue(readingBooksByUser, book.createdBy, {
      id: book.id,
      title: book.title,
      author: book.author,
      status: book.status,
    });
  }

  for (const log of enrichedLogs) {
    pushMapValue(logsByUser, log.member.id, log);

    const weekKey = getWeekKey(log.date);
    const weekStatsByUser = weeklyStatsByWeekAndUser.get(weekKey) ?? new Map();
    const currentWeekStats = weekStatsByUser.get(log.member.id) ?? {
      totalLogs: 0,
      totalPages: 0,
      readDates: new Set<string>(),
    };
    currentWeekStats.totalLogs += 1;
    currentWeekStats.totalPages += log.pagesRead;
    currentWeekStats.readDates.add(log.date);
    weekStatsByUser.set(log.member.id, currentWeekStats);
    weeklyStatsByWeekAndUser.set(weekKey, weekStatsByUser);

    if (weekKeySet.has(log.date)) {
      pushMapValue(weeklyLogsByUser, log.member.id, log);
      weeklyLogs.push(log);

      const readDates = weeklyReadDatesByUser.get(log.member.id);
      if (readDates) {
        readDates.add(log.date);
      } else {
        weeklyReadDatesByUser.set(log.member.id, new Set([log.date]));
      }
    }

    if (!log.book) {
      continue;
    }

    const bookStats = bookStatsById.get(log.book.id) ?? {
      totalLoggedPages: 0,
      myLoggedPages: 0,
    };
    bookStats.totalLoggedPages += log.pagesRead;

    if (log.member.id === dataset.currentUserId) {
      bookStats.myLoggedPages += log.pagesRead;
    }

    bookStatsById.set(log.book.id, bookStats);
  }

  const members = dataset.members
    .map((member) => {
      const user = userMap.get(member.userId);
      const memberLogs = logsByUser.get(member.userId) ?? [];
      const memberWeeklyLogs = weeklyLogsByUser.get(member.userId) ?? [];
      const weeklyReadDates = weeklyReadDatesByUser.get(member.userId) ?? new Set();
      const weeklyReadDays = weeklyDateMeta.map(({ date, label }) => ({
        date,
        label,
        read: weeklyReadDates.has(date),
        isToday: date === todayKey,
      }));

      if (!user) {
        throw new Error(`Missing user for member ${member.id}`);
      }

      return {
        id: member.id,
        userId: member.userId,
        nickname: user.nickname,
        email: user.email,
        avatarColor: user.avatarColor,
        avatarUrl: user.avatarUrl,
        role: member.role,
        joinedAt: member.joinedAt,
        daysReadThisWeek: weeklyReadDates.size,
        totalPagesThisWeek: memberWeeklyLogs.reduce((sum, log) => sum + log.pagesRead, 0),
        weeklyReadDays,
        recentLogs: memberLogs.slice(0, 4),
        activeBooks: readingBooksByUser.get(member.userId) ?? [],
      };
    })
    .sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === "owner" ? -1 : 1;
      }

      return b.daysReadThisWeek - a.daysReadThisWeek || b.totalPagesThisWeek - a.totalPagesThisWeek;
    });

  const books = dataset.books.map<BookSummary>((book) => {
    const stats = bookStatsById.get(book.id) ?? {
      totalLoggedPages: 0,
      myLoggedPages: 0,
    };

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      totalPages: book.totalPages,
      status: book.status,
      totalLoggedPages: stats.totalLoggedPages,
      myLoggedPages: stats.myLoggedPages,
      createdBy: book.createdBy,
    };
  });
  const myWeeklyLogs = weeklyLogsByUser.get(dataset.currentUserId) ?? [];
  const myWeeklyReadDates = weeklyReadDatesByUser.get(dataset.currentUserId) ?? new Set();
  const myWeeklyPages = myWeeklyLogs.reduce((sum, log) => sum + log.pagesRead, 0);
  const weeklyGoalReached = (days: number, pages: number) =>
    dataset.group.weeklyGoalType === "days"
      ? days >= dataset.group.weeklyGoalValue
      : pages >= dataset.group.weeklyGoalValue;

  const weeklyHistory = weeklyRanges.map((range) => {
    const statsByUser = weeklyStatsByWeekAndUser.get(range.id) ?? new Map();
    const memberStatuses = members.map((member) => {
      const memberStats = statsByUser.get(member.userId);
      const days = memberStats?.readDates.size ?? 0;
      const pages = memberStats?.totalPages ?? 0;

      return {
        member: {
          id: member.userId,
          email: member.email,
          nickname: member.nickname,
          avatarColor: member.avatarColor,
          avatarUrl: member.avatarUrl,
        },
        days,
        pages,
        achieved: weeklyGoalReached(days, pages),
      };
    });

    return {
      id: range.id,
      startDate: range.startDate,
      endDate: range.endDate,
      isCurrentWeek: range.isCurrentWeek,
      totalLogs: memberStatuses.reduce(
        (sum, status) => sum + (statsByUser.get(status.member.id)?.totalLogs ?? 0),
        0,
      ),
      totalPages: memberStatuses.reduce((sum, status) => sum + status.pages, 0),
      achievedMemberCount: memberStatuses.filter((status) => status.achieved).length,
      members: memberStatuses,
    };
  });

  const currentWeekOverview = weeklyHistory[0];

  return {
    group: {
      id: dataset.group.id,
      name: dataset.group.name,
      description: dataset.group.description,
      weeklyGoalType: dataset.group.weeklyGoalType,
      weeklyGoalValue: dataset.group.weeklyGoalValue,
      inviteCode: dataset.group.inviteCode,
      ownerId: dataset.group.ownerId,
      memberCount: dataset.members.length,
      createdAt: dataset.group.createdAt,
    },
    me: toUserSummary(me),
    members,
    books: books.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "reading" ? -1 : 1;
      }

      return b.myLoggedPages - a.myLoggedPages || b.totalLoggedPages - a.totalLoggedPages;
    }),
    recentLogs: enrichedLogs,
    personalSummary: {
      daysReadThisWeek: myWeeklyReadDates.size,
      weeklyGoalProgress:
        dataset.group.weeklyGoalType === "days"
          ? clampPercent((myWeeklyReadDates.size / dataset.group.weeklyGoalValue) * 100)
          : clampPercent((myWeeklyPages / dataset.group.weeklyGoalValue) * 100),
      weeklyGoalLabel: formatGoal(
        dataset.group.weeklyGoalType,
        dataset.group.weeklyGoalValue,
      ),
      pagesThisWeek: myWeeklyPages,
    },
    weeklyOverview: {
      totalLogs: currentWeekOverview?.totalLogs ?? 0,
      totalPages: currentWeekOverview?.totalPages ?? 0,
      achievedMemberCount: currentWeekOverview?.achievedMemberCount ?? 0,
      weeks: weeklyHistory,
    },
    todayPrompt: "오늘 읽은 내용을 가볍게 남겨 보세요.",
    hasLoggedToday: dataset.logs.some(
      (log) =>
        log.userId === dataset.currentUserId &&
        log.date === todayKey &&
        log.didRead,
    ),
  };
}

async function getSupabaseDataset(groupId: string): Promise<SourceDataset | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const membershipQuery = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membershipQuery.data) {
    return null;
  }

  const [groupQuery, membersQuery, booksQuery, logsQuery] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).single(),
    supabase.from("group_members").select("*").eq("group_id", groupId),
    supabase
      .from("books")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false }),
    supabase
      .from("reading_logs")
      .select("*")
      .eq("group_id", groupId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (
    groupQuery.error ||
    membersQuery.error ||
    booksQuery.error ||
    logsQuery.error ||
    !groupQuery.data ||
    !membersQuery.data
  ) {
    return null;
  }

  const group = groupQuery.data as GroupRow;
  const members = membersQuery.data as GroupMemberRow[];

  const userIds = Array.from(
    new Set([
      ...members.map((member) => member.user_id),
      user.id,
    ]),
  );

  const usersQuery = await supabase
    .from("users")
    .select("*")
    .in("id", userIds);

  const userRows = (usersQuery.data ?? []) as UserRow[];

  if (!userRows.find((profile) => profile.id === user.id)) {
    userRows.push(buildFallbackUserRow(user));
  }

  return {
    currentUserId: user.id,
    group: {
      id: group.id,
      name: group.name,
      description: group.description ?? "",
      weeklyGoalType: group.weekly_goal_type,
      weeklyGoalValue: group.weekly_goal_value,
      inviteCode: group.invite_code,
      ownerId: group.owner_id,
      createdAt: group.created_at,
    },
    users: userRows.map((profile) => ({
      id: profile.id,
      email: profile.email,
      nickname: profile.nickname,
      avatarColor: profile.avatar_color,
      avatarUrl: profile.avatar_url,
      createdAt: profile.created_at,
    })),
    members: members.map<SourceGroupMember>((member) => ({
      id: member.id,
      groupId: member.group_id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
    })),
    books: ((booksQuery.data ?? []) as BookRow[]).map<SourceBook>((book) => ({
      id: book.id,
      groupId: book.group_id,
      title: book.title,
      author: book.author,
      totalPages: book.total_pages,
      status: book.status,
      createdBy: book.created_by,
      createdAt: book.created_at,
    })),
    logs: ((logsQuery.data ?? []) as ReadingLogRow[]).map<SourceReadingLog>((log) => ({
      id: log.id,
      groupId: log.group_id,
      userId: log.user_id,
      bookId: log.book_id,
      date: log.date,
      dayOfWeek: log.day_of_week,
      didRead: log.did_read,
      pagesRead: log.pages_read,
      memo: log.memo ?? "",
      readingTime: log.reading_time,
      startPage: log.start_page,
      endPage: log.end_page,
      moodTag: log.mood_tag,
      createdAt: log.created_at,
    })),
  };
}

export async function getGroupWorkspace(groupId: string) {
  noStore();
  const supabaseDataset = await getSupabaseDataset(groupId);

  if (supabaseDataset) {
    return buildWorkspace(supabaseDataset);
  }

  if (groupId === DEMO_GROUP_ID) {
    return buildWorkspace(createMockDataset(groupId));
  }

  return null;
}

export const getLandingWorkspace = cache(async () => {
  return buildWorkspace(createMockDataset());
});

export async function getCurrentUserSummary() {
  noStore();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const profileQuery = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileQuery.data as UserRow | null;

  return buildUserSummaryFromAuth(user, profile);
}

export async function getGroupDirectory(): Promise<GroupDirectory> {
  noStore();
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    const workspace = buildWorkspace(createMockDataset());

    return {
      user: null,
      groups: [],
      demoGroup: workspace.group,
      isDemoMode: true,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      groups: [],
      demoGroup: null,
      isDemoMode: false,
    };
  }

  const profileQuery = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileQuery.data as UserRow | null;

  const membershipsQuery = await supabase
    .from("group_members")
    .select("*")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true });

  const memberships = (membershipsQuery.data ?? []) as GroupMemberRow[];
  const groupIds = memberships.map((membership) => membership.group_id);

  if (!groupIds.length) {
    return {
      user: buildUserSummaryFromAuth(user, profile),
      groups: [],
      demoGroup: null,
      isDemoMode: false,
    };
  }

  const [groupsQuery, memberCountsQuery] = await Promise.all([
    supabase.from("groups").select("*").in("id", groupIds),
    supabase.from("group_members").select("group_id").in("group_id", groupIds),
  ]);

  const groups = (groupsQuery.data ?? []) as GroupRow[];
  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const memberCounts = (memberCountsQuery.data ?? []) as Array<
    Pick<GroupMemberRow, "group_id">
  >;
  const countMap = memberCounts.reduce<Record<string, number>>((acc, row) => {
    acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
    return acc;
  }, {});

  const items = memberships
    .map<GroupDirectoryItem | null>((membership) => {
      const group = groupMap.get(membership.group_id);

      if (!group) {
        return null;
      }

      return {
        role: membership.role,
        joinedAt: membership.joined_at,
        group: {
          id: group.id,
          name: group.name,
          description: group.description ?? "",
          weeklyGoalType: group.weekly_goal_type,
          weeklyGoalValue: group.weekly_goal_value,
          inviteCode: group.invite_code,
          ownerId: group.owner_id,
          memberCount: countMap[group.id] ?? 0,
          createdAt: group.created_at,
        },
      };
    })
    .filter((item): item is GroupDirectoryItem => Boolean(item))
    .sort((a, b) => b.group.createdAt.localeCompare(a.group.createdAt));

  return {
    user: buildUserSummaryFromAuth(user, profile),
    groups: items,
    demoGroup: null,
    isDemoMode: false,
  };
}

export async function getInvitePreview(inviteCode: string) {
  const normalized = inviteCode.trim().toUpperCase();

  if (normalized === DEMO_INVITE_CODE) {
    return buildWorkspace(createMockDataset()).group;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const groupQuery = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", normalized)
    .maybeSingle();

  if (!groupQuery.data) {
    return null;
  }

  const group = groupQuery.data as GroupRow;

  const membersQuery = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  return {
    id: group.id,
    name: group.name,
    description: group.description ?? "",
    weeklyGoalType: group.weekly_goal_type,
    weeklyGoalValue: group.weekly_goal_value,
    inviteCode: group.invite_code,
    ownerId: group.owner_id,
    memberCount: membersQuery.count ?? 0,
    createdAt: group.created_at,
  };
}
