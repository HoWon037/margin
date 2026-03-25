"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import type { UserSummary } from "@/lib/types";

interface ProfileLinkProps {
  user: UserSummary;
  href: string;
  className?: string;
}

const DRAWER_DURATION = 420;

export function ProfileLink({
  user,
  href,
  className,
}: ProfileLinkProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const hasHistoryEntryRef = useRef(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [origin, setOrigin] = useState({ x: 36, y: 28 });

  const openDrawer = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openFrameRef.current) {
      window.cancelAnimationFrame(openFrameRef.current);
    }

    const rect = buttonRef.current?.getBoundingClientRect();

    if (rect) {
      setOrigin({
        x: Math.max(24, rect.width * 0.45),
        y: Math.max(20, rect.height * 0.55),
      });
    }

    setRendered(true);
    openFrameRef.current = window.requestAnimationFrame(() => {
      if (!hasHistoryEntryRef.current) {
        window.history.pushState(
          {
            ...(window.history.state ?? {}),
            __profileDrawer: true,
          },
          "",
          window.location.href,
        );
        hasHistoryEntryRef.current = true;
      }
      setVisible(true);
      openFrameRef.current = null;
    });
  };

  const closeDrawer = (options?: { fromHistory?: boolean }) => {
    setVisible(false);
    if (options?.fromHistory) {
      hasHistoryEntryRef.current = false;
    } else if (hasHistoryEntryRef.current) {
      hasHistoryEntryRef.current = false;
      window.history.back();
    }
    closeTimeoutRef.current = window.setTimeout(() => {
      setRendered(false);
      closeTimeoutRef.current = null;
    }, DRAWER_DURATION);
  };

  useEffect(() => {
    if (!rendered) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };
    const handlePopState = () => {
      if (hasHistoryEntryRef.current) {
        closeDrawer({ fromHistory: true });
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [rendered]);

  useEffect(() => {
    return () => {
      if (openFrameRef.current) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <button
        className={cn(
          "chrome-surface inline-flex min-w-0 items-center gap-3 rounded-full border border-line-solid/90 px-2.5 py-2 shadow-xs transition-[background-color,border-color,box-shadow,transform,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hover:bg-fill-alternative",
          className,
        )}
        onClick={openDrawer}
        ref={buttonRef}
        type="button"
      >
        <Avatar
          avatarUrl={user.avatarUrl}
          name={user.nickname}
          size="sm"
          tone={user.avatarColor}
        />
        <div className="min-w-0">
          <p className="truncate type-label text-label-strong">{user.nickname}</p>
        </div>
      </button>

      {rendered
        ? createPortal(
            <div
              aria-hidden={!visible}
              className={cn(
                "fixed inset-0 z-[120] bg-dimmer/52 backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                visible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              onClick={() => closeDrawer()}
            >
              <aside
                aria-modal="true"
                className={cn(
                  "relative z-[121] ml-3 mt-3 h-[calc(100dvh-1.5rem)] w-[min(22rem,calc(100vw-1.5rem))] rounded-[28px] border border-line-solid px-5 py-6 shadow-lg will-change-transform transition-[transform,opacity,box-shadow] duration-[420ms] ease-[cubic-bezier(0.18,0.96,0.24,1)] sm:px-6",
                  visible
                    ? "translate-x-0 translate-y-0 scale-100 opacity-100"
                    : "-translate-x-1.5 -translate-y-0.5 scale-[0.985] opacity-0",
                )}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                style={{
                  background: "var(--bgElevated)",
                  transformOrigin: `${origin.x}px ${origin.y}px`,
                }}
              >
                <div
                  className={cn(
                    "space-y-5 transition-[opacity,transform] duration-[440ms] ease-[cubic-bezier(0.18,0.96,0.24,1)]",
                    visible ? "translate-x-0 opacity-100" : "translate-x-1.5 opacity-0",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        avatarUrl={user.avatarUrl}
                        name={user.nickname}
                        size="lg"
                        tone={user.avatarColor}
                      />
                      <div className="min-w-0">
                        <p className="truncate type-headline text-label-strong">
                          {user.nickname}
                        </p>
                      </div>
                    </div>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line-solid text-label-assistive transition md:hover:bg-fill-alternative md:hover:text-label-strong"
                      onClick={() => closeDrawer()}
                      type="button"
                    >
                      <span className="sr-only">닫기</span>
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M4 4l8 8M12 4 4 12"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="h-px bg-line-solid" />

                  <nav className="space-y-2">
                    <Link
                      className="flex items-center rounded-2xl px-3 py-3 type-label text-label-strong transition md:hover:bg-fill-alternative"
                      href={href}
                      onClick={() => closeDrawer({ fromHistory: true })}
                    >
                      프로필 변경
                    </Link>
                    <Link
                      className="flex items-center rounded-2xl px-3 py-3 type-label text-label-strong transition md:hover:bg-fill-alternative"
                      href="/groups"
                      onClick={() => closeDrawer({ fromHistory: true })}
                    >
                      내 모임
                    </Link>
                  </nav>

                  <div className="h-px bg-line-solid" />

                  <form action={signOutAction}>
                    <button
                      className="flex w-full items-center rounded-2xl px-3 py-3 text-left type-label text-negative transition md:hover:bg-negative/10"
                      type="submit"
                    >
                      로그아웃
                    </button>
                  </form>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
