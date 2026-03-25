"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { GroupSettingsPanel } from "@/components/settings/group-settings-panel";
import { cn } from "@/lib/cn";
import type { GroupSummary, MemberSummary } from "@/lib/types";

interface GroupSettingsDrawerProps {
  group: GroupSummary;
  members: MemberSummary[];
  isOwner: boolean;
  className?: string;
}

const DRAWER_DURATION = 420;

export function GroupSettingsDrawer({
  group,
  members,
  isOwner,
  className,
}: GroupSettingsDrawerProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);
  const hasHistoryEntryRef = useRef(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const [origin, setOrigin] = useState({ x: 56, y: 24 });

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
        x: Math.max(28, rect.width * 0.72),
        y: Math.max(20, rect.height * 0.55),
      });
    }

    setRendered(true);
    openFrameRef.current = window.requestAnimationFrame(() => {
      if (!hasHistoryEntryRef.current) {
        window.history.pushState(
          {
            ...(window.history.state ?? {}),
            __groupSettingsDrawer: true,
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
        className={className}
        onClick={openDrawer}
        ref={buttonRef}
        type="button"
      >
        관리
      </button>

      {rendered
        ? createPortal(
            <div
              aria-hidden={!visible}
              className={cn(
                "fixed inset-0 z-[125] bg-dimmer/54 transition-opacity duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                visible ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              onClick={() => closeDrawer()}
            >
              <aside
                aria-modal="true"
                className={cn(
                  "absolute right-3 top-3 z-[126] h-[calc(100dvh-1.5rem)] w-[min(42rem,calc(100vw-1.5rem))] overflow-hidden rounded-[28px] border border-line-solid shadow-xl transition-[transform,opacity,box-shadow] duration-[420ms] ease-[cubic-bezier(0.18,0.96,0.24,1)]",
                  visible
                    ? "translate-x-0 translate-y-0 scale-100 opacity-100"
                    : "translate-x-2 -translate-y-0.5 scale-[0.985] opacity-0",
                )}
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                style={{
                  background: "var(--bgElevated)",
                  transformOrigin: `calc(100% - ${origin.x}px) ${origin.y}px`,
                }}
              >
                <div className="h-full overflow-y-auto px-4 pb-8 pt-5 [scrollbar-gutter:stable] sm:px-6">
                  <div className="mx-auto max-w-[920px] space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="type-title2 text-label-strong">관리</p>
                        <p className="type-body text-label-alternative">
                          모임 정보와 멤버, 초대 코드를 관리합니다.
                        </p>
                      </div>
                      <button
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line-solid text-label-assistive transition md:hover:bg-fill-alternative md:hover:text-label-strong"
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

                    <GroupSettingsPanel
                      group={group}
                      groupId={group.id}
                      isOwner={isOwner}
                      members={members}
                    />
                  </div>
                </div>
              </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
