/**
 * Admin shell — the persistent frame around every /admin page.
 *
 * FSD note: `sidebar.tsx` lives INSIDE this widget rather than being a sibling
 * widget, because slices on the same layer may not import each other. A shell
 * that needs a sidebar owns it.
 */
import { Sidebar } from "./sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    // Root body is already `flex flex-col`, so `flex-1` makes this fill it.
    <div className="flex min-h-screen w-full flex-1 flex-col lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 pb-20 lg:pb-8">{children}</main>
    </div>
  );
}

