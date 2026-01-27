"use client";

import { useAuth } from "@/hooks/use-auth";

interface AdminViewProps {
	children: React.ReactNode;
}

export const AdminView = ({ children }: AdminViewProps) => {
	const { isAdmin } = useAuth();

	if (!isAdmin) {
		return null;
	}

	return <>{children}</>;
};
