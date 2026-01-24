"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface ExternalLinkIconHandle {
	startAnimation: () => void;
	stopAnimation: () => void;
}

interface ExternalLinkIconProps extends HTMLAttributes<HTMLDivElement> {
	size?: number;
}

const ARROW_VARIANTS: Variants = {
	normal: {
		x: 0,
		y: 0,
		transition: { duration: 0.3, ease: "easeInOut" },
	},
	animate: {
		x: 2,
		y: -2,
		transition: { duration: 0.3, ease: "easeInOut" },
	},
};

const ExternalLink = forwardRef<ExternalLinkIconHandle, ExternalLinkIconProps>(
	({ onMouseEnter, onMouseLeave, className, size = 24, ...props }, ref) => {
		const controls = useAnimation();
		const isControlledRef = useRef(false);

		useImperativeHandle(ref, () => {
			isControlledRef.current = true;

			return {
				startAnimation: () => controls.start("animate"),
				stopAnimation: () => controls.start("normal"),
			};
		});

		const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
			if (!isControlledRef.current) {
				controls.start("animate");
			} else {
				onMouseEnter?.(e);
			}
		};

		const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
			if (!isControlledRef.current) {
				controls.start("normal");
			} else {
				onMouseLeave?.(e);
			}
		};

		return (
			<div
				className={cn(
					"cursor-pointer select-none p-2 hover:bg-accent rounded-md transition-colors duration-200 flex items-center justify-center",
					className
				)}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				{...props}
			>
				<motion.svg
					xmlns="http://www.w3.org/2000/svg"
					width={size}
					height={size}
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<motion.path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<motion.g
						variants={ARROW_VARIANTS}
						initial="normal"
						animate={controls}
					>
						<path d="M15 3h6v6" />
						<path d="M10 14 21 3" />
					</motion.g>
				</motion.svg>
			</div>
		);
	}
);

ExternalLink.displayName = "ExternalLink";

export { ExternalLink, ExternalLink as ExternalLinkIcon };
