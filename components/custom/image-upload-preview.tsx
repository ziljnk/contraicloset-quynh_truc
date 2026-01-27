"use client";

import React from "react";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	MeasuringStrategy,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	rectSortingStrategy,
	useSortable,
	defaultAnimateLayoutChanges,
	AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
	DeleteIcon,
	DeleteIconHandle,
} from "@/components/animated-icons/delete";
import { useIconAnimation } from "@/hooks/use-icon-animation";

interface SortableImageProps {
	id: string;
	url: string;
	index: number;
	onRemove: (index: number) => void;
}

function SortableImage({ id, url, index, onRemove }: SortableImageProps) {
	const deleteIcon = useIconAnimation<DeleteIconHandle>();

	// Custom animation config to handle item removal gracefully
	const animateLayoutChanges: AnimateLayoutChanges = (args) =>
		defaultAnimateLayoutChanges({ ...args, wasDragging: true });

	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id,
		animateLayoutChanges,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : 1,
	};

	return (
		<div
			ref={ setNodeRef }
			style={ style }
			{ ...attributes }
			{ ...listeners }
			className={ cn(
				"group relative aspect-[3/4] overflow-hidden rounded-lg border bg-gray-100 touch-none cursor-grab active:cursor-grabbing",
				isDragging && "opacity-50",
				index === 0 && "ring-2 ring-[#382c25]",
			) }
		>
			{/* eslint-disable-next-line @next/next/no-img-element */ }
			<img
				src={ url }
				alt={ `Preview ${index}` }
				className="h-full w-full object-cover select-none pointer-events-none"
			/>

			{/* Remove Button */ }
			<div
				className="absolute top-2 right-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
				onPointerDown={ (e) => e.stopPropagation() } // Prevent drag start
			>
				<button
					type="button"
					onClick={ (e) => {
						e.stopPropagation();
						onRemove(index);
					} }
					className="cursor-pointer rounded-full bg-white/80 p-1 hover:bg-white shadow-sm transition-colors"
					{ ...deleteIcon.events }
				>
					<DeleteIcon
						ref={ deleteIcon.ref }
						size={ 16 }
						className="text-red-500"
					/>
				</button>
			</div>

			{/* Cover Image Badge */ }
			{ index === 0 && (
				<div className="absolute bottom-0 left-0 right-0 bg-[#382c25]/80 py-1 text-center text-xs text-white">
					Ảnh bìa
				</div>
			) }
			{ index !== 0 && (
				<div className="absolute bottom-0 left-0 right-0 bg-black/50 py-1 text-center text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
					{ index + 1 }
				</div>
			) }
		</div>
	);
}

interface ImageUploadPreviewProps {
	files: File[];
	previewUrls: string[];
	setFiles: (files: File[]) => void;
	setPreviewUrls: (urls: string[]) => void;
}

export default function ImageUploadPreview({
	files,
	previewUrls,
	setFiles,
	setPreviewUrls,
}: ImageUploadPreviewProps) {
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8, // Require movement of 8px to start drag
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = previewUrls.indexOf(active.id as string);
			const newIndex = previewUrls.indexOf(over.id as string);

			if (oldIndex !== -1 && newIndex !== -1) {
				setFiles(arrayMove(files, oldIndex, newIndex));
				setPreviewUrls(arrayMove(previewUrls, oldIndex, newIndex));
			}
		}
	};

	const handleRemove = (index: number) => {
		const newFiles = [ ...files ];
		const newPreviews = [ ...previewUrls ];

		// Revoke the URL being removed
		URL.revokeObjectURL(newPreviews[ index ]);

		newFiles.splice(index, 1);
		newPreviews.splice(index, 1);

		setFiles(newFiles);
		setPreviewUrls(newPreviews);
	};

	if (previewUrls.length === 0) return null;

	return (
		<DndContext
			sensors={ sensors }
			collisionDetection={ closestCenter }
			onDragEnd={ handleDragEnd }
			measuring={ {
				droppable: {
					strategy: MeasuringStrategy.Always,
				},
			} }
		>
			<SortableContext items={ previewUrls } strategy={ rectSortingStrategy }>
				<div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-5">
					{ previewUrls.map((url, index) => (
						<SortableImage
							key={ url }
							id={ url }
							url={ url }
							index={ index }
							onRemove={ handleRemove }
						/>
					)) }
				</div>
			</SortableContext>
		</DndContext>
	);
}
