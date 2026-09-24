"use client";

import { useState, useTransition } from "react";
import { History, AlertCircle } from "lucide-react";
import { cn } from "@/shared/lib";

type Tab = "history" | "arrears";

interface PaymentsTabsProps {
  historyCount: number;
  duesCount: number;
  historyContent: React.ReactNode;
  arrearsContent: React.ReactNode;
}

export function PaymentsTabs({
  historyCount,
  duesCount,
  historyContent,
  arrearsContent,
}: PaymentsTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("history");
  const [isPending, startTransition] = useTransition();

  function handleTabChange(tab: Tab) {
    startTransition(() => {
      setActiveTab(tab);
    });
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200/80 pb-2.5 sm:pb-3">
        <button
          type="button"
          onClick={() => handleTabChange("history")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none min-h-[36px] sm:min-h-[40px]",
            activeTab === "history"
              ? "bg-slate-900 text-[#C4FF00] shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>Payment History</span>
          <span
            className={cn(
              "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider",
              activeTab === "history"
                ? "bg-[#C4FF00] text-slate-900"
                : "bg-slate-200 text-slate-700"
            )}
          >
            {historyCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("arrears")}
          className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all cursor-pointer select-none min-h-[36px] sm:min-h-[40px]",
            activeTab === "arrears"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span>In Arrears</span>
          {duesCount > 0 ? (
            <span
              className={cn(
                "px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider",
                activeTab === "arrears"
                  ? "bg-white text-rose-700"
                  : "bg-rose-100 text-rose-700"
              )}
            >
              {duesCount}
            </span>
          ) : (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
              0
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className={cn("transition-opacity duration-150", isPending && "opacity-60")}>
        {activeTab === "history" ? historyContent : arrearsContent}
      </div>
    </div>
  );
}
