import { Session, User } from "@supabase/supabase-js";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import * as Linking from "expo-linking";
import {getPreferredLanguage} from "../services/profile/profileService";
import {changeLanguage} from "../i18n";

/**
 * Authentication and registration state flow:
 *
 * onAuthStateChange handles Supabase Auth session changes. During registration, this can run immediately
 * after sign-up before the registration RPC has finished creating the user's profile, so registrationComplete may
 * temporarily remain false.
 *
 * RegisterScreen marks registration as in progress while the account, profile and optional documents are being
 * created. While registration is in progress, profile checks do not switch registrationComplete to true.
 *
 * After registration and optional document uploads finish, RegisterScreen clears the registration-in-progress state
 * and explicitly calls refreshRegistrationStatus(). This checks the current Supabase session again and re-checks
 * the profile which allows RootNavigator to switch from the auth flow to MainTabNavigator.
 *
 * Profile status checks may occasionally receive a transient PostgREST PGRST303 "JWT issued at future" response.
 * In that case, the session is refreshed and the profile check is retried once. A failed profile check
 * does not automatically mean that registration is incomplete.
 *
 * Password recovery is handled separately from the normal authenticated application flow.
 * A valid recovery deep link creates a temporary Supabase session and sets
 * passwordRecoveryInProgress to true. RootNavigator uses this state to render
 * ResetPasswordScreen directly. Normal registration/profile checks are skipped while
 * password recovery is in progress.
 *
 * [Summary]
 * Registration starts -> registrationInProgress = true
 * Auth session created -> onAuthStateChange -> profile may not exist yet
 * Registration RPC succeeds -> optional documents are uploaded
 * Registration finishes -> registrationInProgress = false
 * refreshRegistrationStatus -> profile exists -> MainTabNavigator
 *
 * Password recovery link -> recovery session established
 * passwordRecoveryInProgress = true -> ResetPasswordScreen
 * Password updated -> recovery session signed out
 * passwordRecoveryInProgress = false -> Login
 */

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  registrationComplete: boolean;
  registrationInProgress: boolean;
  setRegistrationInProgress: (inProgress: boolean) => void;
  refreshRegistrationStatus: () => Promise<void>;
  passwordRecoveryInProgress: boolean;
  setPasswordRecoveryInProgress: (inProgress: boolean) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({
    children
}: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registrationInProgress, setRegistrationInProgressState] = useState(false);
  const [passwordRecoveryInProgress, setPasswordRecoveryInProgressState] = useState(false);

  const registrationInProgressRef = useRef(false);
  const passwordRecoveryInProgressRef = useRef(false);

  const setRegistrationInProgress = (
      inProgress: boolean
  ) => {
    registrationInProgressRef.current = inProgress;
    setRegistrationInProgressState(inProgress);
  };

  const setPasswordRecoveryInProgress = (
      inProgress: boolean
  ) => {
    passwordRecoveryInProgressRef.current = inProgress;
    setPasswordRecoveryInProgressState(inProgress);
  };

  const syncPreferredLanguage = async (
      currentSession: Session
  )=> {
    try {
      const preferredLanguage = await getPreferredLanguage(currentSession.user.id);

      if (!preferredLanguage) {
        return;
      }

      await changeLanguage(preferredLanguage);
    } catch (error) {
      if (__DEV__) {
        console.error("[AUTH] Failed to sync preferred language:", error);
      }
    }
  };

  const checkRegistrationStatus = async (
      currentSession: Session | null,
      retryOnJwtError = true
  ) => {
    if (!currentSession) {
      setRegistrationComplete(false);
      return;
    }

    if (passwordRecoveryInProgressRef.current) {
      return;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq(
            "user_id",
            currentSession.user.id
        )
        .maybeSingle();

    if (error) {
      const isJwtIssuedAtFuture =
          error.code === "PGRST303" &&
          error.message === "JWT issued at future";

      if (isJwtIssuedAtFuture && retryOnJwtError) {
        if (__DEV__) {
          console.log(
              "[AUTH] JWT timing error detected. Refreshing session and retrying profile check."
          );
        }

        const {
          data: { session: refreshedSession },
          error: refreshError
        } = await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession) {
          if (__DEV__) {
            console.error(
                "[AUTH] Failed to refresh session:",
                refreshError
            );
          }

          return;
        }

        setSession(refreshedSession);

        await checkRegistrationStatus(
            refreshedSession,
            false
        );

        return;
      }

      if (__DEV__) {
        console.error(
            "[AUTH] Failed to check registration status:",
            error
        );
      }

      return;
    }

    if (registrationInProgressRef.current) {
      return;
    }

    setRegistrationComplete(data !== null);
  };

  const refreshRegistrationStatus = async () => {
    const {
      data: { session: currentSession },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      if (__DEV__) {
        console.error("[AUTH] Failed to refresh registration status:", error);
      }

      return;
    }

    setSession(currentSession);

    await checkRegistrationStatus(currentSession);
  }

  const handlePasswordRecoveryUrl = async (
      url: string
  ) => {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch (error) {
      if (__DEV__) {
        console.error(
            "[AUTH] Failed to parse incoming URL:",
            error
        );
      }

      return;
    }

    if (
        parsedUrl.protocol !== "bantuanku:" ||
        parsedUrl.hostname !== "reset-password"
    ) {
      return;
    }

    try {
      const hashParams = new URLSearchParams(
          parsedUrl.hash.startsWith("#")
              ? parsedUrl.hash.substring(1)
              : parsedUrl.hash
      );

      const code = parsedUrl.searchParams.get("code");
      const accessToken =
          hashParams.get("access_token") ??
          parsedUrl.searchParams.get("access_token");
      const refreshToken =
          hashParams.get("refresh_token") ??
          parsedUrl.searchParams.get("refresh_token");

      if (!code && (!accessToken || !refreshToken)) {
        if (__DEV__) {
          console.error(
              "[AUTH] Password recovery URL is missing recovery credentials."
          );
        }

        setPasswordRecoveryInProgress(false);
        return;
      }

      let recoverySession: Session | null = null;

      if (code) {
        const {
          data,
          error
        } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          if (__DEV__) {
            console.error(
                "[AUTH] Failed to exchange password recovery code:",
                error
            );
          }

          setPasswordRecoveryInProgress(false);
          return;
        }

        recoverySession = data.session;
      } else if (accessToken && refreshToken) {
        const {
          data,
          error
        } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          if (__DEV__) {
            console.error(
                "[AUTH] Failed to establish password recovery session:",
                error
            );
          }

          setPasswordRecoveryInProgress(false);
          return;
        }

        recoverySession = data.session;
      }

      if (!recoverySession) {
        if (__DEV__) {
          console.error(
              "[AUTH] Password recovery did not create a session."
          );
        }

        setPasswordRecoveryInProgress(false);
        return;
      }

      setSession(recoverySession);
      setPasswordRecoveryInProgress(true);
    } catch (error) {
      if (__DEV__) {
        console.error(
            "[AUTH] Failed to process password recovery URL:",
            error
        );
      }

      setPasswordRecoveryInProgress(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    let authSubscription: {
      unsubscribe: () => void;
    } | null = null;

    let linkingSubscription: {
      remove: () => void;
    } | null = null;

    const initializeAuth = async () => {
      const {
        data: { session: currentSession },
        error
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        if (__DEV__) {
          console.error(
              "[AUTH] Failed to restore session:",
              error
          );
        }

        setSession(null);
        setRegistrationComplete(false);
      } else {
        setSession(currentSession);

        await checkRegistrationStatus(currentSession);

        if (currentSession) {
          await syncPreferredLanguage(currentSession);
        }
      }

      if (!mounted) {
        return;
      }

      setLoading(false);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
          (event, nextSession) => {
            if (__DEV__) {
              console.log(
                  "[AUTH] Auth state changed:",
                  event,
                  {
                    hasSession: Boolean(nextSession)
                  }
              );
            }

            setSession(nextSession);

            if (event === "PASSWORD_RECOVERY") {
              setPasswordRecoveryInProgress(true);
              return;
            }

            if (!nextSession) {
              setRegistrationComplete(false);
              return;
            }

            if (passwordRecoveryInProgressRef.current) {
              return;
            }

            setTimeout(() => {
              void (async () => {
                await checkRegistrationStatus(nextSession);
                await syncPreferredLanguage(nextSession);
              })();
            }, 0);
          }
      );

      authSubscription = subscription;

      const handleUrl = ({
          url
      }: {
        url: string
      }) => {
        void handlePasswordRecoveryUrl(url);
      }

      linkingSubscription = Linking.addEventListener(
          "url",
          handleUrl
      );

      const initialUrl = await Linking.getInitialURL();

      if (!mounted) {
        return;
      }

      if (initialUrl) {
        void handlePasswordRecoveryUrl(initialUrl);
      }
    };

    void initializeAuth();

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
      linkingSubscription?.remove();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    registrationComplete,
    registrationInProgress,
    setRegistrationInProgress,
    refreshRegistrationStatus,
    passwordRecoveryInProgress,
    setPasswordRecoveryInProgress,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
