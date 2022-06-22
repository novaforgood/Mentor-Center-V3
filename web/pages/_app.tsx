import { Suspense, useCallback, useEffect, useMemo } from "react";

import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import { RecoilRoot, useRecoilState, useRecoilValue } from "recoil";
import { Provider } from "urql";

import AuthWrapper from "../components/AuthWrapper";
import { useSpaceBySlugQuery } from "../generated/graphql";
import { usePrevious } from "../hooks/usePrevious";
import { loadSession } from "../lib";
import { handleError } from "../lib/error";
import { getCurrentUser, onAuthStateChanged } from "../lib/firebase";
import { LocalStorage, LocalStorageKey } from "../lib/localStorage";
import { sessionAtom } from "../lib/recoil";
import { getUrqlClient } from "../lib/urql";
import { CustomPage } from "../types";

import type { AppProps } from "next/app";

import "../styles/globals.css";

interface UrqlProviderProps {
  children: React.ReactNode;
}
function UrqlProvider({ children }: UrqlProviderProps) {
  const session = useRecoilValue(sessionAtom);

  const client = useMemo(
    () => getUrqlClient(session?.jwt ?? ""),
    [session?.jwt]
  );

  return <Provider value={client}>{children}</Provider>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}
function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useRecoilState(sessionAtom);

  const refreshSession = useCallback(async () => {
    setSession(undefined);
    const session = await loadSession({ forceUpdateJwt: true });
    setSession(session);
  }, [setSession]);

  const refreshSessionIfNeeded = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const token = await currentUser.getIdTokenResult();
      const expiresAt = new Date(token.expirationTime).getTime();
      const expiresIn = expiresAt - Date.now();

      if (expiresIn < 180000) {
        console.log("JWT expires in 180 seconds. Refreshing session...");
        refreshSession();
      }
    }
  }, [refreshSession]);

  useEffect(() => {
    const interval = setInterval(refreshSessionIfNeeded, 2000);
    return () => {
      clearInterval(interval);
    };
  }, [refreshSessionIfNeeded]);

  useEffect(() => {
    const unsubscribeListener = onAuthStateChanged(async () => {
      // Whenever auth state changes, we no longer know what the session is.
      // We must wait for this handler to run to completion, resolving
      // the session to either authenticated or null.
      refreshSession();
    });

    return () => {
      unsubscribeListener();
    };
  }, [refreshSession]);

  if (session === undefined) {
    return <div></div>; // TODO: Add loading screen.
  }
  return <>{children}</>;
}

function App({ Component, pageProps }: AppProps) {
  const [session, setSession] = useRecoilState(sessionAtom);
  const router = useRouter();
  const spaceSlug = router.query.slug as string;
  const [{ data: spaceData }, executeQuery] = useSpaceBySlugQuery({
    pause: true,
    variables: { slug: spaceSlug },
  });
  const spaceId = spaceData?.space[0]?.id;

  const reloadSession = useCallback(
    async (spaceId: string) => {
      const session = await loadSession({
        spaceId: spaceId,
        forceUpdateJwt: true,
      });
      setSession(session);
    },
    [setSession]
  );

  // When a new spaceId is set, we need to refetch the invite links.
  useEffect(() => {
    const lastVisitedSpaceId = LocalStorage.get(
      LocalStorageKey.LastVisitedSpaceId
    );

    if (spaceId === lastVisitedSpaceId) {
      return;
    } else {
      if (spaceId) {
        console.log("Refreshing JWT...");
        reloadSession(spaceId);
        LocalStorage.set(LocalStorageKey.LastVisitedSpaceId, spaceId);
      }
    }
  }, [spaceId, setSession, reloadSession]);

  // Update space data when slug changes to a non-empty string.
  const previousSlug = usePrevious(spaceSlug);
  useEffect(() => {
    if (spaceSlug && spaceSlug !== previousSlug) {
      console.log("Re-executing space lazy query...");
      executeQuery();
    }
  }, [spaceSlug, executeQuery, previousSlug]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Toaster />
      <Component {...pageProps} />
    </Suspense>
  );
}

type CustomAppProps = AppProps & {
  Component: CustomPage;
};

function AppWrapper({ Component, ...pageProps }: CustomAppProps) {
  return (
    <RecoilRoot>
      <AuthProvider>
        <UrqlProvider>
          <AuthWrapper
            requiredAuthorizations={Component.requiredAuthorizations}
          >
            <App {...pageProps} Component={Component} />
          </AuthWrapper>
        </UrqlProvider>
      </AuthProvider>
    </RecoilRoot>
  );
}

export default AppWrapper;
