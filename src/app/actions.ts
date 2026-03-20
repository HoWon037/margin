"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTodayKey } from "@/lib/date";
import { MAX_ACTIVE_READING_BOOKS } from "@/lib/constants";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AvatarTone, FormState } from "@/lib/types";
import {
  bookSchema,
  bookStatusUpdateSchema,
  createGroupSchema,
  joinGroupSchema,
  passwordSignInSchema,
  passwordSignUpSchema,
  profileSchema,
  readingLogSchema,
  settingsSchema,
} from "@/lib/validation/schemas";
import { generateInviteCode } from "@/lib/utils";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
type GroupOwnerRow = Pick<GroupRow, "owner_id">;

const AUTH_EMAIL_DOMAIN = "auth.margin.local";

function buildFormState(
  status: FormState["status"],
  message?: string,
  fieldErrors?: FormState["fieldErrors"],
): FormState {
  return { status, message, fieldErrors };
}

function buildRedirectWithToast(
  path: string,
  toast: string,
  tone: FormState["status"] extends "error" ? never : "primary" | "positive" | "cautionary" | "negative",
  description?: string,
) {
  const params = new URLSearchParams({
    toast,
    tone,
  });

  if (description) {
    params.set("description", description);
  }

  return `${path}?${params.toString()}`;
}

async function requireUser() {
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

  return { supabase, user };
}

async function upsertProfile(
  overrides?: {
    loginId?: string;
    nickname?: string;
    avatarColor?: AvatarTone;
  },
) {
  const context = await requireUser();

  if (!context) {
    return null;
  }

  const profileQuery = await context.supabase
    .from("users")
    .select("login_id, nickname, avatar_color")
    .eq("id", context.user.id)
    .maybeSingle();

  const existingProfile = profileQuery.data as Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "login_id" | "nickname" | "avatar_color"
  > | null;

  const loginId =
    overrides?.loginId ??
    existingProfile?.login_id ??
    (typeof context.user.user_metadata.loginId === "string"
      ? context.user.user_metadata.loginId
      : undefined) ??
    context.user.email?.split("@")[0] ??
    "reader";

  const fallbackNickname =
    overrides?.nickname ??
    existingProfile?.nickname ??
    (typeof context.user.user_metadata.nickname === "string"
      ? context.user.user_metadata.nickname
      : undefined) ??
    loginId ??
    "독자";

  const fallbackAvatarColor =
    overrides?.avatarColor ??
    (typeof context.user.user_metadata.avatarColor === "string"
      ? (context.user.user_metadata.avatarColor as AvatarTone)
      : undefined) ??
    existingProfile?.avatar_color ??
    "slate";

  await context.supabase.from("users").upsert(
    {
      id: context.user.id,
      email: context.user.email ?? createAuthEmail(loginId),
      login_id: normalizeLoginId(loginId),
      nickname: fallbackNickname,
      avatar_color: fallbackAvatarColor,
    },
    { onConflict: "id" },
  );

  return context;
}

async function countActiveReadingBooks(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  groupId: string,
  userId: string,
  excludeBookId?: string,
) {
  if (!supabase) {
    return 0;
  }

  let query = supabase
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .eq("created_by", userId)
    .eq("status", "reading");

  if (excludeBookId) {
    query = query.neq("id", excludeBookId);
  }

  const result = await query;
  return result.count ?? 0;
}

function normalizeLoginId(loginId: string) {
  return loginId.trim().toLowerCase();
}

function createAuthEmail(loginId: string) {
  return `${normalizeLoginId(loginId)}@${AUTH_EMAIL_DOMAIN}`;
}

function mapAuthErrorToMessage(message?: string) {
  if (!message) {
    return "잠시 후 다시 시도해 주세요.";
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return "아이디나 비밀번호가 맞지 않습니다.";
  }

  if (normalized.includes("user already registered")) {
    return "이미 사용 중인 아이디입니다.";
  }

  if (normalized.includes("password")) {
    return "비밀번호를 다시 확인해 주세요.";
  }

  return "잠시 후 다시 시도해 주세요.";
}

export async function signInWithPasswordAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = passwordSignInSchema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return buildFormState(
      "error",
      "아이디와 비밀번호를 다시 확인해 주세요.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return buildFormState(
      "error",
      "Supabase 설정이 아직 없어 로그인 기능을 사용할 수 없습니다.",
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: createAuthEmail(parsed.data.loginId),
    password: parsed.data.password,
  });

  if (error) {
    return buildFormState("error", mapAuthErrorToMessage(error.message));
  }

  await upsertProfile({ loginId: parsed.data.loginId });

  redirect(
    buildRedirectWithToast(
      "/groups",
      "로그인했습니다",
      "positive",
    ),
  );
}

export async function signUpWithPasswordAction(
  _prevState: FormState,
  formData: FormData,
) {
  const supabase = await createSupabaseServerClient();
  const parsed = passwordSignUpSchema.safeParse({
    loginId: formData.get("loginId"),
    password: formData.get("password"),
    nickname: formData.get("nickname"),
    avatarColor: formData.get("avatarColor"),
  });

  if (!parsed.success) {
    return buildFormState(
      "error",
      "가입 정보를 다시 확인해 주세요.",
      parsed.error.flatten().fieldErrors,
    );
  }

  if (!supabase) {
    return buildFormState(
      "error",
      "Supabase 설정이 아직 없어 가입 기능을 사용할 수 없습니다.",
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: createAuthEmail(parsed.data.loginId),
    password: parsed.data.password,
    options: {
      data: {
        loginId: normalizeLoginId(parsed.data.loginId),
        nickname: parsed.data.nickname,
        avatarColor: parsed.data.avatarColor,
      },
    },
  });

  if (error) {
    return buildFormState("error", mapAuthErrorToMessage(error.message));
  }

  if (!data.session) {
    return buildFormState(
      "error",
      "Supabase에서 이메일 확인이 켜져 있으면 이 로그인 방식은 쓸 수 없습니다. 이메일 확인을 꺼 주세요.",
    );
  }

  await upsertProfile({
    loginId: parsed.data.loginId,
    nickname: parsed.data.nickname,
    avatarColor: parsed.data.avatarColor,
  });

  redirect(
    buildRedirectWithToast(
      "/groups",
      "가입이 완료되었습니다",
      "positive",
    ),
  );
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/");
  }

  await supabase.auth.signOut();

  redirect(
    buildRedirectWithToast(
      "/",
      "로그아웃되었습니다",
      "positive",
    ),
  );
}

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
    avatarColor: formData.get("avatarColor"),
  });

  if (!parsed.success) {
    return buildFormState(
      "error",
      "프로필 정보를 다시 확인해 주세요.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const context = await upsertProfile({
    nickname: parsed.data.nickname,
    avatarColor: parsed.data.avatarColor,
  });

  if (!context) {
    return buildFormState("error", "로그인 후 다시 시도해 주세요.");
  }

  const metadataUpdate = await context.supabase.auth.updateUser({
    data: {
      ...context.user.user_metadata,
      nickname: parsed.data.nickname,
      avatarColor: parsed.data.avatarColor,
    },
  });

  if (metadataUpdate.error) {
    return buildFormState(
      "error",
      "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  revalidatePath("/groups");
  revalidatePath("/profile");
  revalidatePath("/group/[groupId]", "layout");

  return buildFormState("success", "프로필을 저장했습니다.");
}

export async function createGroupAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = createGroupSchema.safeParse({
    groupName: formData.get("groupName"),
    description: formData.get("description"),
    weeklyGoalType: formData.get("weeklyGoalType"),
    weeklyGoalValue: formData.get("weeklyGoalValue"),
  });

  if (!parsed.success) {
    return buildFormState("error", "모임 정보를 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const context = await upsertProfile();

  if (!context) {
    redirect(
      buildRedirectWithToast(
        "/",
        "먼저 로그인해 주세요",
        "cautionary",
      ),
    );
  }

  const inviteCode = generateInviteCode();
  const groupInsert = await context.supabase
    .from("groups")
    .insert({
      name: parsed.data.groupName,
      description: parsed.data.description || null,
      weekly_goal_type: parsed.data.weeklyGoalType,
      weekly_goal_value: parsed.data.weeklyGoalValue,
      invite_code: inviteCode,
      owner_id: context.user.id,
    })
    .select("id")
    .single();

  if (groupInsert.error || !groupInsert.data) {
    return buildFormState("error", "모임을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  const memberInsert = await context.supabase.from("group_members").insert({
    group_id: groupInsert.data.id,
    user_id: context.user.id,
    role: "owner",
  });

  if (memberInsert.error) {
    return buildFormState("error", "모임 생성 마무리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath(`/group/${groupInsert.data.id}`);
  redirect(
    buildRedirectWithToast(
      `/group/${groupInsert.data.id}`,
      "모임을 만들었습니다",
      "positive",
    ),
  );
}

export async function joinGroupAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = joinGroupSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
    nickname: formData.get("nickname"),
    avatarColor: formData.get("avatarColor"),
  });

  if (!parsed.success) {
    return buildFormState("error", "참여 정보를 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const context = await upsertProfile({
    nickname: parsed.data.nickname,
    avatarColor: parsed.data.avatarColor,
  });

  if (!context) {
    redirect(
      buildRedirectWithToast(
        "/",
        "먼저 로그인해 주세요",
        "cautionary",
      ),
    );
  }

  const inviteCode = parsed.data.inviteCode.trim().toUpperCase();

  const groupQuery = await context.supabase
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  const group = groupQuery.data as GroupRow | null;

  if (!group) {
    return buildFormState("error", "초대 코드를 찾지 못했습니다.", {
      inviteCode: ["초대 코드를 찾지 못했습니다."],
    });
  }

  const countQuery = await context.supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((countQuery.count ?? 0) >= 10) {
    return buildFormState("error", "이 모임은 인원이 가득 찼습니다.", {
      inviteCode: ["이 모임은 더 이상 참여할 수 없습니다."],
    });
  }

  const existingQuery = await context.supabase
    .from("group_members")
    .select("*")
    .eq("group_id", group.id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (existingQuery.data) {
    redirect(
      buildRedirectWithToast(
        `/group/${group.id}`,
        "이미 참여한 모임입니다",
        "cautionary",
        "이미 이 모임에 참여해 있습니다.",
      ),
    );
  }

  const insert = await context.supabase.from("group_members").insert({
    group_id: group.id,
    user_id: context.user.id,
    role: "member",
  });

  if (insert.error) {
    return buildFormState("error", "모임에 참여하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath(`/group/${group.id}`);
  redirect(
    buildRedirectWithToast(
      `/group/${group.id}`,
      "모임에 참여했습니다",
      "positive",
    ),
  );
}

export async function saveReadingLogAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = readingLogSchema.safeParse({
    groupId: formData.get("groupId"),
    bookId: formData.get("bookId"),
    pagesRead: formData.get("pagesRead"),
    memo: formData.get("memo"),
    startPage: formData.get("startPage"),
    endPage: formData.get("endPage"),
  });

  if (!parsed.success) {
    return buildFormState("error", "오늘 기록을 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const context = await requireUser();

  if (!context) {
    redirect(
      buildRedirectWithToast(
        "/",
        "먼저 로그인해 주세요",
        "cautionary",
      ),
    );
  }

  const todayKey = getTodayKey();
  const todayDate = new Date();
  const bookQuery = await context.supabase
    .from("books")
    .select("id, status, created_by")
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (!bookQuery.data) {
    return buildFormState("error", "기록할 책을 찾지 못했습니다.", {
      bookId: ["기록할 책을 찾지 못했습니다."],
    });
  }

  if (bookQuery.data.status !== "reading") {
    return buildFormState("error", "읽는 중인 책만 기록할 수 있습니다.", {
      bookId: ["읽는 중 상태의 책을 선택해 주세요."],
    });
  }

  if (bookQuery.data.created_by !== context.user.id) {
    return buildFormState("error", "내가 추가한 책만 기록할 수 있습니다.", {
      bookId: ["내가 추가한 책을 선택해 주세요."],
    });
  }

  const upsert = await context.supabase.from("reading_logs").upsert(
    {
      group_id: parsed.data.groupId,
      user_id: context.user.id,
      book_id: parsed.data.bookId,
      date: todayKey,
      day_of_week: todayDate.getDay(),
      did_read: true,
      pages_read: parsed.data.pagesRead,
      memo: parsed.data.memo || null,
      reading_time: null,
      start_page: parsed.data.startPage ?? null,
      end_page: parsed.data.endPage ?? null,
      mood_tag: null,
    },
    { onConflict: "group_id,user_id,date" },
  );

  if (upsert.error) {
    return buildFormState("error", "독서 기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath(`/group/${parsed.data.groupId}/log`);
  revalidatePath(`/group/${parsed.data.groupId}/members`);
  revalidatePath(`/group/${parsed.data.groupId}/books`);
  revalidatePath(`/group/${parsed.data.groupId}/weekly`);

  redirect(
    buildRedirectWithToast(
      `/group/${parsed.data.groupId}`,
      "독서 기록을 저장했습니다",
      "positive",
    ),
  );
}

export async function createBookAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = bookSchema.safeParse({
    groupId: formData.get("groupId"),
    title: formData.get("title"),
    author: formData.get("author"),
    totalPages: formData.get("totalPages"),
  });

  if (!parsed.success) {
    return buildFormState("error", "책 정보를 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const context = await requireUser();

  if (!context) {
    return buildFormState(
      "error",
      "책을 추가하려면 먼저 로그인해야 합니다.",
    );
  }

  const activeReadingBookCount = await countActiveReadingBooks(
    context.supabase,
    parsed.data.groupId,
    context.user.id,
  );

  if (activeReadingBookCount >= MAX_ACTIVE_READING_BOOKS) {
    return buildFormState(
      "error",
      `읽는 중인 책은 ${MAX_ACTIVE_READING_BOOKS}권까지만 둘 수 있습니다.`,
      {
        totalPages: [
          `읽는 중인 책은 ${MAX_ACTIVE_READING_BOOKS}권까지만 둘 수 있습니다.`,
        ],
      },
    );
  }

  const insert = await context.supabase.from("books").insert({
    group_id: parsed.data.groupId,
    title: parsed.data.title,
    author: parsed.data.author,
    total_pages: parsed.data.totalPages,
    status: "reading",
    created_by: context.user.id,
  });

  if (insert.error) {
    return buildFormState("error", "책을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath(`/group/${parsed.data.groupId}/log`);
  revalidatePath(`/group/${parsed.data.groupId}/books`);
  revalidatePath(`/group/${parsed.data.groupId}/members`);
  return buildFormState("success", "모임 책장에 책을 추가했습니다.");
}

export async function updateBookStatusAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const parsed = bookStatusUpdateSchema.safeParse({
    groupId: formData.get("groupId"),
    bookId: formData.get("bookId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(
      buildRedirectWithToast(
        "/groups",
        "책 상태를 바꾸지 못했습니다",
        "negative",
      ),
    );
  }

  const context = await requireUser();

  if (!context) {
    redirect(
      buildRedirectWithToast(
        "/",
        "먼저 로그인해 주세요",
        "cautionary",
      ),
    );
  }

  const currentBook = await context.supabase
    .from("books")
    .select("id, group_id, status, created_by")
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (currentBook.error || !currentBook.data) {
    redirect(
      buildRedirectWithToast(
        redirectTo || `/group/${parsed.data.groupId}/books`,
        "책을 찾지 못했습니다",
        "negative",
      ),
    );
  }

  if (currentBook.data.created_by !== context.user.id) {
    redirect(
      buildRedirectWithToast(
        redirectTo || `/group/${parsed.data.groupId}/books`,
        "내 책만 바꿀 수 있습니다",
        "negative",
      ),
    );
  }

  if (parsed.data.status === "reading") {
    const activeReadingBookCount = await countActiveReadingBooks(
      context.supabase,
      parsed.data.groupId,
      context.user.id,
      parsed.data.bookId,
    );

    if (activeReadingBookCount >= MAX_ACTIVE_READING_BOOKS) {
      redirect(
        buildRedirectWithToast(
          redirectTo || `/group/${parsed.data.groupId}/books?book=${parsed.data.bookId}`,
          `읽는 중인 책은 ${MAX_ACTIVE_READING_BOOKS}권까지만 둘 수 있습니다`,
          "cautionary",
        ),
      );
    }
  }

  const update = await context.supabase
    .from("books")
    .update({ status: parsed.data.status })
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId);

  if (update.error) {
    redirect(
      buildRedirectWithToast(
        redirectTo || `/group/${parsed.data.groupId}/books?book=${parsed.data.bookId}`,
        "책 상태를 바꾸지 못했습니다",
        "negative",
      ),
    );
  }

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath(`/group/${parsed.data.groupId}/log`);
  revalidatePath(`/group/${parsed.data.groupId}/books`);
  revalidatePath(`/group/${parsed.data.groupId}/members`);
  revalidatePath(`/group/${parsed.data.groupId}/weekly`);

  redirect(
    buildRedirectWithToast(
      redirectTo || `/group/${parsed.data.groupId}/books?book=${parsed.data.bookId}`,
      parsed.data.status === "reading" ? "읽는 중으로 바꿨습니다" : "완독으로 바꿨습니다",
      "positive",
    ),
  );
}

export async function updateGroupSettingsAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = settingsSchema.safeParse({
    groupId: formData.get("groupId"),
    groupName: formData.get("groupName"),
    description: formData.get("description"),
    weeklyGoalType: formData.get("weeklyGoalType"),
    weeklyGoalValue: formData.get("weeklyGoalValue"),
  });

  if (!parsed.success) {
    return buildFormState("error", "모임 설정을 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const context = await requireUser();

  if (!context) {
    return buildFormState(
      "error",
      "모임 설정을 바꾸려면 모임장 계정으로 로그인해야 합니다.",
    );
  }

  const ownerCheck = await context.supabase
    .from("groups")
    .select("owner_id")
    .eq("id", parsed.data.groupId)
    .single();

  const owner = ownerCheck.data as GroupOwnerRow | null;

  if (owner?.owner_id !== context.user.id) {
    return buildFormState(
      "error",
      "이 설정은 모임장만 수정할 수 있습니다.",
    );
  }

  const update = await context.supabase
    .from("groups")
    .update({
      name: parsed.data.groupName,
      description: parsed.data.description || null,
      weekly_goal_type: parsed.data.weeklyGoalType,
      weekly_goal_value: parsed.data.weeklyGoalValue,
    })
    .eq("id", parsed.data.groupId);

  if (update.error) {
    return buildFormState("error", "모임 설정을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath(`/group/${parsed.data.groupId}/settings`);
  return buildFormState("success", "모임 설정을 저장했습니다.");
}

export async function regenerateInviteCodeAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "로그인이 필요합니다",
        "cautionary",
      ),
    );
  }

  const ownerCheck = await context.supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  const owner = ownerCheck.data as GroupOwnerRow | null;

  if (ownerCheck.error || owner?.owner_id !== context.user.id) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "모임장만 초대 코드를 바꿀 수 있습니다",
        "cautionary",
      ),
    );
  }

  const update = await context.supabase
    .from("groups")
    .update({ invite_code: generateInviteCode() })
    .eq("id", groupId);

  if (update.error) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "초대 코드를 다시 만들지 못했습니다",
        "negative",
      ),
    );
  }

  revalidatePath(`/group/${groupId}/settings`);
  redirect(
    buildRedirectWithToast(
      `/group/${groupId}/settings`,
      "초대 코드를 다시 만들었습니다",
      "positive",
    ),
  );
}

export async function removeMemberAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const memberUserId = String(formData.get("memberUserId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "로그인이 필요합니다",
        "cautionary",
      ),
    );
  }

  const ownerCheck = await context.supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  const owner = ownerCheck.data as GroupOwnerRow | null;

  if (ownerCheck.error || owner?.owner_id !== context.user.id) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "모임장만 멤버를 내보낼 수 있습니다",
        "cautionary",
      ),
    );
  }

  if (memberUserId === context.user.id) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "모임장은 스스로 나갈 수 없습니다",
        "cautionary",
      ),
    );
  }

  const remove = await context.supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId);

  if (remove.error) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "멤버를 내보내지 못했습니다",
        "negative",
      ),
    );
  }

  revalidatePath(`/group/${groupId}`);
  revalidatePath(`/group/${groupId}/members`);
  revalidatePath(`/group/${groupId}/weekly`);
  revalidatePath(`/group/${groupId}/settings`);
  redirect(
    buildRedirectWithToast(
      `/group/${groupId}/settings`,
      "멤버를 내보냈습니다",
      "positive",
    ),
  );
}

export async function deleteGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "로그인이 필요합니다",
        "cautionary",
      ),
    );
  }

  const ownerCheck = await context.supabase
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  const owner = ownerCheck.data as GroupOwnerRow | null;

  if (ownerCheck.error || owner?.owner_id !== context.user.id) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "모임장만 모임을 삭제할 수 있습니다",
        "cautionary",
      ),
    );
  }

  const remove = await context.supabase.from("groups").delete().eq("id", groupId);

  if (remove.error) {
    redirect(
      buildRedirectWithToast(
        `/group/${groupId}/settings`,
        "모임을 삭제하지 못했습니다",
        "negative",
      ),
    );
  }

  revalidatePath("/");
  revalidatePath("/groups");
  redirect(
    buildRedirectWithToast(
      "/groups",
      "모임을 삭제했습니다",
      "positive",
    ),
  );
}
