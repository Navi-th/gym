"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  href,
  label = "Back",
  className = "",
}) => {
  const router = useRouter();

  const content = (
    <div className={`group inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors select-none ${className}`}>
      <div className="w-9 h-9 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 group-hover:bg-slate-50 group-hover:border-slate-300 group-hover:text-slate-900 transition-all active:scale-95">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
      </div>
      {label && <span>{label}</span>}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={() => router.back()} className="cursor-pointer border-none bg-transparent p-0">
      {content}
    </button>
  );
};
