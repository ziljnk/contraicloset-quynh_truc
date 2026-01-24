"use client";

import { useIconAnimation } from "@/hooks/use-icon-animation";
import { PlusIcon, type PlusIconHandle } from "@/components/animated-icons/plus";
import { RotateCCWIcon, type RotateCCWIconHandle } from "@/components/animated-icons/rotate-ccw";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCcw } from "lucide-react";
import Masonry from "@/components/react-bits/masonry";
import { useRandomOutfits } from "@/hooks/use-random-outfits";
import Loader from "@/components/custom/Loader";

export default function Home() {
	const plusIcon = useIconAnimation<PlusIconHandle>();
	const rotateIcon = useIconAnimation<RotateCCWIconHandle>();
	const { items, loading, refetch: fetchOutfits } = useRandomOutfits(100);

	return (
		<div className="container mx-auto py-8 px-4 md:px-12">
			<div className="flex justify-end items-center gap-5 mb-10">
				<Button 
					variant={"outline"}
					{...plusIcon.events}
				>
					<PlusIcon ref={plusIcon.ref} />
					Create outfit
				</Button>
				<Button 
					variant={"outline"}
					{...rotateIcon.events}
					onClick={() => {
						fetchOutfits();
						rotateIcon.ref.current?.startAnimation();
					}}
					className="rounded-lg"
				>
					<RotateCCWIcon ref={rotateIcon.ref} />
					Reload
				</Button>
			</div>

			{loading ? (
				<div className="flex justify-center p-10">
					<Loader />
				</div>
			) : (
				<>
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
					
					{items.length > 0 && (
						<div className="flex flex-col items-center justify-center pt-20 pb-10">
							<div className="mb-4">
								<Sparkles className="h-8 w-8 text-gray-300 fill-current" />
							</div>
							
							<h3 className="text-lg font-semibold text-[#342e29] mb-1">
								Bạn đã xem hết!
							</h3>
							
							<p className="text-gray-500 text-sm mb-6">
								Bạn đã xem tất cả các set đồ hiện có.
							</p>
							
							<Button 
								variant="outline"
								onClick={() => {
									window.scrollTo({ top: 0, behavior: 'smooth' });
									fetchOutfits();
								}}
								className="rounded-xl px-6 gap-2 border-gray-200 text-gray-600 hover:text-gray-900"
							>
								<RefreshCcw className="h-4 w-4" />
								Tải lại để xem set đồ khác
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
