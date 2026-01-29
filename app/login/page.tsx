"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	signInWithEmailAndPassword,
	signInWithPopup,
	GoogleAuthProvider,
	FacebookAuthProvider,
} from "firebase/auth";
import { auth } from "@/utils/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2, Shirt } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setError(null);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);

		try {
			await signInWithEmailAndPassword(
				auth,
				formData.email,
				formData.password,
			);
			router.push("/"); // Redirect to home page after successful sign in
		} catch (err: any) {
			console.error(err);
			if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
				setError("Invalid email or password.");
			} else {
				setError("Failed to sign in. Please try again.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignUp = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const provider = new GoogleAuthProvider();
			await signInWithPopup(auth, provider);
			router.push("/");
		} catch (err: any) {
			console.error(err);
			setError("Failed to sign in with Google.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleFacebookSignUp = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const provider = new FacebookAuthProvider();
			await signInWithPopup(auth, provider);
			router.push("/");
		} catch (err: any) {
			console.error(err);
			setError("Failed to sign in with Facebook.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
			<div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
				<div className="flex flex-col items-center space-y-2 text-center">
					<div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#342e29] text-white">
						{/* Using Shirt as a clothes hanger proxy/logo */}
						<Shirt className="h-6 w-6" />
					</div>
					<h1 className="text-xl font-semibold tracking-tight text-gray-900">
						Welcome back to Contraicloset
					</h1>
					<p className="text-sm text-gray-500">
						Sign in to your account
					</p>
				</div>

				<div className="space-y-3">
					<Button
						variant="outline"
						className="w-full justify-center gap-2 h-10 font-normal text-gray-900 border-gray-200"
						onClick={handleGoogleSignUp}
						disabled={isLoading}
					>
						<svg className="h-4 w-4" viewBox="0 0 24 24">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Continue with Google
					</Button>
					<Button
						variant="outline"
						className="w-full justify-center gap-2 h-10 font-normal text-gray-900 border-gray-200"
						onClick={handleFacebookSignUp}
						disabled={isLoading}
					>
						<svg
							className="h-4 w-4 text-[#1877F2]"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
						</svg>
						Continue with Facebook
					</Button>
				</div>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t border-gray-200" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-white px-2 text-gray-400">Or</span>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1">
						<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900">
							Email
						</label>
						<Input
							type="email"
							name="email"
							placeholder="you@example.com"
							required
							className="text-gray-900 placeholder:text-gray-400 bg-gray-50 border-gray-200"
							value={formData.email}
							onChange={handleChange}
							disabled={isLoading}
						/>
					</div>
					<div className="space-y-1">
						<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900">
							Password
						</label>
						<div className="relative">
							<Input
								type={showPassword ? "text" : "password"}
								name="password"
								placeholder="••••••••"
								required
								className="text-gray-900 placeholder:text-gray-400 bg-gray-50 border-gray-200 pr-10"
								value={formData.password}
								onChange={handleChange}
								disabled={isLoading}
							/>
							<button
								type="button"
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ?
									<EyeOff className="h-4 w-4" />
								:	<Eye className="h-4 w-4" />}
							</button>
						</div>
					</div>

					{error && (
						<div className="text-sm text-red-500 font-medium">
							{error}
						</div>
					)}

					<Button
						type="submit"
						className="w-full h-10"
						disabled={isLoading}
					>
						{isLoading ?
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Signing in...
							</>
						:	"Sign in"}
					</Button>
				</form>

				<div className="flex flex-col gap-4 text-center text-sm">
					<div className="text-gray-500">
						Don't have an account?{" "}
						<Link
							href="/signup"
							className="font-medium text-gray-900 hover:underline"
							onClick={(e) => {
								e.preventDefault();
								toast("Tính năng đăng kí sẽ được triển khai sau");
							}}
						>
							Sign up
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
