export const ADMIN_EMAILS = [
	"nguyengiaphu2k4@gmail.com",
    "linhnd2805@gmail.com",
];

export const isAdmin = (email: string | null | undefined): boolean => {
	if (!email) return false;
	return ADMIN_EMAILS.includes(email);
};
