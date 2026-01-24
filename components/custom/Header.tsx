import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
			<div className="container mx-auto flex h-16 items-center justify-between px-4">
				<div className="flex items-center gap-2">
					<Link href="/" className="text-xl font-bold">
						ContraiCloset
					</Link>
				</div>

				<div className="flex items-center gap-2">
					<div className="hidden md:flex">
						<Button>Sign In</Button>
					</div>
					<Button variant="ghost" size="icon" className="md:hidden">
						<Menu className="h-5 w-5" />
						<span className="sr-only">Toggle menu</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
