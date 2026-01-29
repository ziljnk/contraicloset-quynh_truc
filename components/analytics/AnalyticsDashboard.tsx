"use client";

import { useEffect, useState } from "react";
import {
  getTotalUniqueUsers,
  getTopUsers,
  getTopPages,
  getUniqueUsersOverTime,
  getTotalUsageOverTime,
  UserProfile,
  PageStat,
  DailyStat,
} from "@/utils/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalUniqueUsers, setTotalUniqueUsers] = useState(0);
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [topPages, setTopPages] = useState<PageStat[]>([]);
  const [userTrend, setUserTrend] = useState<DailyStat[]>([]);
  const [usageTrend, setUsageTrend] = useState<DailyStat[]>([]);
  
  // State for "Show More Users"
  const [showAllUsers, setShowAllUsers] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          uniqueUsers,
          tUsers,
          tPages,
          uTrend,
          pTrend
        ] = await Promise.all([
          getTotalUniqueUsers(),
          getTopUsers(50), // Fetch more to allow expanding
          getTopPages(20),
          getUniqueUsersOverTime(30),
          getTotalUsageOverTime(30)
        ]);

        setTotalUniqueUsers(uniqueUsers);
        setTopUsers(tUsers);
        setTopPages(tPages);
        setUserTrend(uTrend);
        setUsageTrend(pTrend);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }

  // Calculate max views for progress bar scaling
  const maxPageViews = Math.max(...topPages.map(p => p.viewCount), 1);
  
  // Visible users logic
  const visibleUsers = showAllUsers ? topUsers : topUsers.slice(0, 5);

  return (
    <div className="space-y-6 bg-background p-4 md:p-6 opacity-100 mb-30">
      {/* 1. KPI Section - Full Width */}
      <Card className="w-full border-none shadow-sm drop-shadow-sm bg-white">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
             <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Unique Users</p>
            <h2 className="text-3xl font-bold text-gray-900">{totalUniqueUsers}</h2>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Main Content) - Span 2 */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Top Users Card */}
            <Card className="border-none shadow-sm drop-shadow-sm bg-white">
                 <CardHeader>
                    <CardTitle className="text-sm font-semibold">Top Users</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="space-y-4">
                        {visibleUsers.map((user, index) => (
                            <div key={user.id} className="flex items-center text-sm py-2 border-b last:border-0 border-gray-100">
                                <div className="w-8 flex justify-center items-center">
                                    <span className={cn(
                                        "w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium",
                                        index < 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                                    )}>
                                        {index + 1}
                                    </span>
                                </div>
                                <div className="flex-1 ml-4">
                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold text-gray-900">{user.visitCount}</span>
                                    <span className="text-xs text-gray-500 ml-1">visits</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {topUsers.length > 5 && (
                        <div className="mt-4 flex justify-center">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowAllUsers(!showAllUsers)}
                                className="text-xs text-gray-500 hover:text-gray-900"
                            >
                                {showAllUsers ? "Show Less Users" : "Show More Users"}
                                {showAllUsers ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                            </Button>
                        </div>
                    )}
                 </CardContent>
            </Card>

            {/* Unique Users Over Time (Green) */}
            <Card className="border-none shadow-sm drop-shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Unique Users Over Time (Last 30 Days)</CardTitle>
                    <p className="text-xs text-muted-foreground">Tracks the number of distinct users accessing your app each day</p>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userTrend}>
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="count" fill="#4ade80" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Total Usage Over Time (Orange) */}
            <Card className="border-none shadow-sm drop-shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Total Usage Over Time (Last 30 Days)</CardTitle>
                    <p className="text-xs text-muted-foreground">Shows the total number of visits/views to your app, including repeat visits</p>
                </CardHeader>
                <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={usageTrend}>
                            <XAxis 
                                dataKey="date" 
                                fontSize={10} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => val.split('-').slice(1).join('/')}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="count" fill="#fb923c" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        {/* Right Column (Side Content) - Span 1 */}
        <div className="space-y-6">
             {/* Top Pages Card */}
             <Card className="border-none shadow-sm drop-shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="text-sm font-semibold">Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {topPages.map((page, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="truncate max-w-[70%]">{page.pageName}</span>
                                    <span>{page.viewCount} views</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 rounded-full transition-all duration-500" 
                                        style={{ width: `${(page.viewCount / maxPageViews) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
