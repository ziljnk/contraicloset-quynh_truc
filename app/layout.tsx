import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/custom/Header";
import BottomNav from "@/components/custom/BottomNav";
import { ChatBot } from "@/components/custom/ChatBot";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";
import { Toaster } from "@/components/ui/sonner";
import { OutfitsProvider } from "@/context/outfits-context";
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "Contraicloset",
		template: "%s | Contraicloset",
	},
	description: "Find your perfect outfit combinations with Contraicloset.",
	metadataBase: new URL("https://www.contraicloset.com/"),
	openGraph: {
		title: "Contraicloset",
		description: "Find your perfect outfit combinations with Contraicloset.",
		url: "https://www.contraicloset.com/",
		siteName: "Contraicloset",
		images: [
			{
				url: "/og-image.png", // Ensure this image exists in your public folder
				width: 1563,
				height: 1563,
				alt: "Contraicloset",
			},
		],
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Contraicloset",
		description: "Find your perfect outfit combinations with Contraicloset.",
		images: [ "/og-image.png" ], // Ensure this image exists in your public folder
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<Analytics />
			<AnalyticsTracker />
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<OutfitsProvider>
					<Header />
					<main className="pt-16 pb-16 md:pb-0">{children}</main>
					<BottomNav />
					<ChatBot />
					<Toaster />
				</OutfitsProvider>
			</body>
		</html>
	);
}
