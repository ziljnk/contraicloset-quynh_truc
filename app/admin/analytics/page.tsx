"use client";

import { AdminView } from "@/components/custom/AdminView";
import {
	Bar,
	BarChart,
	CartesianGrid,
	XAxis,
	ResponsiveContainer,
} from "recharts";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Users } from "lucide-react";

// Mock Data
const topUsers = [
	{
		id: 1,
		name: "21.Thanh Huy",
		email: "nupakachizing@gmail.com",
		visits: 283,
	},
	{
		id: 2,
		name: "Trúc Đặng Nguyễn Quỳnh",
		email: "sadquynhtruc.work@gmail.com",
		visits: 178,
	},
	{
		id: 3,
		name: "Gia Phú",
		email: "nguyengiaphu2k4@gmail.com",
		visits: 165,
	},
	{
		id: 4,
		name: "Minh Hiếu",
		email: "minhhieu1611@gmail.com",
		visits: 143,
	},
	{
		id: 5,
		name: "Thuận Minh",
		email: "thuanduongminh03@gmail.com",
		visits: 119,
	},
	{ id: 6, name: "Hưng Nguyễn", email: "huanhungne2k1@gmail.com", visits: 61 },
	{
		id: 7,
		name: "Phát Nguyễn",
		email: "nguyenductienphat.official@gmail.com",
		visits: 49,
	},
	{ id: 8, name: "Bảo Long", email: "tron4320@gmail.com", visits: 48 },
	{
		id: 9,
		name: "dennis vn Nguyễn",
		email: "thaihoan40@gmail.com",
		visits: 39,
	},
	{
		id: 10,
		name: "Bounthavy INTHAVONG MR",
		email: "bounthavyinthavongmr@gmail.com",
		visits: 37,
	},
];

const topPages = [
	{ name: "Outfit Detail", views: 2092 },
	{ name: "Home", views: 1543 },
	{ name: "Search", views: 932 },
	{ name: "Profile", views: 543 },
	{ name: "Create Outfit", views: 321 },
];

const uniqueUsersData = Array.from({ length: 30 }, (_, i) => ({
	date: `01/${i + 1}`,
	users: Math.floor(Math.random() * 20) + 10,
}));

const totalUsageData = Array.from({ length: 30 }, (_, i) => ({
	date: `01/${i + 1}`,
	usage: Math.floor(Math.random() * 200) + 100,
}));

const uniqueUsersConfig = {
	users: {
		label: "Users",
		color: "#4ade80", // green-400
	},
} satisfies ChartConfig;

const totalUsageConfig = {
	usage: {
		label: "Usage",
		color: "#fb923c", // orange-400
	},
} satisfies ChartConfig;

export default function AnalyticsPage() {
	return (
		<AdminView>
			<div className="container mx-auto space-y-8 p-8">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">Analytics Dashboard</h1>
						<p className="text-muted-foreground">Quản lí cá nhân</p>
					</div>
				</div>

				{/* Total Unique Users Card */}
				<div className="rounded-xl border bg-card p-6 shadow-sm">
					<div className="flex items-center gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
							<Users className="h-6 w-6" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Total Unique Users
							</p>
							<h2 className="text-3xl font-bold">311</h2>
						</div>
					</div>
				</div>

				<div className="grid gap-8 lg:grid-cols-2">
					{/* Top Users List */}
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<h3 className="mb-4 text-lg font-semibold">Top Users</h3>
						<div className="space-y-4">
							{topUsers.map((user, index) => (
								<div
									key={user.id}
									className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
								>
									<div className="flex items-center gap-3">
										<span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
											{index + 1}
										</span>
										<div>
											<p className="font-medium text-sm">{user.name}</p>
											<p className="text-xs text-muted-foreground">
												{user.email}
											</p>
										</div>
									</div>
									<span className="text-sm font-semibold">
										{user.visits} visits
									</span>
								</div>
							))}
							<div className="pt-2 text-center text-sm text-muted-foreground">
								Show More Users
							</div>
						</div>
					</div>

					{/* Top Pages */}
					<div className="space-y-6">
						<div className="rounded-xl border bg-card p-6 shadow-sm h-fit">
							<h3 className="mb-6 text-lg font-semibold">Top Pages</h3>
							<div className="space-y-6">
								{topPages.map((page) => (
									<div key={page.name} className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="font-medium">{page.name}</span>
											<span className="text-muted-foreground">
												{page.views} views
											</span>
										</div>
										<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
											<div
												className="h-full bg-green-500 transition-all duration-300 ease-in-out"
												style={{
													width: `${(page.views / 2500) * 100}%`,
												}}
											/>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Charts */}
				<div className="grid gap-8">
					{/* Unique Users Over Time */}
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<h3 className="mb-6 text-lg font-semibold">
							Unique Users Over Time (Last 30 Days)
						</h3>
						<p className="mb-4 text-xs text-muted-foreground">
							Tracks the number of distinct users accessing your app each day
						</p>
						<div className="h-[300px] w-full">
							<ChartContainer config={uniqueUsersConfig} className="h-full w-full">
								<BarChart data={uniqueUsersData}>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
                                        minTickGap={32}
									/>
									<ChartTooltip
										content={<ChartTooltipContent indicator="dashed" />}
									/>
									<Bar
										dataKey="users"
										fill="var(--color-users)"
										radius={4}
									/>
								</BarChart>
							</ChartContainer>
						</div>
					</div>

					{/* Total Usage Over Time */}
					<div className="rounded-xl border bg-card p-6 shadow-sm">
						<h3 className="mb-6 text-lg font-semibold">
							Total Usage Over Time (Last 30 Days)
						</h3>
						<p className="mb-4 text-xs text-muted-foreground">
							Shows the total number of visits to your app, including repeat
							visits
						</p>
						<div className="h-[300px] w-full">
							<ChartContainer config={totalUsageConfig} className="h-full w-full">
								<BarChart data={totalUsageData}>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickLine={false}
										tickMargin={10}
										axisLine={false}
                                        minTickGap={32}
									/>
									<ChartTooltip
										content={<ChartTooltipContent indicator="dashed" />}
									/>
									<Bar
										dataKey="usage"
										fill="var(--color-usage)"
										radius={4}
									/>
								</BarChart>
							</ChartContainer>
						</div>
					</div>
				</div>
			</div>
		</AdminView>
	);
}
