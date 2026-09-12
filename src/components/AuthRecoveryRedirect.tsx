"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const RECOVERY_INTENT_KEY = "smartqueue-password-recovery";

function hasRecoveryIntentInUrl() {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(
    window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash,
  );

  return [queryParams, hashParams].some(
    (params) =>
      params.get("type") === "recovery" ||
      (params.has("token_hash") && params.get("type") === "recovery"),
  );
}

export function AuthRecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname === "/reset-password") {
      sessionStorage.removeItem(RECOVERY_INTENT_KEY);
      return;
    }

    let active = true;
    const recoveryIntent = hasRecoveryIntentInUrl();

    if (recoveryIntent) {
      sessionStorage.setItem(RECOVERY_INTENT_KEY, "true");
    }

    const redirectToReset = () => {
      if (!active) return;
      sessionStorage.removeItem(RECOVERY_INTENT_KEY);
      router.replace("/reset-password");
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        redirectToReset();
      }
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const storedIntent =
          sessionStorage.getItem(RECOVERY_INTENT_KEY) === "true";

        if (session && (recoveryIntent || storedIntent)) {
          redirectToReset();
        }
      })
      .catch(() => {
        // The destination page will show a recoverable error if Auth is offline.
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
