"use client";

import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
	const router = useRouter();

	return (
		<div className="container mx-auto py-8">
			<div className="flex items-center gap-4 ml-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.back()}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="text-3xl font-bold">
					Analytics Dashboard
				</h1>
			</div>
			<AnalyticsDashboard />
		</div>
	);
}
