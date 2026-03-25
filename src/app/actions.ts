"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDateKey } from "@/lib/date";
import { MAX_ACTIVE_READING_BOOKS } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AvatarTone, FormState } from "@/lib/types";
import {
  bookSchema,
  bookDetailsUpdateSchema,
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
type AuthContext = NonNullable<Awaited<ReturnType<typeof requireUser>>>;
type UpsertProfileResult = {
  context: AuthContext | null;
  error?: string;
};

const AUTH_EMAIL_DOMAIN = "auth.margin.local";

function getActionDbClient(supabase: AuthContext["supabase"]) {
  return createSupabaseAdminClient() ?? supabase;
}

function buildFormState(
  status: FormState["status"],
  message?: string,
  fieldErrors?: FormState["fieldErrors"],
): FormState {
  return { status, message, fieldErrors };
}

function redirectWithToast(
  path: string,
  toast: string,
  tone: "primary" | "positive" | "cautionary" | "negative",
  description?: string,
): never {
  void toast;
  void tone;
  void description;
  redirect(path);
}

function revalidateGroupDirectory() {
  revalidatePath("/groups");
}

function revalidateGroupRoutes(
  groupId: string,
  options?: {
    includeLog?: boolean;
    includeMembers?: boolean;
    includeBooks?: boolean;
    includeWeekly?: boolean;
    includeSettings?: boolean;
  },
) {
  revalidatePath(`/group/${groupId}`);

  if (options?.includeLog) {
    revalidatePath(`/group/${groupId}/log`);
  }

  if (options?.includeMembers) {
    revalidatePath(`/group/${groupId}/members`);
  }

  if (options?.includeBooks) {
    revalidatePath(`/group/${groupId}/books`);
  }

  if (options?.includeWeekly) {
    revalidatePath(`/group/${groupId}/weekly`);
  }

  if (options?.includeSettings) {
    revalidatePath(`/group/${groupId}/settings`);
  }
}

async function getGroupOwnerId(
  supabase: AuthContext["supabase"],
  groupId: string,
) {
  const ownerCheck = await getActionDbClient(supabase)
    .from("groups")
    .select("owner_id")
    .eq("id", groupId)
    .single();

  if (ownerCheck.error) {
    return null;
  }

  const owner = ownerCheck.data as GroupOwnerRow | null;
  return owner?.owner_id ?? null;
}

async function isGroupMember(
  supabase: AuthContext["supabase"],
  groupId: string,
  userId: string,
) {
  const membershipCheck = await getActionDbClient(supabase)
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipCheck.error) {
    return null;
  }

  return Boolean(membershipCheck.data);
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
    avatarUrl?: string | null;
  },
): Promise<UpsertProfileResult> {
  const context = await requireUser();
  const adminSupabase = createSupabaseAdminClient();

  if (!context) {
    return { context: null };
  }

  const profileClient = adminSupabase ?? context.supabase;
  const profileQuery = await profileClient
    .from("users")
    .select("login_id, nickname, avatar_color, avatar_url")
    .eq("id", context.user.id)
    .maybeSingle();

  if (profileQuery.error) {
    if (!adminSupabase) {
      return {
        context: null,
        error: "프로필 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      };
    }
  }

  const existingProfile = (profileQuery.data ?? null) as Pick<
    Database["public"]["Tables"]["users"]["Row"],
    "login_id" | "nickname" | "avatar_color" | "avatar_url"
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
  const fallbackAvatarUrl =
    overrides?.avatarUrl !== undefined
      ? overrides.avatarUrl ?? null
      : existingProfile?.avatar_url ?? null;

  const writeClient = adminSupabase ?? context.supabase;
  const upsertResult = await writeClient.from("users").upsert(
    {
      id: context.user.id,
      email: context.user.email ?? createAuthEmail(loginId),
      login_id: normalizeLoginId(loginId),
      nickname: fallbackNickname,
      avatar_url: fallbackAvatarUrl,
      avatar_color: fallbackAvatarColor,
    },
    { onConflict: "id" },
  );

  if (upsertResult.error) {
    return {
      context: null,
      error: "프로필 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  return { context };
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

  let query = getActionDbClient(supabase)
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

async function parseAvatarUpload(formData: FormData) {
  const removeAvatar = formData.get("removeAvatar") === "true";
  const avatarFile = formData.get("avatarFile");

  if (!(avatarFile instanceof File) || avatarFile.size === 0) {
    return {
      avatarUrl: removeAvatar ? null : undefined,
    };
  }

  if (!avatarFile.type.startsWith("image/")) {
    return {
      error: "프로필 사진은 이미지 파일만 올릴 수 있습니다.",
    };
  }

  if (avatarFile.size > 2 * 1024 * 1024) {
    return {
      error: "프로필 사진은 2MB 이하로 올려 주세요.",
    };
  }

  const arrayBuffer = await avatarFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    avatarUrl: `data:${avatarFile.type};base64,${base64}`,
  };
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

function mapCreateGroupErrorToMessage(error?: {
  code?: string;
  message?: string;
} | null) {
  if (!error) {
    return "모임을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error.code === "23503") {
    return "프로필 정보가 아직 준비되지 않았습니다. 다시 로그인한 뒤 시도해 주세요.";
  }

  if (error.message?.includes("record_start_date")) {
    return "Supabase 스키마를 다시 적용한 뒤 시도해 주세요.";
  }

  return "모임을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
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

  const profileResult = await upsertProfile({ loginId: parsed.data.loginId });

  if (profileResult.error) {
    return buildFormState("error", profileResult.error);
  }

  redirect("/groups");
}

export async function signUpWithPasswordAction(
  _prevState: FormState,
  formData: FormData,
) {
  const supabase = await createSupabaseServerClient();
  const adminSupabase = createSupabaseAdminClient();
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

  const avatarUpload = await parseAvatarUpload(formData);

  if (avatarUpload.error) {
    return buildFormState("error", avatarUpload.error);
  }

  if (!supabase) {
    return buildFormState(
      "error",
      "Supabase 설정이 아직 없어 가입 기능을 사용할 수 없습니다.",
    );
  }

  const normalizedLoginId = normalizeLoginId(parsed.data.loginId);
  const authEmail = createAuthEmail(parsed.data.loginId);

  if (adminSupabase) {
    const { error } = await adminSupabase.auth.admin.createUser({
      email: authEmail,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        loginId: normalizedLoginId,
        nickname: parsed.data.nickname,
        avatarColor: parsed.data.avatarColor,
      },
    });

    if (error) {
      return buildFormState("error", mapAuthErrorToMessage(error.message));
    }
  } else {
    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: parsed.data.password,
      options: {
        data: {
          loginId: normalizedLoginId,
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
        "서버 비밀 키를 연결하거나 Supabase에서 이메일 확인을 꺼야 바로 가입할 수 있습니다.",
      );
    }
  }

  const signInResult = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: parsed.data.password,
  });

  if (signInResult.error) {
    return buildFormState("error", mapAuthErrorToMessage(signInResult.error.message));
  }

  const profileResult = await upsertProfile({
    loginId: parsed.data.loginId,
    nickname: parsed.data.nickname,
    avatarColor: parsed.data.avatarColor,
    avatarUrl: avatarUpload.avatarUrl,
  });

  if (profileResult.error) {
    return buildFormState("error", profileResult.error);
  }

  redirectWithToast("/groups", "가입이 완료되었습니다", "positive");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/");
  }

  await supabase.auth.signOut();

  redirect("/");
}

export async function updateProfileAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = profileSchema.safeParse({
    nickname: formData.get("nickname"),
  });

  if (!parsed.success) {
    return buildFormState(
      "error",
      "프로필 정보를 다시 확인해 주세요.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const avatarUpload = await parseAvatarUpload(formData);

  if (avatarUpload.error) {
    return buildFormState("error", avatarUpload.error);
  }

  const profileResult = await upsertProfile({
    nickname: parsed.data.nickname,
    avatarUrl: avatarUpload.avatarUrl,
  });

  if (!profileResult.context) {
    return buildFormState(
      "error",
      profileResult.error ?? "로그인 후 다시 시도해 주세요.",
    );
  }

  const context = profileResult.context;

  const metadataUpdate = await context.supabase.auth.updateUser({
    data: {
      ...context.user.user_metadata,
      nickname: parsed.data.nickname,
    },
  });

  if (metadataUpdate.error) {
    return buildFormState(
      "error",
      "프로필을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const membershipsQuery = await getActionDbClient(context.supabase)
    .from("group_members")
    .select("group_id")
    .eq("user_id", context.user.id);

  const membershipGroupIds = [
    ...new Set(
      ((membershipsQuery.data ?? []) as Array<{ group_id: string }>).map(
        (membership) => membership.group_id,
      ),
    ),
  ];

  revalidatePath("/");
  revalidatePath("/groups");
  revalidatePath("/profile");

  for (const groupId of membershipGroupIds) {
    revalidateGroupRoutes(groupId, {
      includeBooks: true,
      includeLog: true,
      includeMembers: true,
      includeSettings: true,
      includeWeekly: true,
    });
  }

  refresh();

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
    recordStartDate: formData.get("recordStartDate"),
  });

  if (!parsed.success) {
    return buildFormState("error", "모임 정보를 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const profileResult = await upsertProfile();

  if (!profileResult.context) {
    if (profileResult.error) {
      return buildFormState("error", profileResult.error);
    }

    redirectWithToast("/", "먼저 로그인해 주세요", "cautionary");
  }

  const context = profileResult.context;
  const writeClient = getActionDbClient(context.supabase);

  let groupInsert = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const insertResult = await writeClient
      .from("groups")
      .insert({
        name: parsed.data.groupName,
        description: parsed.data.description || null,
        weekly_goal_type: parsed.data.weeklyGoalType,
        weekly_goal_value: parsed.data.weeklyGoalValue,
        record_start_date: parsed.data.recordStartDate,
        invite_code: inviteCode,
        owner_id: context.user.id,
      })
      .select("id")
      .single();

    if (!insertResult.error || insertResult.error.code !== "23505") {
      groupInsert = insertResult;
      break;
    }
  }

  if (!groupInsert || groupInsert.error || !groupInsert.data) {
    return buildFormState(
      "error",
      mapCreateGroupErrorToMessage(groupInsert?.error),
    );
  }

  const memberInsert = await writeClient.from("group_members").insert({
    group_id: groupInsert.data.id,
    user_id: context.user.id,
    role: "owner",
  });

  if (memberInsert.error) {
    await writeClient
      .from("groups")
      .delete()
      .eq("id", groupInsert.data.id)
      .eq("owner_id", context.user.id);

    return buildFormState("error", "모임 생성 마무리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidateGroupRoutes(groupInsert.data.id);
  revalidateGroupDirectory();
  redirectWithToast(
    `/group/${groupInsert.data.id}`,
    "모임을 만들었습니다",
    "positive",
  );
}

export async function joinGroupAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = joinGroupSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return buildFormState("error", "참여 정보를 다시 확인해 주세요.", parsed.error.flatten().fieldErrors);
  }

  const profileResult = await upsertProfile();

  if (!profileResult.context) {
    if (profileResult.error) {
      return buildFormState("error", profileResult.error);
    }

    redirectWithToast("/", "먼저 로그인해 주세요", "cautionary");
  }

  const context = profileResult.context;

  const inviteCode = parsed.data.inviteCode.trim().toUpperCase();

  const readClient = getActionDbClient(context.supabase);

  const groupQuery = await readClient
    .from("groups")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  const group = groupQuery.data as GroupRow | null;

  if (groupQuery.error) {
    return buildFormState(
      "error",
      "초대 코드를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (!group) {
    return buildFormState("error", "초대 코드를 찾지 못했습니다.", {
      inviteCode: ["초대 코드를 찾지 못했습니다."],
    });
  }

  const countQuery = await readClient
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if (countQuery.error) {
    return buildFormState(
      "error",
      "모임 인원을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if ((countQuery.count ?? 0) >= 10) {
    return buildFormState("error", "이 모임은 인원이 가득 찼습니다.", {
      inviteCode: ["이 모임은 더 이상 참여할 수 없습니다."],
    });
  }

  const existingQuery = await readClient
    .from("group_members")
    .select("*")
    .eq("group_id", group.id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (existingQuery.error) {
    return buildFormState(
      "error",
      "참여 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (existingQuery.data) {
    redirectWithToast(
      `/group/${group.id}`,
      "이미 참여한 모임입니다",
      "cautionary",
      "이미 이 모임에 참여해 있습니다.",
    );
  }

  const insert = await readClient.from("group_members").insert({
    group_id: group.id,
    user_id: context.user.id,
    role: "member",
  });

  if (insert.error) {
    return buildFormState("error", "모임에 참여하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidateGroupRoutes(group.id);
  revalidateGroupDirectory();
  redirectWithToast(`/group/${group.id}`, "모임에 참여했습니다", "positive");
}

export async function saveReadingLogAction(
  _prevState: FormState,
  formData: FormData,
) {
  const logId = String(formData.get("logId") ?? "").trim();
  const parsed = readingLogSchema.safeParse({
    groupId: formData.get("groupId"),
    date: formData.get("date"),
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
    redirectWithToast("/", "먼저 로그인해 주세요", "cautionary");
  }

  const logDate = parseDateKey(parsed.data.date);
  const readClient = getActionDbClient(context.supabase);
  const writeClient = getActionDbClient(context.supabase);
  const existingLog = logId
    ? await readClient
        .from("reading_logs")
        .select("id, book_id")
        .eq("id", logId)
        .eq("group_id", parsed.data.groupId)
        .eq("user_id", context.user.id)
        .maybeSingle()
    : null;
  const membership = await isGroupMember(
    context.supabase,
    parsed.data.groupId,
    context.user.id,
  );

  if (membership !== true) {
    return buildFormState(
      "error",
      membership === false
        ? "이 모임에 참여한 사용자만 기록할 수 있습니다."
        : "모임 참여 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (logId) {
    if (existingLog?.error) {
      return buildFormState(
        "error",
        "수정할 기록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }

    if (!existingLog?.data) {
      return buildFormState("error", "수정할 기록을 찾지 못했습니다.");
    }
  }

  const groupQuery = await readClient
    .from("groups")
    .select("record_start_date")
    .eq("id", parsed.data.groupId)
    .maybeSingle();

  if (groupQuery.error || !groupQuery.data) {
    return buildFormState(
      "error",
      "모임 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  if (parsed.data.date < groupQuery.data.record_start_date) {
    return buildFormState("error", "기록 시작일 이후부터 기록할 수 있습니다.");
  }

  const bookQuery = await readClient
    .from("books")
    .select("id, status, created_by, total_pages")
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (!bookQuery.data) {
    return buildFormState("error", "기록할 책을 찾지 못했습니다.", {
      bookId: ["기록할 책을 찾지 못했습니다."],
    });
  }

  const isEditingSameBook =
    Boolean(logId) && existingLog?.data?.book_id === parsed.data.bookId;

  if (bookQuery.data.status !== "reading" && !isEditingSameBook) {
    return buildFormState("error", "읽는 중인 책만 기록할 수 있습니다.", {
      bookId: ["읽는 중 상태의 책을 선택해 주세요."],
    });
  }

  if (bookQuery.data.created_by !== context.user.id) {
    return buildFormState("error", "내가 추가한 책만 기록할 수 있습니다.", {
      bookId: ["내가 추가한 책을 선택해 주세요."],
    });
  }

  const bookTotalPages = bookQuery.data.total_pages;
  const derivedEndPage =
    parsed.data.startPage && parsed.data.pagesRead
      ? parsed.data.startPage + parsed.data.pagesRead - 1
      : null;

  if (
    (parsed.data.startPage && parsed.data.startPage > bookTotalPages) ||
    (parsed.data.endPage && parsed.data.endPage > bookTotalPages) ||
    (derivedEndPage && derivedEndPage > bookTotalPages) ||
    parsed.data.pagesRead > bookTotalPages
  ) {
    return buildFormState("error", `전체 ${bookTotalPages}페이지를 넘길 수 없습니다.`);
  }

  const payload = {
    group_id: parsed.data.groupId,
    user_id: context.user.id,
    book_id: parsed.data.bookId,
    date: parsed.data.date,
    day_of_week: logDate.getDay(),
    did_read: true,
    pages_read: parsed.data.pagesRead,
    memo: parsed.data.memo || null,
    reading_time: null,
    start_page: parsed.data.startPage ?? null,
    end_page: parsed.data.endPage ?? null,
    mood_tag: null,
  };

  const result = logId
    ? await writeClient
        .from("reading_logs")
        .update(payload)
        .eq("id", logId)
        .eq("group_id", parsed.data.groupId)
        .eq("user_id", context.user.id)
    : await writeClient.from("reading_logs").insert(payload);

  if (result.error) {
    return buildFormState("error", "독서 기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidateGroupRoutes(parsed.data.groupId, {
    includeLog: true,
    includeMembers: true,
    includeBooks: true,
    includeWeekly: true,
  });

  redirectWithToast(
    `/group/${parsed.data.groupId}`,
    logId ? "독서 기록을 수정했습니다" : "독서 기록을 저장했습니다",
    "positive",
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

  const writeClient = getActionDbClient(context.supabase);

  const activeReadingBookCount = await countActiveReadingBooks(
    context.supabase,
    parsed.data.groupId,
    context.user.id,
  );
  const membership = await isGroupMember(
    context.supabase,
    parsed.data.groupId,
    context.user.id,
  );

  if (membership !== true) {
    return buildFormState(
      "error",
      membership === false
        ? "이 모임에 참여한 사용자만 책을 추가할 수 있습니다."
        : "모임 참여 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

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

  const insert = await writeClient.from("books").insert({
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

  revalidateGroupRoutes(parsed.data.groupId, {
    includeLog: true,
    includeMembers: true,
    includeBooks: true,
  });
  refresh();
  return buildFormState("success", "모임 책장에 책을 추가했습니다.");
}

export async function updateBookDetailsAction(
  _prevState: FormState,
  formData: FormData,
) {
  const parsed = bookDetailsUpdateSchema.safeParse({
    groupId: formData.get("groupId"),
    bookId: formData.get("bookId"),
    title: formData.get("title"),
    author: formData.get("author"),
    totalPages: formData.get("totalPages"),
  });

  if (!parsed.success) {
    return buildFormState(
      "error",
      "책 정보를 다시 확인해 주세요.",
      parsed.error.flatten().fieldErrors,
    );
  }

  const context = await requireUser();

  if (!context) {
    return buildFormState("error", "책 정보를 수정하려면 먼저 로그인해야 합니다.");
  }

  const writeClient = getActionDbClient(context.supabase);
  const membership = await isGroupMember(
    context.supabase,
    parsed.data.groupId,
    context.user.id,
  );

  if (membership !== true) {
    return buildFormState(
      "error",
      membership === false
        ? "이 모임에 참여한 사용자만 책을 수정할 수 있습니다."
        : "모임 참여 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const currentBook = await writeClient
    .from("books")
    .select("id, created_by")
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (currentBook.error || !currentBook.data) {
    return buildFormState("error", "책을 찾지 못했습니다.");
  }

  if (currentBook.data.created_by !== context.user.id) {
    return buildFormState("error", "내가 추가한 책만 수정할 수 있습니다.");
  }

  const logUsageQuery = await writeClient
    .from("reading_logs")
    .select("start_page, end_page, pages_read")
    .eq("group_id", parsed.data.groupId)
    .eq("book_id", parsed.data.bookId)
    .eq("user_id", context.user.id);

  if (logUsageQuery.error) {
    return buildFormState(
      "error",
      "기존 기록을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }

  const maxUsedPage = (logUsageQuery.data ?? []).reduce((max, log) => {
    const derivedEndPage =
      typeof log.end_page === "number"
        ? log.end_page
        : typeof log.start_page === "number"
          ? log.start_page + log.pages_read - 1
          : log.pages_read;

    return Math.max(max, derivedEndPage);
  }, 0);

  if (parsed.data.totalPages < maxUsedPage) {
    return buildFormState(
      "error",
      `전체 페이지는 이미 기록한 ${maxUsedPage}페이지보다 작게 줄일 수 없습니다.`,
      {
        totalPages: [
          `전체 페이지는 이미 기록한 ${maxUsedPage}페이지보다 작게 줄일 수 없습니다.`,
        ],
      },
    );
  }

  const update = await writeClient
    .from("books")
    .update({
      title: parsed.data.title,
      author: parsed.data.author,
      total_pages: parsed.data.totalPages,
    })
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId);

  if (update.error) {
    return buildFormState("error", "책 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  revalidateGroupRoutes(parsed.data.groupId, {
    includeBooks: true,
    includeLog: true,
  });
  refresh();

  return buildFormState("success", "책 정보를 저장했습니다.");
}

export async function updateBookStatusAction(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") ?? "");
  const parsed = bookStatusUpdateSchema.safeParse({
    groupId: formData.get("groupId"),
    bookId: formData.get("bookId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirectWithToast("/groups", "책 상태를 바꾸지 못했습니다", "negative");
  }

  const context = await requireUser();

  if (!context) {
    redirectWithToast("/", "먼저 로그인해 주세요", "cautionary");
  }

  const writeClient = getActionDbClient(context.supabase);

  const membership = await isGroupMember(
    context.supabase,
    parsed.data.groupId,
    context.user.id,
  );

  if (membership !== true) {
    redirectWithToast(
      redirectTo || `/group/${parsed.data.groupId}/books`,
      membership === false
        ? "이 모임의 책만 바꿀 수 있습니다"
        : "모임 참여 상태를 확인하지 못했습니다",
      "negative",
    );
  }

  const currentBook = await writeClient
    .from("books")
    .select("id, group_id, status, created_by")
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId)
    .maybeSingle();

  if (currentBook.error || !currentBook.data) {
    redirectWithToast(
      redirectTo || `/group/${parsed.data.groupId}/books`,
      "책을 찾지 못했습니다",
      "negative",
    );
  }

  if (currentBook.data.created_by !== context.user.id) {
    redirectWithToast(
      redirectTo || `/group/${parsed.data.groupId}/books`,
      "내 책만 바꿀 수 있습니다",
      "negative",
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
      redirectWithToast(
        redirectTo || `/group/${parsed.data.groupId}/books?book=${parsed.data.bookId}`,
        `읽는 중인 책은 ${MAX_ACTIVE_READING_BOOKS}권까지만 둘 수 있습니다`,
        "cautionary",
      );
    }
  }

  const update = await writeClient
    .from("books")
    .update({ status: parsed.data.status })
    .eq("group_id", parsed.data.groupId)
    .eq("id", parsed.data.bookId);

  if (update.error) {
    redirectWithToast(
      redirectTo || `/group/${parsed.data.groupId}/books?book=${parsed.data.bookId}`,
      "책 상태를 바꾸지 못했습니다",
      "negative",
    );
  }

  revalidateGroupRoutes(parsed.data.groupId, {
    includeLog: true,
    includeMembers: true,
    includeBooks: true,
    includeWeekly: true,
  });

  redirectWithToast(
    redirectTo || `/group/${parsed.data.groupId}/books?book=${parsed.data.bookId}`,
    parsed.data.status === "reading" ? "읽는 중으로 바꿨습니다" : "완독으로 바꿨습니다",
    "positive",
  );
}

export async function deleteReadingLogAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const logId = String(formData.get("logId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirectWithToast("/", "먼저 로그인해 주세요", "cautionary");
  }

  const writeClient = getActionDbClient(context.supabase);
  const remove = await writeClient
    .from("reading_logs")
    .delete()
    .eq("id", logId)
    .eq("group_id", groupId)
    .eq("user_id", context.user.id);

  if (remove.error) {
    redirectWithToast(`/group/${groupId}`, "기록을 삭제하지 못했습니다", "negative");
  }

  revalidateGroupRoutes(groupId, {
    includeBooks: true,
    includeLog: true,
    includeMembers: true,
    includeWeekly: true,
  });
  redirectWithToast(`/group/${groupId}`, "기록을 삭제했습니다", "positive");
}

export async function deleteBookAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const bookId = String(formData.get("bookId") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "") || `/group/${groupId}/books`;
  const context = await requireUser();

  if (!context) {
    redirectWithToast("/", "먼저 로그인해 주세요", "cautionary");
  }

  const writeClient = getActionDbClient(context.supabase);
  const membership = await isGroupMember(
    context.supabase,
    groupId,
    context.user.id,
  );

  if (membership !== true) {
    redirectWithToast(
      redirectTo,
      membership === false
        ? "이 모임의 책만 삭제할 수 있습니다"
        : "모임 참여 상태를 확인하지 못했습니다",
      "negative",
    );
  }

  const currentBook = await writeClient
    .from("books")
    .select("id, created_by")
    .eq("group_id", groupId)
    .eq("id", bookId)
    .maybeSingle();

  if (currentBook.error || !currentBook.data) {
    redirectWithToast(redirectTo, "책을 찾지 못했습니다", "negative");
  }

  if (currentBook.data.created_by !== context.user.id) {
    redirectWithToast(redirectTo, "내가 추가한 책만 삭제할 수 있습니다", "negative");
  }

  const remove = await writeClient
    .from("books")
    .delete()
    .eq("group_id", groupId)
    .eq("id", bookId);

  if (remove.error) {
    redirectWithToast(redirectTo, "책을 삭제하지 못했습니다", "negative");
  }

  revalidateGroupRoutes(groupId, {
    includeBooks: true,
    includeLog: true,
    includeMembers: true,
    includeWeekly: true,
  });
  redirectWithToast(`/group/${groupId}/books`, "책을 삭제했습니다", "positive");
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

  const ownerId = await getGroupOwnerId(context.supabase, parsed.data.groupId);
  const writeClient = getActionDbClient(context.supabase);

  if (ownerId !== context.user.id) {
    return buildFormState(
      "error",
      "이 설정은 모임장만 수정할 수 있습니다.",
    );
  }

  const update = await writeClient
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

  revalidateGroupRoutes(parsed.data.groupId, { includeSettings: true });
  revalidateGroupDirectory();
  return buildFormState("success", "모임 설정을 저장했습니다.");
}

export async function regenerateInviteCodeAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirectWithToast(`/group/${groupId}/settings`, "로그인이 필요합니다", "cautionary");
  }

  const ownerId = await getGroupOwnerId(context.supabase, groupId);
  const writeClient = getActionDbClient(context.supabase);

  if (ownerId !== context.user.id) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "모임장만 초대 코드를 바꿀 수 있습니다",
      "cautionary",
    );
  }

  const update = await writeClient
    .from("groups")
    .update({ invite_code: generateInviteCode() })
    .eq("id", groupId);

  if (update.error) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "초대 코드를 다시 만들지 못했습니다",
      "negative",
    );
  }

  revalidateGroupRoutes(groupId, { includeSettings: true });
  revalidateGroupDirectory();
  redirectWithToast(
    `/group/${groupId}/settings`,
    "초대 코드를 다시 만들었습니다",
    "positive",
  );
}

export async function removeMemberAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const memberUserId = String(formData.get("memberUserId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirectWithToast(`/group/${groupId}/settings`, "로그인이 필요합니다", "cautionary");
  }

  const ownerId = await getGroupOwnerId(context.supabase, groupId);
  const writeClient = getActionDbClient(context.supabase);

  if (ownerId !== context.user.id) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "모임장만 멤버를 내보낼 수 있습니다",
      "cautionary",
    );
  }

  if (memberUserId === context.user.id) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "모임장은 스스로 나갈 수 없습니다",
      "cautionary",
    );
  }

  const remove = await writeClient
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberUserId);

  if (remove.error) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "멤버를 내보내지 못했습니다",
      "negative",
    );
  }

  revalidateGroupRoutes(groupId, {
    includeMembers: true,
    includeWeekly: true,
    includeSettings: true,
  });
  revalidateGroupDirectory();
  redirectWithToast(`/group/${groupId}/settings`, "멤버를 내보냈습니다", "positive");
}

export async function deleteGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const context = await requireUser();

  if (!context) {
    redirectWithToast(`/group/${groupId}/settings`, "로그인이 필요합니다", "cautionary");
  }

  const ownerId = await getGroupOwnerId(context.supabase, groupId);
  const writeClient = getActionDbClient(context.supabase);

  if (ownerId !== context.user.id) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "모임장만 모임을 삭제할 수 있습니다",
      "cautionary",
    );
  }

  const remove = await writeClient.from("groups").delete().eq("id", groupId);

  if (remove.error) {
    redirectWithToast(
      `/group/${groupId}/settings`,
      "모임을 삭제하지 못했습니다",
      "negative",
    );
  }

  revalidatePath("/");
  revalidateGroupDirectory();
  redirectWithToast("/groups", "모임을 삭제했습니다", "positive");
}
