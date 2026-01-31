"use client";

import Link from "next/link";
import { Bell, BarChart2, Plus, X, ClipboardList, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	collection,
	query,
	orderBy,
	limit,
	onSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/utils/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

function timeAgo(date: any) {
	if (!date) return "";
	const now = new Date();
	const past = date.toDate ? date.toDate() : new Date(date);
	const diffMs = now.getTime() - past.getTime();
	const diffSec = Math.round(diffMs / 1000);
	const diffMin = Math.round(diffSec / 60);
	const diffHour = Math.round(diffMin / 60);
	const diffDay = Math.round(diffHour / 24);
	const diffMonth = Math.round(diffDay / 30);

	if (diffMin < 1) return "Vừa xong";
	if (diffMin < 60) return `${diffMin} phút trước`;
	if (diffHour < 24) return `${diffHour} giờ trước`;
	if (diffDay < 30) return `${diffDay} ngày trước`;
	if (diffMonth < 12) return `${diffMonth} tháng trước`;
	return "Hơn 1 năm trước";
}

export default function Header() {
	const { isAdmin, user } = useAuth();
	const [notifications, setNotifications] = useState<any[]>([]);
	const [open, setOpen] = useState(false);
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await signOut(auth);
			router.push("/login");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	useEffect(() => {
		if (!isAdmin) return;

		const q = query(
			collection(db, "reports"),
			orderBy("createdAt", "desc"),
			limit(20),
		);

		const unsubscribe = onSnapshot(q, (snapshot) => {
			const reports = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}));
			setNotifications(reports);
		});

		return () => unsubscribe();
	}, [isAdmin]);

	return (
		<header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<Link href="/" className="text-xl font-bold">
						Contraicloset
					</Link>
				</div>

				<div className="flex items-center gap-2">
					{isAdmin && (
						<>
							<Popover open={open} onOpenChange={setOpen}>
								<PopoverTrigger asChild>
									<Button size="icon" className="relative">
										<Bell className="h-5 w-5" />
										{notifications.some(
											(n: any) => !n.isRead,
										) && (
											<span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-background" />
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-80 p-0"
									align="end"
								>
									<div className="flex items-center justify-between px-4 py-3 border-b">
										<h4 className="font-semibold text-sm">
											Thông báo
										</h4>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 rounded-full hover:bg-muted"
											onClick={() => setOpen(false)}
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
									<div className="max-h-[70vh] overflow-y-auto">
										{notifications.map((item) => (
											<Link
												key={item.id}
												href={`/admin/pending-outfit/${item.outfitId}?reportId=${item.id}`}
												className="flex gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer text-left group"
											>
												<div className="h-10 w-10 flex items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0 group-hover:bg-blue-200 transition-colors">
													<ClipboardList className="h-5 w-5" />
												</div>
												<div className="flex-1 space-y-1">
													<div className="flex justify-between items-start">
														<p className="text-sm font-semibold leading-none truncate pr-2">
															{item.userEmail}
														</p>
														{!item.isRead && (
															<div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-0.5" />
														)}
													</div>
													<p className="text-xs text-muted-foreground">
														{item.reasons?.[0] ||
															item.type}
													</p>
													<p className="text-xs text-gray-600 line-clamp-2 mt-1">
														{item.details}
													</p>
													<div className="flex items-center gap-1 text-[10px] text-muted-foreground pt-1">
														<span>
															{timeAgo(
																item.createdAt,
															)}
														</span>
														<span>•</span>
														<span className="truncate max-w-[120px]">
															{item.outfitTitle}
														</span>
													</div>
												</div>
											</Link>
										))}
										{notifications.length === 0 && (
											<div className="p-8 text-center text-sm text-muted-foreground">
												Không có thông báo mới
											</div>
										)}
									</div>
								</PopoverContent>
							</Popover>
							<Link href="/admin/analytics">
								<Button>
									<BarChart2 className="md:mr-2 h-4 w-4" />
									<span className="hidden md:inline-block">
										Analytics
									</span>
								</Button>
							</Link>
							<Link href="/admin/create-outfit">
								<Button className="rounded-full">
									<Plus className="md:mr-2 h-4 w-4" />
									<span className="hidden md:inline-block">
										Tạo mới
									</span>
								</Button>
							</Link>
						</>
					)}
					{user && (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button className="rounded-full">
									<LogOut className="h-4 w-4" />
									<span className="hidden md:inline-block">
										Đăng xuất
									</span>
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Bạn có chắc chắn muốn đăng xuất?
									</AlertDialogTitle>
									<AlertDialogDescription>
										Bạn sẽ cần phải đăng nhập lại để truy cập
										vào tài khoản của mình.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Hủy</AlertDialogCancel>
									<AlertDialogAction onClick={handleLogout}>
										Đăng xuất
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>
		</header>
	);
}
