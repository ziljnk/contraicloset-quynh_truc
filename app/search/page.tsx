import Masonry from "@/components/react-bits/masonry";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { MOCK_IMAGES } from "@/constant/mock_images";

export default function SearchPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8 space-y-6 w-full flex flex-col items-center justify-start">
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold tracking-tight">
						Find and Discovery
					</h1>
					<p className="text-muted-foreground text-lg">
						Find your inspiration
					</p>
				</div>
				<div className="flex w-full gap-2 overflow-x-auto pb-2 items-center justify-start md:justify-center no-scrollbar">
					<Select>
						<SelectTrigger className="w-[120px] rounded-full">
							<SelectValue placeholder="Aesthetic" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="dark">Dark Academia</SelectItem>
							<SelectItem value="cottage">Cottagecore</SelectItem>
							<SelectItem value="minimal">Minimalist</SelectItem>
						</SelectContent>
					</Select>
					<Select>
						<SelectTrigger className="w-[120px] rounded-full">
							<SelectValue placeholder="Dịp" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="casual">Casual</SelectItem>
							<SelectItem value="party">Party</SelectItem>
							<SelectItem value="work">Work</SelectItem>
						</SelectContent>
					</Select>
					<Select>
						<SelectTrigger className="w-[140px] rounded-full">
							<SelectValue placeholder="Trang trọng" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="formal">Formal</SelectItem>
							<SelectItem value="semi">Semi-formal</SelectItem>
						</SelectContent>
					</Select>
					<Select>
						<SelectTrigger className="w-[110px] rounded-full">
							<SelectValue placeholder="Mùa" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="spring">Spring</SelectItem>
							<SelectItem value="summer">Summer</SelectItem>
							<SelectItem value="autumn">Autumn</SelectItem>
							<SelectItem value="winter">Winter</SelectItem>
						</SelectContent>
					</Select>
					<Select>
						<SelectTrigger className="w-[120px] rounded-full">
							<SelectValue placeholder="Màu sắc" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="red">Red</SelectItem>
							<SelectItem value="blue">Blue</SelectItem>
							<SelectItem value="green">Green</SelectItem>
							<SelectItem value="black">Black</SelectItem>
							<SelectItem value="white">White</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="flex w-full items-center space-x-2 mb-4">
				<Input
					type="search"
					placeholder="Search..."
					className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
				/>
			</div>

            <Masonry
				items={MOCK_IMAGES}
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
	);
}
