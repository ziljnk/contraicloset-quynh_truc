"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { trackPageView, trackVisit } from "@/utils/analytics";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const hasTrackedVisit = useRef(false);

  // Track Page Views
  useEffect(() => {
    // Only track if pathname is available. 
    // We pass user?.uid if available, otherwise it handles null.
    // We might want to wait for auth loading to finish to attribute page view to user correctly?
    // Usually analytics tracks anon views too. But our function handles userId | null.
    // If we want to strictly attribute to logged-in user, we should wait. 
    // But page view happens immediately.
    // Let's pass user.uid if exists.
    
    if (pathname) {
      trackPageView(user?.uid || null, pathname);
    }
  }, [pathname, user?.uid]);

  // Track Visit (Session start)
  useEffect(() => {
    if (!loading && user && !hasTrackedVisit.current) {
      trackVisit(user.uid, user.displayName || undefined, user.email || undefined);
      hasTrackedVisit.current = true;
    }
  }, [user, loading]);

  return null;
}
