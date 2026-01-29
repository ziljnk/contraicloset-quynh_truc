import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  increment,
  arrayUnion,
  addDoc,
  serverTimestamp,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";

// --- Types ---

export interface ActiveUser {
  userId: string;
  count: number;
}

export interface UserProfile {
  id: string; // userId
  name: string;
  email: string;
  visitCount: number;
  lastVisit: any; // Timestamp
}

export interface PageStat {
  pageName: string;
  viewCount: number;
}

export interface DailyStat {
  date: string;
  count: number;
}

// --- Helper: Timeout Wrapper ---
const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), ms)
    ),
  ]);
};

// --- Helper: Date Formatting ---
const getTodayStr = () => {
  return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
};

const getDateStr = (date: Date) => {
  return date.toISOString().split("T")[0];
};

// --- Tracking Logic ---

export const trackVisit = async (
  userId: string,
  userName?: string,
  userEmail?: string
) => {
  if (!userId) return;
  const today = getTodayStr();

  try {
    // 1. Update daily analytics (analytics/YYYY-MM-DD)
    const analyticsRef = doc(db, "analytics", today);
    // Use setDoc with merge to ensure document exists
    await setDoc(
      analyticsRef,
      {
        users: arrayUnion(userId),
        date: today,
      },
      { merge: true }
    );

    // 2. Update user profile (user_profiles/userId)
    const userRef = doc(db, "user_profiles", userId);
    const userData: any = {
      visitCount: increment(1),
      lastVisit: serverTimestamp(),
    };
    // Only update name/email if provided
    if (userName) userData.userName = userName;
    if (userEmail) userData.userEmail = userEmail;

    await setDoc(userRef, userData, { merge: true });
  } catch (error: any) {
    if (error.code === "permission-denied") {
      console.warn(
        "Analytics: Visit tracking failed. Ensure Firestore Rules allow writes to 'analytics' and 'user_profiles'."
      );
    } else {
      console.error("Error tracking visit:", error);
    }
  }
};

export const trackPageView = async (userId: string | null, pageName: string) => {
  if (!pageName) return;
  const today = getTodayStr();
  const validUserId = userId || "anonymous";

  try {
    // 1. Log raw page view (page_views)
    const pageViewsRef = collection(db, "page_views");
    await addDoc(pageViewsRef, {
      userId: validUserId,
      pageName: pageName,
      timestamp: serverTimestamp(),
      date: today, // added for easier querying if needed
    });

    // 2. Update aggregated page stats (page_stats/YYYY-MM-DD-pageName)
    // Replace slashes in pageName to avoid Firestore path issues
    const safePageName = pageName.replace(/\//g, "_");
    const statId = `${today}-${safePageName}`;
    const pageStatRef = doc(db, "page_stats", statId);
    
    await setDoc(
      pageStatRef,
      {
        pageName: pageName, // store explicitly
        date: today,        // store explicitly
        viewCount: increment(1),
      },
      { merge: true }
    );
  } catch (error: any) {
    if (error.code === "permission-denied") {
      console.warn(
        "Analytics: Tracking failed due to permissions. Ensure Firestore Rules allow writes to 'page_views' and 'page_stats'."
      );
    } else {
      console.error("Error tracking page view:", error);
    }
  }
};

// --- Analytics Retrieval Logic ---

export const getTotalUniqueUsers = async (): Promise<number> => {
  try {
    const coll = collection(db, "user_profiles");
    const snapshot = await withTimeout(getCountFromServer(coll));
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting total unique users:", error);
    return 0;
  }
};

export const getTopUsers = async (limitCount: number = 10): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, "user_profiles"),
      orderBy("visitCount", "desc"),
      limit(limitCount)
    );
    const snapshot = await withTimeout(getDocs(q));
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.userName || data.name, // Support both new and old field names
        email: data.userEmail || data.email,
        visitCount: data.visitCount,
        lastVisit: data.lastVisit,
      };
    }) as UserProfile[];
  } catch (error) {
    console.error("Error getting top users:", error);
    return [];
  }
};

export const getTopPages = async (limitCount: number = 10): Promise<PageStat[]> => {
  try {
    // Since we need to aggregate across all days, we fetch all page_stats
    // Optimization: In a real app with massive data, this should be done via Cloud Functions
    // For this requirements, we fetch client side.
    
    // Note: If data is huge, we should limit to recent e.g. 30 days. 
    // But request says "aggregate viewCount of ALL days".
    const snapshot = await withTimeout(getDocs(collection(db, "page_stats")));
    
    const aggregation: Record<string, number> = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.pageName;
      const amount = data.viewCount || 0;
      if (name) {
        aggregation[name] = (aggregation[name] || 0) + amount;
      }
    });

    const sorted = Object.entries(aggregation)
      .map(([pageName, viewCount]) => ({ pageName, viewCount }))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limitCount);

    return sorted;
  } catch (error) {
    console.error("Error getting top pages:", error);
    return [];
  }
};

export const getUniqueUsersOverTime = async (days: number = 30): Promise<DailyStat[]> => {
  try {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getDateStr(d));
    }

    // Parallel fetch is faster but be mindful of connection limits
    const promises = dates.map(async (date) => {
      const dRef = doc(db, "analytics", date);
      const snap = await getDoc(dRef);
      let count = 0;
      if (snap.exists()) {
        const data = snap.data();
        if (data.users && Array.isArray(data.users)) {
          count = data.users.length;
        }
      }
      return { date, count };
    });

    return await withTimeout(Promise.all(promises));
  } catch (error) {
    console.error("Error getting unique users over time:", error);
    return [];
  }
};

export const getTotalUsageOverTime = async (days: number = 30): Promise<DailyStat[]> => {
  try {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(getDateStr(d));
    }

    // Since page_stats contains { date: 'YYYY-MM-DD', viewCount: X }
    // We can query page_stats by date.
    
    const promises = dates.map(async (date) => {
      // Query page_stats where date == date
      const q = query(collection(db, "page_stats"), where("date", "==", date));
      const snap = await getDocs(q);
      let total = 0;
      snap.forEach(d => {
        total += d.data().viewCount || 0;
      });
      return { date, count: total };
    });

    return await withTimeout(Promise.all(promises));
  } catch (error) {
    console.error("Error getting total usage over time:", error);
    return [];
  }
};
