"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, Loader2, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error("Missing reset token. Please request a new password reset link.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password: data.password }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to reset password");
      }

      setIsSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Invalid Link</h1>
        <p className="text-slate-400 text-sm mb-8">
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link href="/auth/forgot-password" className="btn-primary w-full flex items-center justify-center py-3">
          Request New Link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Password Reset</h1>
        <p className="text-slate-400 text-sm mb-8">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <Link href="/auth/login" className="btn-primary w-full flex items-center justify-center py-3">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
      <p className="text-slate-400 text-sm mb-6">
        Enter your new password below to reset your account access.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Password */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5 font-medium">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              className="input-dark pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5 font-medium">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              {...register("confirmPassword")}
              type="password"
              placeholder="Re-enter new password"
              className="input-dark pl-10"
            />
          </div>
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-2xl">SkillBridge</span>
          </Link>
        </div>

        <div className="card-dark p-8">
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
            <ResetPasswordContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
