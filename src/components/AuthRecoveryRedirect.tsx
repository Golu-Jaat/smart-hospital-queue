"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const RECOVERY_INTENT_KEY = "smartqueue-password-recovery";

function getStoredRecoveryIntent() {
  try {
    return sessionStorage.getItem(RECOVERY_INTENT_KEY) === "true";
  } catch {
    return false;
  }
}

function storeRecoveryIntent() {
  try {
    sessionStorage.setItem(RECOVERY_INTENT_KEY, "true");
  } catch {
    // Auth events still provide the primary recovery signal.
  }
}

function clearRecoveryIntent() {
  try {
    sessionStorage.removeItem(RECOVERY_INTENT_KEY);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

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
      clearRecoveryIntent();
      return;
    }

    let active = true;
    const recoveryIntent = hasRecoveryIntentInUrl();

    if (recoveryIntent) {
      storeRecoveryIntent();
    }

    const redirectToReset = () => {
      if (!active) return;
      const callbackParameters = `${window.location.search}${window.location.hash}`;
      clearRecoveryIntent();
      router.replace(`/reset-password${callbackParameters}`);
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
      .then(() => {
        if (recoveryIntent || getStoredRecoveryIntent()) {
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
