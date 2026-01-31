"use client";

import Link from "next/link";
import { Lock, Loader2, LogOut, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "firebase/auth";
import { auth } from "@/utils/firebase";
import { useRouter } from "next/navigation";
import { useSavedOutfits } from "@/hooks/use-saved-outfits";
import Masonry from "@/components/react-bits/masonry";

export default function BookmarkPage() {
	const { user, loading: authLoading } = useAuth();
	const { items, loading: outfitsLoading } = useSavedOutfits();
	const router = useRouter();

	const handleLogout = async () => {
		try {
			await signOut(auth);
			router.push("/login");
		} catch (error) {
			console.error("Error signing out:", error);
		}
	};

	if (authLoading) {
		return (
			<div className="flex h-[80vh] w-full items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex h-[80vh] w-full flex-col items-center justify-center px-4">
				<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
					<Lock className="h-8 w-8 text-gray-500" />
				</div>

				<h1 className="mb-2 text-xl font-semibold text-[#342e29]">
					Yêu cầu đăng nhập
				</h1>

				<p className="mb-8 max-w-xs text-center text-sm text-gray-500">
					Đăng nhập để tạo outfit và xem các set đồ đã lưu của bạn
				</p>

				<Link href="/login">
					<Button className="h-10 px-8 font-medium">Đăng nhập</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white p-4 pb-24">
			{/* Header Section */}
			<div className="relative mb-12 flex flex-col items-center pt-8">
				<h1 className="text-2xl font-bold text-[#342e29] mb-2">
					Các set đồ đã lưu của tôi
				</h1>
				<p className="text-sm text-gray-500">
					Bộ sưu tập cảm hứng phong cách của bạn
				</p>
			</div>

			{/* Content Section */}
			{outfitsLoading ?
				<div className="flex h-[50vh] w-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-gray-500" />
				</div>
			: items.length > 0 ?
				<div className="container mx-auto px-4 py-8 md:px-12">
					<Masonry
						items={items}
						ease="power3.out"
						duration={0.6}
						stagger={0.05}
						animateFrom="bottom"
						scaleOnHover
						hoverScale={0.95}
						blurToFocus
						colorShiftOnHover={false}
					/>
				</div>
			:	/* Empty State Content */
				<div className="flex flex-col items-center justify-center pt-10">
					<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
						<Bookmark className="h-8 w-8 text-gray-400" />
					</div>

					<h2 className="mb-2 text-lg font-medium text-[#342e29]">
						Chưa có set đồ nào được lưu
					</h2>

					<p className="mb-8 text-center text-sm text-gray-500 max-w-md">
						Khám phá bảng tin và lưu lại những set đồ bạn yêu thích!
					</p>

					<Link href="/">
						<Button className="h-10 px-8 font-medium">
							Tìm cảm hứng
						</Button>
					</Link>
				</div>
			}
		</div>
	);
}
