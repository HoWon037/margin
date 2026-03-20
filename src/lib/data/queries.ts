import { cache } from "react";
import { formatWeekdayShort, getTodayKey, getWeekDates, toDateKey } from "@/lib/date";
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
import { formatGoal } from "@/lib/utils";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
type GroupMemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type BookRow = Database["public"]["Tables"]["books"]["Row"];
type ReadingLogRow = Database["public"]["Tables"]["reading_logs"]["Row"];

function toUserSummary(user: SourceUser): UserSummary {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarColor: user.avatarColor,
  };
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

function buildBookSummary(
  book: SourceBook,
  enrichedLogs: EnrichedReadingLog[],
  currentUserId: string,
): BookSummary {
  const bookLogs = enrichedLogs.filter((log) => log.book?.id === book.id);

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    totalPages: book.totalPages,
    status: book.status,
    totalLoggedPages: bookLogs.reduce((sum, log) => sum + log.pagesRead, 0),
    myLoggedPages: bookLogs
      .filter((log) => log.member.id === currentUserId)
      .reduce((sum, log) => sum + log.pagesRead, 0),
    createdBy: book.createdBy,
  };
}

function buildWorkspace(dataset: SourceDataset): GroupWorkspace {
  const enrichedLogs = buildEnrichedLogs(dataset);
  const todayKey = getTodayKey();
  const weekKeys = getWeekDates().map(toDateKey);
  const weekKeySet = new Set(weekKeys);
  const userMap = new Map(dataset.users.map((user) => [user.id, user]));
  const me = userMap.get(dataset.currentUserId);

  if (!me) {
    throw new Error("Current user missing from dataset.");
  }

  const members = dataset.members
    .map((member) => {
      const user = userMap.get(member.userId);
      const memberLogs = enrichedLogs.filter((log) => log.member.id === member.userId);
      const weeklyLogs = memberLogs.filter((log) => weekKeySet.has(log.date));
      const weeklyReadDays = weekKeys.map((dateKey) => ({
        date: dateKey,
        label: formatWeekdayShort(dateKey),
        read: weeklyLogs.some((log) => log.date === dateKey),
        isToday: dateKey === todayKey,
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
        role: member.role,
        joinedAt: member.joinedAt,
        daysReadThisWeek: weeklyLogs.length,
        totalPagesThisWeek: weeklyLogs.reduce((sum, log) => sum + log.pagesRead, 0),
        weeklyReadDays,
        recentLogs: memberLogs.slice(0, 4),
        activeBooks: dataset.books
          .filter(
            (book) => book.createdBy === member.userId && book.status === "reading",
          )
          .map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            status: book.status,
          })),
      };
    })
    .sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === "owner" ? -1 : 1;
      }

      return b.daysReadThisWeek - a.daysReadThisWeek || b.totalPagesThisWeek - a.totalPagesThisWeek;
    });

  const books = dataset.books.map((book) =>
    buildBookSummary(book, enrichedLogs, dataset.currentUserId),
  );
  const myWeeklyLogs = enrichedLogs.filter(
    (log) => log.member.id === dataset.currentUserId && weekKeySet.has(log.date),
  );

  const ranking = members
    .map((member) => ({
      member: {
        id: member.userId,
        email: member.email,
        nickname: member.nickname,
        avatarColor: member.avatarColor,
      },
      pages: member.totalPagesThisWeek,
      days: member.daysReadThisWeek,
    }))
    .sort((a, b) => b.pages - a.pages);

  const overviewBook =
    [...books].sort((a, b) => b.totalLoggedPages - a.totalLoggedPages)[0] ?? null;

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
      daysReadThisWeek: myWeeklyLogs.length,
      weeklyGoalProgress:
        dataset.group.weeklyGoalType === "days"
          ? (myWeeklyLogs.length / dataset.group.weeklyGoalValue) * 100
          : (myWeeklyLogs.reduce((sum, log) => sum + log.pagesRead, 0) /
              dataset.group.weeklyGoalValue) *
            100,
      weeklyGoalLabel: formatGoal(
        dataset.group.weeklyGoalType,
        dataset.group.weeklyGoalValue,
      ),
      pagesThisWeek: myWeeklyLogs.reduce((sum, log) => sum + log.pagesRead, 0),
    },
    weeklyOverview: {
      totalLogs: enrichedLogs.filter((log) => weekKeySet.has(log.date)).length,
      totalPages: enrichedLogs
        .filter((log) => weekKeySet.has(log.date))
        .reduce((sum, log) => sum + log.pagesRead, 0),
      ranking,
      mostReadBook: overviewBook,
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
    userRows.push({
      id: user.id,
      email: user.email ?? "",
      login_id:
        user.user_metadata.loginId ??
        user.email?.split("@")[0] ??
        "reader",
      nickname:
        user.user_metadata.nickname ??
        user.user_metadata.full_name ??
        user.email?.split("@")[0] ??
        "독자",
      avatar_color: "slate",
      created_at: new Date().toISOString(),
    });
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

export const getGroupWorkspace = cache(async (groupId: string) => {
  const supabaseDataset = await getSupabaseDataset(groupId);

  if (supabaseDataset) {
    return buildWorkspace(supabaseDataset);
  }

  if (groupId === DEMO_GROUP_ID) {
    return buildWorkspace(createMockDataset(groupId));
  }

  return null;
});

export const getLandingWorkspace = cache(async () => {
  return buildWorkspace(createMockDataset());
});

export const getCurrentUserSummary = cache(async () => {
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

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    nickname:
      profile?.nickname ??
      user.user_metadata.nickname ??
      user.user_metadata.full_name ??
      user.email?.split("@")[0] ??
      "독자",
    avatarColor: profile?.avatar_color ?? "slate",
  };
});

export const getGroupDirectory = cache(async (): Promise<GroupDirectory> => {
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
      user: {
        id: user.id,
        email: user.email ?? profile?.email ?? "",
        nickname:
          profile?.nickname ??
          user.user_metadata.nickname ??
          user.user_metadata.full_name ??
          user.email?.split("@")[0] ??
          "독자",
        avatarColor: profile?.avatar_color ?? "slate",
      },
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
  const memberCounts = (memberCountsQuery.data ?? []) as Array<
    Pick<GroupMemberRow, "group_id">
  >;
  const countMap = memberCounts.reduce<Record<string, number>>((acc, row) => {
    acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
    return acc;
  }, {});

  const items = memberships
    .map<GroupDirectoryItem | null>((membership) => {
      const group = groups.find((candidate) => candidate.id === membership.group_id);

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
    user: {
      id: user.id,
      email: user.email ?? profile?.email ?? "",
      nickname:
        profile?.nickname ??
        user.user_metadata.nickname ??
        user.user_metadata.full_name ??
        user.email?.split("@")[0] ??
        "독자",
      avatarColor: profile?.avatar_color ?? "slate",
    },
    groups: items,
    demoGroup: null,
    isDemoMode: false,
  };
});

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
