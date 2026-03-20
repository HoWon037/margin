import { z } from "zod";

const avatarColorSchema = z.enum([
  "violet",
  "lightBlue",
  "green",
  "amber",
  "slate",
]);

const loginIdSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(4, "아이디는 4자 이상 입력해 주세요.")
  .max(20, "아이디는 20자 이하로 입력해 주세요.")
  .regex(/^[a-z0-9][a-z0-9._-]*$/, "아이디는 영문 소문자, 숫자, ., -, _만 사용할 수 있습니다.");

const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상 입력해 주세요.")
  .max(72, "비밀번호는 72자 이하로 입력해 주세요.");

const optionalPageSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.coerce
    .number()
    .int()
    .min(1, "페이지는 1 이상 입력해 주세요.")
    .max(5000, "페이지는 5000 이하로 입력해 주세요.")
    .optional(),
);

export const passwordSignInSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
});

export const passwordSignUpSchema = z.object({
  loginId: loginIdSchema,
  password: passwordSchema,
  nickname: z
    .string()
    .trim()
    .min(2, "이름은 2자 이상 입력해 주세요.")
    .max(24, "이름은 24자 이하로 입력해 주세요."),
  avatarColor: avatarColorSchema.default("slate"),
});

export const createGroupSchema = z.object({
  groupName: z
    .string()
    .trim()
    .min(2, "모임 이름은 2자 이상 입력해 주세요.")
    .max(40, "모임 이름은 40자 이하로 입력해 주세요."),
  description: z
    .string()
    .trim()
    .max(160, "소개는 160자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  weeklyGoalType: z.enum(["days", "pages"]),
  weeklyGoalValue: z.coerce
    .number()
    .int()
    .min(1, "주간 목표는 1 이상이어야 합니다.")
    .max(1000, "주간 목표는 1000 이하로 입력해 주세요."),
});

export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, "초대 코드는 4자 이상이어야 합니다.")
    .max(16, "초대 코드는 16자 이하로 입력해 주세요."),
  nickname: z
    .string()
    .trim()
    .min(2, "닉네임은 2자 이상 입력해 주세요.")
    .max(24, "닉네임은 24자 이하로 입력해 주세요."),
  avatarColor: avatarColorSchema,
});

export const profileSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, "이름은 2자 이상 입력해 주세요.")
    .max(24, "이름은 24자 이하로 입력해 주세요."),
  avatarColor: avatarColorSchema,
});

export const bookSchema = z.object({
  groupId: z.string().trim().min(1),
  title: z
    .string()
    .trim()
    .min(1, "책 제목을 입력해 주세요.")
    .max(80, "책 제목은 80자 이하로 입력해 주세요."),
  author: z
    .string()
    .trim()
    .min(1, "저자를 입력해 주세요.")
    .max(60, "저자명은 60자 이하로 입력해 주세요."),
  totalPages: z.coerce
    .number()
    .int()
    .min(1, "전체 페이지를 입력해 주세요.")
    .max(5000, "전체 페이지는 5000 이하로 입력해 주세요."),
});

export const bookStatusUpdateSchema = z.object({
  groupId: z.string().trim().min(1),
  bookId: z.string().trim().min(1),
  status: z.enum(["reading", "finished"]),
});

export const settingsSchema = z.object({
  groupId: z.string().trim().min(1),
  groupName: z
    .string()
    .trim()
    .min(2, "모임 이름은 2자 이상 입력해 주세요.")
    .max(40, "모임 이름은 40자 이하로 입력해 주세요."),
  description: z
    .string()
    .trim()
    .max(160, "소개는 160자 이하로 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  weeklyGoalType: z.enum(["days", "pages"]),
  weeklyGoalValue: z.coerce
    .number()
    .int()
    .min(1, "주간 목표는 1 이상이어야 합니다.")
    .max(1000, "주간 목표는 1000 이하로 입력해 주세요."),
});

export const readingLogSchema = z
  .object({
    groupId: z.string().trim().min(1),
    bookId: z.string().trim().min(1, "읽은 책을 선택해 주세요."),
    pagesRead: z.coerce
      .number()
      .int()
      .min(1, "읽은 페이지 수를 입력해 주세요.")
      .max(2000),
    memo: z
      .string()
      .trim()
      .max(220, "메모는 220자 이하로 입력해 주세요.")
      .optional()
      .or(z.literal("")),
    startPage: optionalPageSchema,
    endPage: optionalPageSchema,
  })
  .superRefine((data, ctx) => {
    const hasStartPage = typeof data.startPage === "number";
    const hasEndPage = typeof data.endPage === "number";

    if (hasStartPage !== hasEndPage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "시작 페이지와 끝 페이지를 함께 입력해 주세요.",
        path: [hasStartPage ? "endPage" : "startPage"],
      });
      return;
    }

    if (!hasStartPage || !hasEndPage) {
      return;
    }

    const startPage = data.startPage!;
    const endPage = data.endPage!;

    if (endPage < startPage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "끝 페이지는 시작 페이지보다 뒤여야 합니다.",
        path: ["endPage"],
      });
      return;
    }

    const calculatedPages = endPage - startPage + 1;

    if (calculatedPages !== data.pagesRead) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "페이지 수가 범위와 맞지 않습니다.",
        path: ["pagesRead"],
      });
    }
  });
