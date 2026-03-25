"use client";

import { useEffect, useState } from "react";

export function usePresence(open: boolean, duration = 220) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      const frame = window.setTimeout(() => {
        setPresent(true);
      }, 0);

      return () => {
        window.clearTimeout(frame);
      };
    }

    const timeoutId = window.setTimeout(() => {
      setPresent(false);
    }, duration);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [duration, open]);

  return present;
}
