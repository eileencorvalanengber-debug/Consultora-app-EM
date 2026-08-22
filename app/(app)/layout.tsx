import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-full min-h-screen flex-col bg-slate-50 text-slate-900 md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
